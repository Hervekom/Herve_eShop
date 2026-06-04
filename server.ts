import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  initDB, saveDB, hashPassword, logActivity, 
  AdminUser, ActivityLog, DatabaseSchema, Order, Customer, Category,
  DBBanner, DBBuyingGuide, DBBlogPost, CustomerUser
} from './server/db';

const app = express();
const PORT = 3000;

// Increase request size limit to support Base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple authorization token checker
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Identification requise' });
  }
  const db = initDB();
  const sessionUser = db.adminUsers.find(u => u.id === token && u.status === 'Actif');
  if (!sessionUser) {
    return res.status(403).json({ error: 'Session invalide ou expirée' });
  }
  (req as any).user = sessionUser;
  next();
}

// 1. ALL PUBLIC API ROUTES (NO AUTH REQUIRED)

// Increment visitor count
app.get('/api/visitor-increment', (req, res) => {
  const db = initDB();
  db.visitorCount = (db.visitorCount || 0) + 1;
  saveDB(db);
  res.json({ success: true, count: db.visitorCount });
});

// Fetch unified client-facing eShop content
app.get('/api/client/data', (req, res) => {
  const db = initDB();
  // Filter out disabled products
  const activeProducts = db.products; // all products for the client list (status handles display)
  res.json({
    products: activeProducts,
    categories: db.categories.filter(c => c.status === 'Actif'),
    siteCMS: db.siteCMS,
    contactCMS: db.contactCMS,
    socialCMS: db.socialCMS,
    banners: db.banners.filter(b => b.status === 'Actif'),
    buyingGuides: db.buyingGuides,
    blogPosts: db.blogPosts.filter(p => p.status === 'Publié')
  });
});

// Submit quote request from public checkout
app.post('/api/client/quote', (req, res) => {
  const { clientName, clientPhone, clientEmail, clientCity, laptopId, customizations, additionalNotes, finalPrice } = req.body;
  if (!clientName || !clientPhone || !laptopId) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Laptop).' });
  }

  const db = initDB();
  const laptop = db.products.find(p => p.id === laptopId);
  if (!laptop) {
    return res.status(404).json({ error: 'Ordinateur introuvable.' });
  }

  // Auto-generate random quote reference ID
  const refLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const refNum = Math.floor(1000 + Math.random() * 9000);
  const refCode1 = refLetters[Math.floor(Math.random() * 26)];
  const refCode2 = refLetters[Math.floor(Math.random() * 26)];
  const quoteId = `DEV-${refCode1}${refCode2}${refNum}`;

  // Subtract stock if possible
  if (laptop.stockQuantity > 0) {
    laptop.stockQuantity -= 1;
    if (laptop.stockQuantity === 0) {
      laptop.status = 'Rupture';
    }
  }

  const orderNumber = `CMD-${Math.floor(10000 + Math.random() * 90000)}`;

  const newOrder: Order = {
    id: quoteId,
    orderNumber,
    clientName,
    clientPhone,
    clientEmail: clientEmail || '',
    clientCity,
    laptopId,
    laptopBrand: laptop.brand,
    laptopModel: laptop.model,
    basePrice: laptop.price,
    finalPrice: finalPrice || laptop.price,
    customizations: {
      ramUpgrade: customizations?.ramUpgrade || 'Aucune',
      storageUpgrade: customizations?.storageUpgrade || 'Aucun',
      osOption: customizations?.osOption || "Windows d'origine / macOS natif",
      accessories: customizations?.accessories || []
    },
    additionalNotes: additionalNotes || '',
    status: 'Demande reçue',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // Update or insert client history
  let existingCustomer = db.customers.find(c => c.phone === clientPhone || (clientEmail && c.email === clientEmail));
  if (existingCustomer) {
    existingCustomer.totalSpent += newOrder.finalPrice;
    existingCustomer.ordersCount += 1;
  } else {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: clientName,
      email: clientEmail || '',
      phone: clientPhone,
      city: clientCity,
      totalSpent: newOrder.finalPrice,
      ordersCount: 1,
      createdAt: new Date().toISOString()
    };
    db.customers.unshift(newCustomer);
  }

  // Create notifications for administration
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'Nouvelle commande soumise ! 📥',
    message: `${clientName} (${clientCity}) sollicite un devis pour : ${laptop.brand} ${laptop.model} (${newOrder.finalPrice.toLocaleString()} FCFA).`,
    type: 'success',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);

  // Log system activity
  logActivity('system', 'client-checkout@herve.cm', 'Client', 'Création Devis & Commande automatique', quoteId, 'Commande', undefined, newOrder);

  res.json({ success: true, quote: newOrder });
});

// Client quote lookup tracking API
app.get('/api/client/quote/:id', (req, res) => {
  const db = initDB();
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Demande de devis introuvable.' });
  }
  res.json(order);
});

// 1.5 CUSTOMER USER REGISTER & AUTHENTICATION API

// Customer Registration
app.post('/api/client/auth/register', (req, res) => {
  const { name, email, phone, city, password } = req.body;
  
  if (!name || !city || !password) {
    return res.status(400).json({ error: 'Le nom complet, la ville, et le mot de passe sont obligatoires.' });
  }

  if (!email && !phone) {
    return res.status(400).json({ error: 'Veuillez renseigner au moins une adresse email ou un numéro de téléphone.' });
  }

  const db = initDB();
  db.users = db.users || [];

  // Check unique email
  if (email) {
    const emailExists = db.users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà.' });
    }
  }

  // Check unique phone
  if (phone) {
    const phoneExists = db.users.some(u => u.phone && u.phone === phone);
    if (phoneExists) {
      return res.status(400).json({ error: 'Un compte avec ce numéro de téléphone existe déjà.' });
    }
  }

  const userId = `user-${Date.now()}`;
  const newUser: CustomerUser = {
    id: userId,
    name,
    email: email || '',
    phone: phone || '',
    city,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Link or create regular customer record as well for admin panels compatibility
  let existingCust = db.customers.find(c => (phone && c.phone === phone) || (email && c.email?.toLowerCase() === email.toLowerCase()));
  if (!existingCust) {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name,
      email: email || '',
      phone: phone || '',
      city,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString()
    };
    db.customers.unshift(newCustomer);
  }

  saveDB(db);

  logActivity(newUser.id, email || phone || 'client', 'Client', 'Création de compte client', newUser.id, 'Client');

  res.json({
    success: true,
    token: newUser.id,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      city: newUser.city
    }
  });
});

// Customer Login
app.post('/api/client/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'L\'identifiant (email ou téléphone) et le mot de passe sont obligatoires.' });
  }

  const db = initDB();
  db.users = db.users || [];

  const hash = hashPassword(password);
  
  // Find customer user with matching email or phone and password hash
  const user = db.users.find(u => 
    ((u.email && u.email.toLowerCase() === identifier.toLowerCase()) || (u.phone && u.phone === identifier)) && 
    u.passwordHash === hash
  );

  if (!user) {
    return res.status(401).json({ error: 'Identifiants de connexion invalides. Veuillez vérifier et réessayer.' });
  }

  res.json({
    success: true,
    token: user.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city
    }
  });
});

// Customer Token Authenticator Helper
function getCustomerFromRequest(req: express.Request): CustomerUser | null {
  const token = req.headers['authorization-customer'] || req.headers['authorization'];
  if (!token) return null;

  const db = initDB();
  db.users = db.users || [];
  return db.users.find(u => u.id === token) || null;
}

// Get Customer Profile & Associated Orders for tracking
app.get('/api/client/auth/profile', (req, res) => {
  const user = getCustomerFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Session client invalide ou expirée.' });
  }

  const db = initDB();
  
  // Retrieve all orders associated with this user
  const userOrders = db.orders.filter(o => 
    (user.email && o.clientEmail && o.clientEmail.toLowerCase() === user.email.toLowerCase()) || 
    (user.phone && o.clientPhone && o.clientPhone === user.phone)
  );

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt
    },
    orders: userOrders
  });
});

// Update Customer Profile
app.put('/api/client/auth/profile', (req, res) => {
  const user = getCustomerFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Session client invalide ou expirée.' });
  }

  const { name, email, phone, city, password } = req.body;
  const db = initDB();
  db.users = db.users || [];

  const foundIndex = db.users.findIndex(u => u.id === user.id);
  if (foundIndex === -1) {
    return res.status(404).json({ error: 'Compte utilisateur introuvable.' });
  }

  const dbUser = db.users[foundIndex];

  // Validation if email changed
  if (email && email.toLowerCase() !== dbUser.email.toLowerCase()) {
    const emailExists = db.users.some(u => u.id !== user.id && u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: 'Cet email est déjà pris par un autre utilisateur.' });
    }
    dbUser.email = email;
  }

  // Validation if phone changed
  if (phone && phone !== dbUser.phone) {
    const phoneExists = db.users.some(u => u.id !== user.id && u.phone && u.phone === phone);
    if (phoneExists) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà pris par un autre utilisateur.' });
    }
    dbUser.phone = phone;
  }

  if (name) dbUser.name = name;
  if (city) dbUser.city = city;
  if (password) {
    dbUser.passwordHash = hashPassword(password);
  }

  db.users[foundIndex] = dbUser;

  // Sync to regular customer profiles
  const matchingCustomer = db.customers.find(c => 
    (phone && c.phone === phone) || 
    (email && c.email?.toLowerCase() === email.toLowerCase())
  );
  if (matchingCustomer) {
    if (name) matchingCustomer.name = name;
    if (city) matchingCustomer.city = city;
    if (email) matchingCustomer.email = email;
    if (phone) matchingCustomer.phone = phone;
  }

  saveDB(db);

  res.json({
    success: true,
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      city: dbUser.city
    }
  });
});

// 2. ADMINISTRATOR PORTAL AUTHENTICATION API

// Administrator Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe obligatoires' });
  }
  const db = initDB();
  const hash = hashPassword(password);
  const user = db.adminUsers.find(u => u.email === email && u.passwordHash === hash);
  if (!user) {
    return res.status(401).json({ error: 'Identifiants invalides ou compte inactif.' });
  }
  if (user.status !== 'Actif') {
    return res.status(403).json({ error: 'Votre compte administrateur a été désactivé par un administrateur principal.' });
  }

  logActivity(user.id, user.email, user.role, 'Connexion réussie', user.id, 'Utilisateur');
  res.json({ success: true, token: user.id, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

// Admin Self Verification
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

// Admin Password Update
app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Veuillez renseigner l\'ancien et le nouveau mot de passe.' });
  }
  const db = initDB();
  const admin = db.adminUsers.find(u => u.id === user.id);
  if (!admin || admin.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: 'Ancien mot de passe incorrect' });
  }
  
  admin.passwordHash = hashPassword(newPassword);
  saveDB(db);
  logActivity(admin.id, admin.email, admin.role, 'Changement de mot de passe', admin.id, 'Utilisateur');
  res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
});

// Admin Users CRUD Management (Super Admin ONLY)
app.get('/api/admin/users', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  const db = initDB();
  res.json(db.adminUsers.map(({ passwordHash, ...rest }) => rest)); // Exclude hashes
});

app.post('/api/admin/users', authenticate, (req, res) => {
  const currentUser = (req as any).user;
  if (currentUser.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires pour créer un administrateur.' });
  }

  const db = initDB();
  if (db.adminUsers.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre administrateur.' });
  }

  const newUser: AdminUser = {
    id: `u-${Date.now()}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role,
    status: 'Actif',
    createdAt: new Date().toISOString()
  };

  db.adminUsers.push(newUser);
  saveDB(db);
  logActivity(currentUser.id, currentUser.email, currentUser.role, 'Création Utilisateur Staff', newUser.id, 'Utilisateur Admin', undefined, { name, email, role });
  res.json({ success: true, user: newUser });
});

app.put('/api/admin/users/:id', authenticate, (req, res) => {
  const currentUser = (req as any).user;
  if (currentUser.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  const { name, role, status, password } = req.body;
  const db = initDB();
  const admin = db.adminUsers.find(u => u.id === req.params.id);
  if (!admin) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  const old = { ...admin };
  if (name) admin.name = name;
  if (role) admin.role = role;
  if (status) admin.status = status;
  if (password) admin.passwordHash = hashPassword(password);

  saveDB(db);
  logActivity(currentUser.id, currentUser.email, currentUser.role, 'Modification Utilisateur Staff', admin.id, 'Utilisateur Admin', old, admin);
  res.json({ success: true, message: 'Administrateur édité.' });
});

app.delete('/api/admin/users/:id', authenticate, (req, res) => {
  const currentUser = (req as any).user;
  if (currentUser.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  if (currentUser.id === req.params.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même !' });
  }

  const db = initDB();
  const target = db.adminUsers.find(u => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  db.adminUsers = db.adminUsers.filter(u => u.id !== req.params.id);
  saveDB(db);
  logActivity(currentUser.id, currentUser.email, currentUser.role, 'Suppression Utilisateur Staff', req.params.id, 'Utilisateur Admin', target, undefined);
  res.json({ success: true, message: 'Administrateur retiré définis.' });
});

// 3. PRODUCTS CRUD (AUTHENTICATED)

app.get('/api/admin/products', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.products);
});

app.post('/api/admin/products', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') {
    return res.status(403).json({ error: 'Les Éditeurs ne peuvent modifier l\'inventaire technique.' });
  }

  const db = initDB();
  const newProduct = {
    ...req.body,
    id: req.body.id || `lpt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Création de Produit', newProduct.id, 'Produit', undefined, newProduct);
  res.json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') {
    return res.status(403).json({ error: 'Les Éditeurs ne peuvent pas éditer de produits.' });
  }

  const db = initDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  const oldProduct = { ...db.products[index] };
  db.products[index] = {
    ...db.products[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Modification de Produit (Spec / Stock)', req.params.id, 'Produit', oldProduct, db.products[index]);
  res.json({ success: true, product: db.products[index] });
});

app.delete('/api/admin/products/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') {
    return res.status(403).json({ error: 'Les Éditeurs ne peuvent pas supprimer des articles en rayon.' });
  }

  const db = initDB();
  const target = db.products.find(p => p.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Produit non trouvé.' });
  }

  db.products = db.products.filter(p => p.id !== req.params.id);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Suppression définitive produit', req.params.id, 'Produit', target, undefined);
  res.json({ success: true, message: 'Produit retiré.' });
});

// 4. CATEGORIES CRUD

app.post('/api/admin/categories', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') return res.status(403).json({ error: 'Droits insuffisants.' });

  const db = initDB();
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: req.body.name,
    description: req.body.description || '',
    image: req.body.image || '',
    icon: req.body.icon || 'Laptop',
    displayOrder: req.body.displayOrder || db.categories.length + 1,
    status: req.body.status || 'Actif'
  };

  db.categories.push(newCat);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Création Catégorie', newCat.id, 'Catégorie', undefined, newCat);
  res.json({ success: true, category: newCat });
});

app.put('/api/admin/categories/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') return res.status(403).json({ error: 'Droits insuffisants.' });

  const db = initDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Inexistant' });

  const old = { ...cat };
  Object.assign(cat, req.body);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Modification Catégorie', cat.id, 'Catégorie', old, cat);
  res.json({ success: true, category: cat });
});

app.delete('/api/admin/categories/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') return res.status(403).json({ error: 'Droits insuffisants.' });

  const db = initDB();
  const target = db.categories.find(c => c.id === req.params.id);
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Suppression Catégorie', req.params.id, 'Catégorie', target, undefined);
  res.json({ success: true, message: 'Supprimé.' });
});

// 5. ORDERS CRUD (ADMIN ACTIONS)

app.get('/api/admin/orders', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.orders);
});

app.put('/api/admin/orders/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const { status, finalPrice } = req.body;

  const db = initDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Devis non trouvé' });
  }

  const old = { ...order };
  if (status) order.status = status;
  if (finalPrice !== undefined) order.finalPrice = Number(finalPrice);
  order.updatedAt = new Date().toISOString();

  // Custom user alert trigger in notifications
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `Statut Commande ${order.id} !`,
    message: `Le devis de M./Mme ${order.clientName} a été basculé au statut : "${status}" par l'administrateur.`,
    type: 'info',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  logActivity(user.id, user.email, user.role, `Mise à jour Devis/Statut : ${status}`, order.id, 'Commande', old, order);
  res.json({ success: true, order });
});

app.delete('/api/admin/orders/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Seul le Super Admin peut archiver et supprimer définitivement un bon de commande.' });
  }
  const db = initDB();
  const target = db.orders.find(o => o.id === req.params.id);
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Suppression Commande Devis', req.params.id, 'Commande', target, undefined);
  res.json({ success: true });
});

// 6. CUSTOMS VIEW

app.get('/api/admin/customers', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.customers);
});

// 7. PUBLIC CMS EDITORS

app.put('/api/admin/cms/site', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const old = { ...db.siteCMS };
  db.siteCMS = { ...db.siteCMS, ...req.body };
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Édition CMS Contenu Site', 'site_cms', 'CMS', old, db.siteCMS);
  res.json({ success: true, cms: db.siteCMS });
});

app.put('/api/admin/cms/contact', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const old = { ...db.contactCMS };
  db.contactCMS = { ...db.contactCMS, ...req.body };
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Édition CMS Coordonnées Contact', 'contact_cms', 'CMS', old, db.contactCMS);
  res.json({ success: true, cms: db.contactCMS });
});

app.put('/api/admin/cms/social', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const old = { ...db.socialCMS };
  db.socialCMS = { ...db.socialCMS, ...req.body };
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Édition CMS Réseaux Sociaux', 'social_cms', 'CMS', old, db.socialCMS);
  res.json({ success: true, cms: db.socialCMS });
});

// 8. BANNERS

app.get('/api/admin/banners', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.banners);
});

app.post('/api/admin/banners', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const newB: DBBanner = {
    id: `banner-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'Actif'
  };
  db.banners.push(newB);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Ajout Bannière Pub', newB.id, 'Bannière', undefined, newB);
  res.json({ success: true, banner: newB });
});

app.put('/api/admin/banners/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const banner = db.banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ error: 'Non trouvé' });
  const old = { ...banner };
  Object.assign(banner, req.body);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Modification Bannière Pub', banner.id, 'Bannière', old, banner);
  res.json({ success: true, banner });
});

app.delete('/api/admin/banners/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const target = db.banners.find(b => b.id === req.params.id);
  db.banners = db.banners.filter(b => b.id !== req.params.id);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Suppression Bannière Pub', req.params.id, 'Bannière', target, undefined);
  res.json({ success: true });
});

// 9. BUYING GUIDES

app.get('/api/admin/guides', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.buyingGuides);
});

app.post('/api/admin/guides', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const newG: DBBuyingGuide = {
    id: req.body.id || `guide-${Date.now()}`,
    ...req.body
  };
  db.buyingGuides.push(newG);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Ajout Guide d\'Achat', newG.id, 'Guide', undefined, newG);
  res.json({ success: true, guide: newG });
});

app.put('/api/admin/guides/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const guide = db.buyingGuides.find(g => g.id === req.params.id);
  if (!guide) return res.status(404).json({ error: 'Non trouvé' });
  const old = { ...guide };
  Object.assign(guide, req.body);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Modification Guide d\'Achat', guide.id, 'Guide', old, guide);
  res.json({ success: true, guide });
});

app.delete('/api/admin/guides/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const target = db.buyingGuides.find(g => g.id === req.params.id);
  db.buyingGuides = db.buyingGuides.filter(g => g.id !== req.params.id);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Suppression Guide d\'Achat', req.params.id, 'Guide', target, undefined);
  res.json({ success: true });
});

// 10. BLOG & NEWS CMS

app.get('/api/admin/blog', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.blogPosts);
});

app.post('/api/admin/blog', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const newPost: DBBlogPost = {
    id: `post-${Date.now()}`,
    slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    ...req.body,
    createdAt: new Date().toISOString(),
    publishedAt: req.body.status === 'Publié' ? new Date().toISOString() : undefined
  };
  db.blogPosts.unshift(newPost);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Création Article Blog', newPost.id, 'Blog', undefined, newPost);
  res.json({ success: true, post: newPost });
});

app.put('/api/admin/blog/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const post = db.blogPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Article introuvable' });
  const old = { ...post };

  Object.assign(post, req.body);
  if (req.body.status === 'Publié' && !post.publishedAt) {
    post.publishedAt = new Date().toISOString();
  }

  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Modification Article Blog', post.id, 'Blog', old, post);
  res.json({ success: true, post });
});

app.delete('/api/admin/blog/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const db = initDB();
  const target = db.blogPosts.find(p => p.id === req.params.id);
  db.blogPosts = db.blogPosts.filter(p => p.id !== req.params.id);
  saveDB(db);
  logActivity(user.id, user.email, user.role, 'Suppression Article Blog', req.params.id, 'Blog', target, undefined);
  res.json({ success: true });
});

// 11. CENTRALIZED NOTIFICATIONS

app.get('/api/admin/notifications', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.notifications);
});

app.put('/api/admin/notifications/read', authenticate, (req, res) => {
  const db = initDB();
  db.notifications.forEach(n => n.isRead = true);
  saveDB(db);
  res.json({ success: true });
});

app.delete('/api/admin/notifications/:id', authenticate, (req, res) => {
  const db = initDB();
  db.notifications = db.notifications.filter(n => n.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// 12. SEARCH SYSTEM LOGS

app.get('/api/admin/logs', authenticate, (req, res) => {
  const db = initDB();
  res.json(db.activityLogs);
});

// 13. SECURE MEDIA MANAGER BASE64 UPLOADS

app.get('/api/admin/media', authenticate, (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const media = files.map(file => {
      const stats = fs.statSync(path.join(UPLOADS_DIR, file));
      return {
        name: file,
        url: `/uploads/${file}`,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    });
    // Sort youngest first
    media.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: 'Impossible d\'explorer le dossier uploads' });
  }
});

app.post('/api/admin/media/upload', authenticate, (req, res) => {
  const { fileName, base64Data } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Nom de fichier et données base64 manquants.' });
  }

  try {
    // Strip header metadata if exists (e.g. "data:image/png;base64,")
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Make filename url secure
    const ext = path.extname(fileName) || '.jpg';
    const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const secureName = `${base}-${Date.now()}${ext}`;

    const filePath = path.join(UPLOADS_DIR, secureName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${secureName}`;
    res.json({ success: true, url: fileUrl, name: secureName });
  } catch (err) {
    res.status(500).json({ error: `Erreur d'écriture de fichier: ${(err as Error).message}` });
  }
});

app.delete('/api/admin/media/:filename', authenticate, (req, res) => {
  const filename = req.params.filename;
  // Protect path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Nom de fichier invalide' });
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de supprimer le fichier physique du serveur.' });
  }
});

// 14. ADMIN DATABASE EXPORTS (BACKUP)

app.get('/api/admin/backup/export', authenticate, (req, res) => {
  const db = initDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=Herve-eShop-Backup-${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/admin/backup/import', authenticate, (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis pour écraser et restaurer la base.' });
  }

  const { jsonContent } = req.body;
  if (!jsonContent) {
    return res.status(400).json({ error: 'Fichier vide' });
  }

  try {
    const rawData = JSON.parse(jsonContent);
    // Rough schema validation
    if (!rawData.products || !rawData.categories || !rawData.orders || !rawData.adminUsers) {
      throw new Error('Format de schéma non valide.');
    }

    saveDB(rawData);
    logActivity(user.id, user.email, user.role, 'Restauration complète de la base de données (Backup Import)', 'database', 'System');
    res.json({ success: true, message: 'Restauration complète effectuée.' });
  } catch (err) {
    res.status(400).json({ error: `Fichier incorrect : ${(err as Error).message}` });
  }
});

// 15. COMPLEX ANALYTICS CONSOLE REPORT

app.get('/api/admin/analytics', authenticate, (req, res) => {
  const db = initDB();
  
  const totalProducts = db.products.length;
  const activeProducts = db.products.filter(p => p.status === 'Disponible').length;
  const outOfStock = db.products.filter(p => p.stockQuantity === 0).length;
  const disabledProducts = db.products.filter(p => p.status === 'Rupture' && p.stockQuantity === 0).length;

  const ordersCount = db.orders.length;
  
  // Calculate total validated revenue
  const totalRevenue = db.orders
    .filter(o => o.status !== 'Refusé')
    .reduce((sum, o) => sum + o.finalPrice, 0);

  // Group revenue by Month
  const revenueByMonth: Record<string, number> = {};
  const ordersByMonth: Record<string, number> = {};

  db.orders.forEach(o => {
    const date = new Date(o.createdAt);
    const monthKey = date.toLocaleString('fr-FR', { month: 'short' }) + ' ' + date.getFullYear();
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + o.finalPrice;
    ordersByMonth[monthKey] = (ordersByMonth[monthKey] || 0) + 1;
  });

  const chartData = Object.keys(revenueByMonth).map(key => ({
    name: key,
    revenue: revenueByMonth[key],
    orders: ordersByMonth[key]
  })).reverse();

  // Find most requested items
  const popularCounts: Record<string, { count: number; name: string; brand: string; revenue: number }> = {};
  db.orders.forEach(o => {
    const key = o.laptopId;
    if (!popularCounts[key]) {
      popularCounts[key] = { count: 0, name: o.laptopModel, brand: o.laptopBrand, revenue: 0 };
    }
    popularCounts[key].count += 1;
    popularCounts[key].revenue += o.finalPrice;
  });

  const popularLaptops = Object.values(popularCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    metrics: {
      totalProducts,
      activeProducts,
      outOfStock,
      disabledProducts,
      ordersCount,
      totalRevenue,
      visitorCount: db.visitorCount || 1248,
      conversionRate: ordersCount > 0 ? ((ordersCount / (db.visitorCount || 1248)) * 100).toFixed(1) + '%' : '0%'
    },
    performanceChart: chartData.length > 0 ? chartData : [{ name: 'Juin 2026', revenue: totalRevenue || 1410000, orders: ordersCount || 1 }],
    popularLaptops
  });
});

// VITE MIDDLEWARE INTERPOLATOR Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Herve_eShop Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
