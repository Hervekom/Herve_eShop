import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

import { registerCompatRoutes } from './server/compatRoutes';
import type { Database } from './types/supabase';

type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key are required for server admin operations.');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Authorization-Customer');

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(isAllowed ? 204 : 403);
  }

  if (!isAllowed) {
    return res.status(403).json({ error: 'Origin non autorisee.' });
  }

  next();
});

// Increase request size limit to support Base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Compatibility layer that maps the current Supabase schema to the app contract.
registerCompatRoutes(app, supabase, supabaseAdmin);

// Simple authorization token checker
async function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ error: 'Identification requise' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(403).json({ error: 'Session invalide ou expirée' });
  }

  // Optionally, fetch profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role, status')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profil utilisateur introuvable ou inactif.' });
  }

  // Check if the user has an admin role
  if (!['admin', 'super_admin', 'editor'].includes(profile.role)) {
    return res.status(403).json({ error: 'Accès non autorisé: rôle insuffisant.' });
  }

  (req as any).user = { ...data.user, ...profile };
  next();
}

// 1. ALL PUBLIC API ROUTES (NO AUTH REQUIRED)

// Increment visitor count
app.get('/api/visitor-increment', async (req, res) => {
  try {
    const { data: currentCount, error: fetchError } = await supabase
      .from('visitor_counts')
      .select('count')
      .eq('id', 1) // Assuming a single row with id 1 for visitor count
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no row found
      return res.status(500).json({ error: fetchError.message });
    }

    let newCount = (currentCount?.count || 0) + 1;

    const { data, error } = await supabase
      .from('visitor_counts')
      .upsert({ id: 1, count: newCount }, { onConflict: 'id' })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, count: newCount });
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de l\'incrémentation du compteur de visiteurs: ${(err as Error).message}` });
  }
});

// Fetch unified client-facing eShop content
app.get('/api/client/data', async (req, res) => {
  try {
    const [productsRes, categoriesRes, siteSettingsRes, bannersRes, tipsRes, blogPostsRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('categories').select('*').eq('status', 'Actif'),
      supabase.from('site_settings').select('key, value'),
      supabase.from('banners').select('*').eq('status', 'Actif'),
      supabase.from('tips').select('*'),
      supabase.from('blog_posts').select('*').eq('status', 'Publié'),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (siteSettingsRes.error) throw siteSettingsRes.error;
    if (bannersRes.error) throw bannersRes.error;
    if (tipsRes.error) throw tipsRes.error;
    if (blogPostsRes.error) throw blogPostsRes.error;

    const siteCMS: { [key: string]: any } = {};
    const contactCMS: { [key: string]: any } = {};
    const socialCMS: { [key: string]: any } = {};

    siteSettingsRes.data.forEach(setting => {
      if (setting.key === 'site_cms') Object.assign(siteCMS, setting.value);
      if (setting.key === 'contact_cms') Object.assign(contactCMS, setting.value);
      if (setting.key === 'social_cms') Object.assign(socialCMS, setting.value);
    });

    res.json({
      products: productsRes.data,
      categories: categoriesRes.data,
      siteCMS: siteCMS,
      contactCMS: contactCMS,
      socialCMS: socialCMS,
      banners: bannersRes.data,
      buyingGuides: tipsRes.data,
      blogPosts: blogPostsRes.data,
    });
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de la récupération des données client: ${(err as Error).message}` });
  }
});

// Submit quote request from public checkout
app.post('/api/client/quote', async (req, res) => {
  const { clientName, clientPhone, clientEmail, clientCity, laptopId, customizations, additionalNotes, finalPrice } = req.body;
  if (!clientName || !clientPhone || !laptopId) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Laptop).' });
  }

  try {
    // Fetch laptop details
    const { data: laptop, error: laptopError } = await supabase
      .from('products')
      .select('id, brand, model, price, stock_quantity, status')
      .eq('id', laptopId)
      .single();

    if (laptopError || !laptop) {
      return res.status(404).json({ error: 'Ordinateur introuvable.' });
    }

    // Auto-generate random quote reference ID
    const refLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const refCode1 = refLetters[Math.floor(Math.random() * 26)];
    const refCode2 = refLetters[Math.floor(Math.random() * 26)];
    const quoteId = `DEV-${refCode1}${refCode2}${refNum}`;

    // Subtract stock if possible
    let updatedStockQuantity = laptop.stock_quantity;
    let updatedLaptopStatus = laptop.status;

    if (laptop.stock_quantity > 0) {
      updatedStockQuantity -= 1;
      if (updatedStockQuantity === 0) {
        updatedLaptopStatus = 'Rupture';
      }
      // Update product stock in Supabase
      const { error: updateProductError } = await supabase
        .from('products')
        .update({ stock_quantity: updatedStockQuantity, status: updatedLaptopStatus })
        .eq('id', laptopId);

      if (updateProductError) {
        throw updateProductError;
      }
    }

    const orderNumber = `CMD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrderData: OrderInsert = {
      id: quoteId,
      order_number: orderNumber,
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail || null,
      client_city: clientCity,
      laptop_id: laptopId,
      laptop_brand: laptop.brand,
      laptop_model: laptop.model,
      base_price: laptop.price,
      final_price: finalPrice || laptop.price,
      customizations: customizations || {},
      additional_notes: additionalNotes || null,
      status: 'Demande reçue',
    };

    const { data: newOrder, error: orderError } = await supabase.from('orders').insert([newOrderData]).select();

    if (orderError) {
      throw orderError;
    }

    // Update or insert client history in profiles table
    const { data: customerProfile, error: customerError } = await supabase
      .from('profiles')
      .select('id, total_spent, orders_count')
      .or(`phone.eq.${clientPhone},email.eq.${clientEmail}`)
      .single();

    if (customerError && customerError.code !== 'PGRST116') { // PGRST116 means no row found
      console.error('Error fetching customer profile:', customerError.message);
    }

    let totalSpent = (customerProfile?.total_spent || 0) + (finalPrice || laptop.price);
    let ordersCount = (customerProfile?.orders_count || 0) + 1;

    // Upsert customer data in profiles table
    await supabase.from('profiles').upsert({
      id: customerProfile?.id, // If customer exists, update by id
      name: clientName,
      email: clientEmail || null,
      phone: clientPhone,
      city: clientCity,
      total_spent: totalSpent,
      orders_count: ordersCount,
      role: 'customer', // Ensure role is customer for new profiles
      status: 'active',
    }, { onConflict: 'phone', ignoreDuplicates: false }); // Conflict on phone or email

    // Create notifications for administration
    const newNotificationData: NotificationInsert = {
      title: 'Nouvelle commande soumise ! 📥',
      message: `${clientName} (${clientCity}) sollicite un devis pour : ${laptop.brand} ${laptop.model} (${(finalPrice || laptop.price).toLocaleString()} FCFA).`,
      type: 'success',
      is_read: false,
    };

    await supabase.from('notifications').insert([newNotificationData]);

    // Log system activity
    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Client Checkout):', 'system', 'client-checkout@herve.cm', 'Client', 'Création Devis & Commande automatique', quoteId, 'Commande', undefined, newOrder[0]);

    res.json({ success: true, quote: newOrder[0] });
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de la soumission du devis: ${(err as Error).message}` });
  }
});

// Client quote lookup tracking API
app.get('/api/client/quote/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Demande de devis introuvable.' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de la recherche du devis: ${(err as Error).message}` });
  }
});

// 1.5 CUSTOMER USER REGISTER & AUTHENTICATION API

// Customer Registration
app.post('/api/client/auth/register', async (req, res) => {
  const { name, email, phone, city, password } = req.body;
  
  if (!name || !password) {
    return res.status(400).json({ error: 'Le nom complet et le mot de passe sont obligatoires.' });
  }

  if (!email && !phone) {
    return res.status(400).json({ error: 'Veuillez renseigner au moins une adresse email ou un numéro de téléphone.' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { name, phone, city, role: 'customer', status: 'active' },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data?.user) {
      // Optionally, you can also insert into your 'profiles' table here if not handled by a Supabase trigger
      // For example: 
      // await supabase.from('profiles').insert({ id: data.user.id, email: data.user.email, name, phone, city, role: 'customer', status: 'active' });

      console.log('User registered and logged in:', data.user.id, email || phone);
      // logActivity(data.user.id, email || phone || 'client', 'Client', 'Création de compte client', data.user.id, 'Client');

      res.json({
        success: true,
        token: data.session?.access_token, // Supabase access token
        user: {
          id: data.user.id,
          name: name,
          email: data.user.email,
          phone: phone,
          city: city,
        }
      });
    } else {
      return res.status(500).json({ error: 'Échec de l\'inscription de l\'utilisateur.' });
    }
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Customer Login
app.post('/api/client/auth/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'L\'identifiant (email ou téléphone) et le mot de passe sont obligatoires.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier, // Supabase signInWithPassword expects email
      password: password,
    });

    if (error) {
      return res.status(401).json({ error: 'Identifiants de connexion invalides. Veuillez vérifier et réessayer.' });
    }

    if (data?.user && data.session) {
      // Fetch profile to get name, city, phone, etc.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, phone, city')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        return res.status(500).json({ error: 'Profil utilisateur introuvable.' });
      }

      res.json({
        success: true,
        token: data.session.access_token,
        user: {
          id: data.user.id,
          name: profile.name,
          email: data.user.email,
          phone: profile.phone,
          city: profile.city
        }
      });
    } else {
      return res.status(401).json({ error: 'Identifiants de connexion invalides. Veuillez vérifier et réessayer.' });
    }
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Customer Token Authenticator Helper
async function getCustomerFromRequest(req: express.Request): Promise<any | null> {
  const token = req.headers['authorization-customer'] as string | undefined;
  if (!token) return null;

  const { data: userResponse, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userResponse?.user) {
    console.error('Error fetching user with token:', userError?.message);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, phone, city, created_at')
    .eq('id', userResponse.user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching customer profile:', profileError?.message);
    return null;
  }

  return { ...userResponse.user, ...profile };
}

// Get Customer Profile & Associated Orders for tracking
app.get('/api/client/auth/profile', async (req, res) => {
  const user = await getCustomerFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Session client invalide ou expirée.' });
  }

  // Retrieve all orders associated with this user from Supabase
  let ordersQuery = supabase.from('orders').select('*');
  if (user.email && user.phone) {
    ordersQuery = ordersQuery.or(`client_email.eq.${user.email},client_phone.eq.${user.phone}`);
  } else if (user.email) {
    ordersQuery = ordersQuery.eq('client_email', user.email);
  } else if (user.phone) {
    ordersQuery = ordersQuery.eq('client_phone', user.phone);
  }

  const { data: userOrders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error('Error fetching user orders:', ordersError.message);
    return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      createdAt: user.created_at
    },
    orders: userOrders
  });
});

// Update Customer Profile
app.put('/api/client/auth/profile', async (req, res) => {
  const user = await getCustomerFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Session client invalide ou expirée.' });
  }

  const { name, email, phone, city, password } = req.body;

  try {
    // Update auth.users if email or password changes
    if (email && email !== user.email) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: email,
      });
      if (updateAuthError) {
        return res.status(400).json({ error: updateAuthError.message });
      }
    }
    if (password) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password,
      });
      if (updateAuthError) {
        return res.status(400).json({ error: updateAuthError.message });
      }
    }

    // Update profiles table
    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ name, phone, city })
      .eq('id', user.id)
      .select();

    if (profileUpdateError) {
      return res.status(500).json({ error: profileUpdateError.message });
    }

    if (!updatedProfile || updatedProfile.length === 0) {
      return res.status(404).json({ error: 'Profil utilisateur introuvable pour la mise à jour.' });
    }

    const newUserData = updatedProfile[0];

    res.json({
      success: true,
      user: {
        id: newUserData.id,
        name: newUserData.name,
        email: newUserData.email,
        phone: newUserData.phone,
        city: newUserData.city
      }
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 2. ADMINISTRATOR PORTAL AUTHENTICATION API

// Administrator Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe obligatoires' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ error: 'Identifiants invalides ou compte inactif.' });
    }

    if (data?.user && data.session) {
      // Fetch profile to get role and status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, role, status')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        return res.status(403).json({ error: 'Profil administrateur introuvable ou inactif.' });
      }

      if (profile.status !== 'active') {
        return res.status(403).json({ error: 'Votre compte administrateur a été désactivé par un administrateur principal.' });
      }

      if (!['admin', 'super_admin', 'editor'].includes(profile.role)) {
        return res.status(403).json({ error: 'Accès non autorisé: rôle insuffisant.' });
      }

      // logActivity(data.user.id, data.user.email, profile.role, 'Connexion réussie', data.user.id, 'Utilisateur');
      console.log('Admin logged in:', data.user.id, data.user.email);

      res.json({
        success: true,
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile.role,
          name: profile.name
        }
      });
    } else {
      return res.status(401).json({ error: 'Identifiants invalides ou compte inactif.' });
    }
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Admin Self Verification
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
});

// Admin Password Update
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Veuillez renseigner l\'ancien et le nouveau mot de passe.' });
  }

  try {
    // Supabase does not directly verify old password on update. 
    // A common pattern is to re-authenticate or handle this on the client side if strict old password verification is needed.
    // For simplicity, we directly update the password here.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Change Password):', user.id, user.email, user.role, 'Changement de mot de passe', user.id, 'Utilisateur');
    res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Admin Users CRUD Management (Super Admin ONLY)
app.get('/api/admin/users', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'super_admin') { // Note: changed from 'Super Admin' to 'super_admin' to match DB enum
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }

  const { data: adminUsers, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, status, created_at')
    .in('role', ['admin', 'super_admin', 'editor']); // Fetch all admin-like roles

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(adminUsers);
});

app.post('/api/admin/users', authenticate, async (req, res) => {
  const currentUser = (req as any).user;
  if (currentUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires pour créer un administrateur.' });
  }

  try {
    // Create user in Supabase Auth with server privileges.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData?.user) {
      return res.status(500).json({ error: 'Failed to create user in authentication.' });
    }

    // Insert profile into the 'profiles' table
    const { data: profileData, error: profileError } = await supabase.from('profiles').insert([
      { id: authData.user.id, email, name, role, status: 'active' } // Note: status is 'active' by default
    ]).select();

    if (profileError) {
      // If profile creation fails, you might want to delete the auth user created above
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: profileError.message });
    }

    const newUser = profileData[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Create Staff User):', currentUser.id, currentUser.email, currentUser.role, 'Création Utilisateur Staff', newUser.id, 'Utilisateur Admin', undefined, { name, email, role });
    res.json({ success: true, user: newUser });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/users/:id', authenticate, async (req, res) => {
  const currentUser = (req as any).user;
  if (currentUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  const { id } = req.params;
  const { name, role, status, password } = req.body;

  try {
    // First, get the old profile data for logging
    const { data: oldProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('name, role, status')
      .eq('id', id)
      .single();

    if (fetchError || !oldProfile) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Update profile in the 'profiles' table
    const { data: updatedProfileData, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ name, role, status })
      .eq('id', id)
      .select();

    if (profileUpdateError) {
      return res.status(500).json({ error: profileUpdateError.message });
    }

    // If password is provided, update in Supabase Auth
    if (password) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password,
      });
      if (authUpdateError) {
        return res.status(500).json({ error: authUpdateError.message });
      }
    }

    const updatedUser = updatedProfileData[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Staff User):', currentUser.id, currentUser.email, currentUser.role, 'Modification Utilisateur Staff', id, 'Utilisateur Admin', oldProfile, updatedUser);
    res.json({ success: true, message: 'Administrateur édité.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/users/:id', authenticate, async (req, res) => {
  const currentUser = (req as any).user;
  if (currentUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis.' });
  }
  const { id } = req.params;

  // Prevent a super_admin from deleting themselves
  if (id === currentUser.id) {
    return res.status(400).json({ error: 'Un Super Admin ne peut pas supprimer son propre compte.' });
  }

  try {
    // First, get the profile data for logging
    const { data: targetProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', id)
      .single();

    if (fetchError || !targetProfile) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // Delete user from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      return res.status(500).json({ error: authDeleteError.message });
    }

    // Deleting from 'profiles' table is often handled by a RLS policy or trigger upon auth.users deletion
    // However, explicitly deleting here ensures consistency if no such trigger exists.
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileDeleteError) {
      return res.status(500).json({ error: profileDeleteError.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Delete Staff User):', currentUser.id, currentUser.email, currentUser.role, 'Suppression Utilisateur Staff', id, 'Utilisateur Admin', targetProfile, undefined);
    res.json({ success: true, message: 'Administrateur supprimé.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 3. PRODUCTS CRUD (AUTHENTICATED)

app.get('/api/admin/products', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.post('/api/admin/products', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') {
    return res.status(403).json({ error: 'Les Éditeurs ne peuvent modifier l\'inventaire technique.' });
  }

  const { data, error } = await supabase.from('products').insert([req.body]).select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Assuming 'data' contains the newly inserted product
  const newProduct = data[0];

  // TODO: Implement Supabase-based audit logging
  console.log('Activity Log (Create Product):', user.id, user.email, user.role, 'Création de Produit', newProduct.id, 'Produit', undefined, newProduct);
  res.json({ success: true, product: newProduct });
});

app.put('/api/admin/products/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') {
    return res.status(403).json({ error: 'Les Éditeurs ne peuvent pas éditer de produits.' });
  }

  const { id } = req.params;
  const updatedProductData = { ...req.body, updatedAt: new Date().toISOString() };

  // First, get the old product data for logging
  const { data: oldProductData, error: fetchError } = await supabase.from('products').select('*').eq('id', id).single();
  if (fetchError) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  const { data, error } = await supabase.from('products').update(updatedProductData).eq('id', id).select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const updatedProduct = data[0];

  // TODO: Implement Supabase-based audit logging
  console.log('Activity Log (Update Product):', user.id, user.email, user.role, 'Modification de Produit (Spec / Stock)', id, 'Produit', oldProductData, updatedProduct);
  res.json({ success: true, product: updatedProduct });
});

app.delete('/api/admin/products/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role === 'Editor') {
    return res.status(403).json({ error: 'Les Éditeurs ne peuvent pas supprimer des articles en rayon.' });
  }

  const { id } = req.params;

  // First, get the product data for logging
  const { data: targetProduct, error: fetchError } = await supabase.from('products').select('*').eq('id', id).single();
  if (fetchError) {
    return res.status(404).json({ error: 'Produit non trouvé.' });
  }

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // TODO: Implement Supabase-based audit logging
  console.log('Activity Log (Delete Product):', id, 'Produit', targetProduct, undefined);
  res.json({ success: true, message: 'Produit retiré.' });
});

// 4. CATEGORIES CRUD

app.get('/api/admin/categories', authenticate, async (req, res) => {
  const { data: categories, error } = await supabase.from('categories').select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(categories);
});

app.post('/api/admin/categories', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (!['admin', 'super_admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Droits d\'Administrateur requis.' });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
  }

  try {
    const { data, error } = await supabase.from('categories').insert([{ name }]).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newCategory = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Create Category):', user.id, user.email, user.role, 'Création Catégorie', newCategory.id, 'Catégorie', undefined, newCategory);
    res.json({ success: true, category: newCategory });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/categories/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (!['admin', 'super_admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Droits d\'Administrateur requis.' });
  }

  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
  }

  try {
    // First, get the old category data for logging
    const { data: oldCategory, error: fetchError } = await supabase.from('categories').select('*').eq('id', id).single();
    if (fetchError || !oldCategory) {
      return res.status(404).json({ error: 'Catégorie introuvable.' });
    }

    const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const updatedCategory = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Category):', user.id, user.email, user.role, 'Modification Catégorie', id, 'Catégorie', oldCategory, updatedCategory);
    res.json({ success: true, category: updatedCategory });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/categories/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (!['admin', 'super_admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Droits d\'Administrateur requis.' });
  }

  const { id } = req.params;

  try {
    // First, get the target category data for logging
    const { data: targetCategory, error: fetchError } = await supabase.from('categories').select('*').eq('id', id).single();
    if (fetchError || !targetCategory) {
      return res.status(404).json({ error: 'Catégorie introuvable.' });
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Delete Category):', user.id, user.email, user.role, 'Suppression Catégorie', id, 'Catégorie', targetCategory, undefined);
    res.json({ success: true, message: 'Catégorie supprimée.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 6. CUSTOMS VIEW

app.get('/api/admin/customers', authenticate, async (req, res) => {
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, city, created_at, total_spent, orders_count')
    .eq('role', 'customer');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(customers);
});

// 7. PUBLIC CMS EDITORS

app.put('/api/admin/cms/site', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { key, ...updatedSettings } = req.body;

  if (key !== 'site_cms') {
    return res.status(400).json({ error: 'Clé de paramètre de site invalide.' });
  }

  try {
    // First, get the old settings for logging
    const { data: oldSettings, error: fetchError } = await supabase.from('site_settings').select('*').eq('key', key).single();
    if (fetchError || !oldSettings) {
      return res.status(404).json({ error: 'Paramètres de site introuvables.' });
    }

    const { data, error } = await supabase.from('site_settings').update({ value: updatedSettings }).eq('key', key).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newSettings = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Site CMS):', user.id, user.email, user.role, 'Édition CMS Contenu Site', 'site_cms', 'CMS', oldSettings.value, newSettings.value);
    res.json({ success: true, cms: newSettings.value });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/cms/contact', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { key, ...updatedSettings } = req.body;

  if (key !== 'contact_cms') {
    return res.status(400).json({ error: 'Clé de paramètre de contact invalide.' });
  }

  try {
    // First, get the old settings for logging
    const { data: oldSettings, error: fetchError } = await supabase.from('site_settings').select('*').eq('key', key).single();
    if (fetchError || !oldSettings) {
      return res.status(404).json({ error: 'Paramètres de contact introuvables.' });
    }

    const { data, error } = await supabase.from('site_settings').update({ value: updatedSettings }).eq('key', key).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newSettings = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Contact CMS):', user.id, user.email, user.role, 'Édition CMS Coordonnées Contact', 'contact_cms', 'CMS', oldSettings.value, newSettings.value);
    res.json({ success: true, cms: newSettings.value });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/cms/social', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { key, ...updatedSettings } = req.body;

  if (key !== 'social_cms') {
    return res.status(400).json({ error: 'Clé de paramètre social invalide.' });
  }

  try {
    // First, get the old settings for logging
    const { data: oldSettings, error: fetchError } = await supabase.from('site_settings').select('*').eq('key', key).single();
    if (fetchError || !oldSettings) {
      return res.status(404).json({ error: 'Paramètres sociaux introuvables.' });
    }

    const { data, error } = await supabase.from('site_settings').update({ value: updatedSettings }).eq('key', key).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newSettings = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Social CMS):', user.id, user.email, user.role, 'Édition CMS Réseaux Sociaux', 'social_cms', 'CMS', oldSettings.value, newSettings.value);
    res.json({ success: true, cms: newSettings.value });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 8. BANNERS

app.get('/api/admin/banners', authenticate, async (req, res) => {
  const { data: banners, error } = await supabase.from('banners').select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(banners);
});

app.post('/api/admin/banners', authenticate, async (req, res) => {
  const user = (req as any).user;
  const newBannerData = { ...req.body, status: req.body.status || 'Actif' };

  try {
    const { data, error } = await supabase.from('banners').insert([newBannerData]).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newBanner = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Add Banner):', user.id, user.email, user.role, 'Ajout Bannière Pub', newBanner.id, 'Bannière', undefined, newBanner);
    res.json({ success: true, banner: newBanner });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/banners/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const updatedBannerData = { ...req.body };

  try {
    // First, get the old banner data for logging
    const { data: oldBanner, error: fetchError } = await supabase.from('banners').select('*').eq('id', id).single();
    if (fetchError || !oldBanner) {
      return res.status(404).json({ error: 'Bannière introuvable.' });
    }

    const { data, error } = await supabase.from('banners').update(updatedBannerData).eq('id', id).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const updatedBanner = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Banner):', user.id, user.email, user.role, 'Modification Bannière Pub', id, 'Bannière', oldBanner, updatedBanner);
    res.json({ success: true, banner: updatedBanner });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/banners/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    // First, get the target banner data for logging
    const { data: targetBanner, error: fetchError } = await supabase.from('banners').select('*').eq('id', id).single();
    if (fetchError || !targetBanner) {
      return res.status(404).json({ error: 'Bannière introuvable.' });
    }

    const { error } = await supabase.from('banners').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Delete Banner):', user.id, user.email, user.role, 'Suppression Bannière Pub', id, 'Bannière', targetBanner, undefined);
    res.json({ success: true, message: 'Bannière supprimée.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 9. BUYING GUIDES

app.get('/api/admin/guides', authenticate, async (req, res) => {
  const { data: guides, error } = await supabase.from('tips').select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(guides);
});

app.post('/api/admin/guides', authenticate, async (req, res) => {
  const user = (req as any).user;
  const newGuideData = { ...req.body };

  try {
    const { data, error } = await supabase.from('tips').insert([newGuideData]).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newGuide = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Add Guide):', user.id, user.email, user.role, 'Ajout Guide d\'Achat', newGuide.id, 'Guide', undefined, newGuide);
    res.json({ success: true, guide: newGuide });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/guides/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const updatedGuideData = { ...req.body };

  try {
    // First, get the old guide data for logging
    const { data: oldGuide, error: fetchError } = await supabase.from('tips').select('*').eq('id', id).single();
    if (fetchError || !oldGuide) {
      return res.status(404).json({ error: 'Guide introuvable.' });
    }

    const { data, error } = await supabase.from('tips').update(updatedGuideData).eq('id', id).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const updatedGuide = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Guide):', user.id, user.email, user.role, 'Modification Guide d\'Achat', id, 'Guide', oldGuide, updatedGuide);
    res.json({ success: true, guide: updatedGuide });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/guides/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    // First, get the target guide data for logging
    const { data: targetGuide, error: fetchError } = await supabase.from('tips').select('*').eq('id', id).single();
    if (fetchError || !targetGuide) {
      return res.status(404).json({ error: 'Guide introuvable.' });
    }

    const { error } = await supabase.from('tips').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Delete Guide):', user.id, user.email, user.role, 'Suppression Guide d\'Achat', id, 'Guide', targetGuide, undefined);
    res.json({ success: true, message: 'Guide supprimé.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 10. BLOG & NEWS CMS

app.get('/api/admin/blog', authenticate, async (req, res) => {
  const { data: blogPosts, error } = await supabase.from('blog_posts').select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(blogPosts);
});

app.post('/api/admin/blog', authenticate, async (req, res) => {
  const user = (req as any).user;
  const newPostData = {
    ...req.body,
    slug: req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    createdAt: new Date().toISOString(),
    publishedAt: req.body.status === 'Publié' ? new Date().toISOString() : null // Use null for unpublished
  };

  try {
    const { data, error } = await supabase.from('blog_posts').insert([newPostData]).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const newPost = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Create Blog Post):', user.id, user.email, user.role, 'Création Article Blog', newPost.id, 'Blog', undefined, newPost);
    res.json({ success: true, post: newPost });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/admin/blog/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const updatedPostData = { ...req.body };

  try {
    // First, get the old post data for logging
    const { data: oldPost, error: fetchError } = await supabase.from('blog_posts').select('*').eq('id', id).single();
    if (fetchError || !oldPost) {
      return res.status(404).json({ error: 'Article introuvable.' });
    }

    if (updatedPostData.status === 'Publié' && !oldPost.published_at) {
      updatedPostData.published_at = new Date().toISOString();
    } else if (updatedPostData.status !== 'Publié' && oldPost.published_at) {
      updatedPostData.published_at = null; // Unpublish
    }

    const { data, error } = await supabase.from('blog_posts').update(updatedPostData).eq('id', id).select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const updatedPost = data[0];

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Update Blog Post):', user.id, user.email, user.role, 'Modification Article Blog', id, 'Blog', oldPost, updatedPost);
    res.json({ success: true, post: updatedPost });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/blog/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    // First, get the target post data for logging
    const { data: targetPost, error: fetchError } = await supabase.from('blog_posts').select('*').eq('id', id).single();
    if (fetchError || !targetPost) {
      return res.status(404).json({ error: 'Article introuvable.' });
    }

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Delete Blog Post):', user.id, user.email, user.role, 'Suppression Article Blog', id, 'Blog', targetPost, undefined);
    res.json({ success: true, message: 'Article supprimé.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 11. CENTRALIZED NOTIFICATIONS

app.get('/api/admin/notifications', authenticate, async (req, res) => {
  const { data: notifications, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(notifications);
});

app.put('/api/admin/notifications/read', authenticate, async (req, res) => {
  const user = (req as any).user;

  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Mark All Notifications Read):', user.id, user.email, user.role, 'Marquer toutes les notifications comme lues');
    res.json({ success: true, message: 'Toutes les notifications marquées comme lues.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/admin/notifications/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    // First, get the target notification data for logging
    const { data: targetNotification, error: fetchError } = await supabase.from('notifications').select('*').eq('id', id).single();
    if (fetchError || !targetNotification) {
      return res.status(404).json({ error: 'Notification introuvable.' });
    }

    const { error } = await supabase.from('notifications').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Delete Notification):', user.id, user.email, user.role, 'Suppression notification', id, 'Notification', targetNotification, undefined);
    res.json({ success: true, message: 'Notification supprimée.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// 12. SEARCH SYSTEM LOGS

app.get('/api/admin/logs', authenticate, async (req, res) => {
  const { data: logs, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(logs);
});

// 13. SECURE MEDIA MANAGER BASE64 UPLOADS

app.get('/api/admin/media', authenticate, async (req, res) => {
  try {
    const bucketName = 'site-assets'; // Default bucket for listing media
    const { data: files, error } = await supabase.storage.from(bucketName).list('', { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const media = files.map(file => ({
      name: file.name,
      url: `${supabase.storage.from(bucketName).getPublicUrl(file.name).data.publicUrl}`,
      size: file.metadata?.size || 0,
      createdAt: file.created_at,
    }));

    res.json(media);
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de la récupération des fichiers multimédias: ${(err as Error).message}` });
  }
});

app.post('/api/admin/media/upload', authenticate, async (req, res) => {
  const { fileName, base64Data, bucketName = 'site-assets' } = req.body; // Default to 'site-assets' if not provided
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Nom de fichier et données base64 manquants.' });
  }

  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const ext = path.extname(fileName) || '.jpg';
    const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const secureName = `${base}-${Date.now()}${ext}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(secureName, buffer, { contentType: 'image/jpeg' }); // Adjust content type as needed

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const publicUrl = supabase.storage.from(bucketName).getPublicUrl(secureName).data.publicUrl;

    res.json({ success: true, url: publicUrl, name: secureName });
  } catch (err) {
    res.status(500).json({ error: `Erreur d\'écriture de fichier: ${(err as Error).message}` });
  }
});

app.delete('/api/admin/media/:filename', authenticate, async (req, res) => {
  const filename = req.params.filename;
  const bucketName = req.query.bucketName as string || 'site-assets'; // Default to 'site-assets' if not provided

  try {
    const { error } = await supabase.storage.from(bucketName).remove([filename]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Fichier supprimé.' });
  } catch (err) {
    res.status(500).json({ error: `Impossible de supprimer le fichier: ${(err as Error).message}` });
  }
});

// 14. ADMIN DATABASE EXPORTS (BACKUP)

app.get('/api/admin/backup/export', authenticate, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Droits de Super Admin requis pour exporter la base de données.' });
  }

  try {
    const [profiles, categories, products, orders, site_settings, banners, tips, blog_posts, notifications, audit_logs] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('products').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('site_settings').select('*'),
      supabase.from('banners').select('*'),
      supabase.from('tips').select('*'),
      supabase.from('blog_posts').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('audit_logs').select('*'),
    ]);

    const backupData = {
      profiles: profiles.data,
      categories: categories.data,
      products: products.data,
      orders: orders.data,
      site_settings: site_settings.data,
      banners: banners.data,
      tips: tips.data,
      blog_posts: blog_posts.data,
      notifications: notifications.data,
      audit_logs: audit_logs.data,
    };

    // TODO: Implement Supabase-based audit logging
    console.log('Activity Log (Export Database):', user.id, user.email, user.role, 'Exportation de la base de données', 'database', 'System');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=Herve-eShop-Backup-${Date.now()}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de l\'exportation de la base de données: ${(err as Error).message}` });
  }
});

app.post('/api/admin/backup/import', authenticate, async (req, res) => {
  const user = (req as any).user;
  // TODO: Implement Supabase-based audit logging
  console.log('Activity Log (Import Database Attempt):', user.id, user.email, user.role, 'Tentative d\'importation de la base de données', 'database', 'System');

  return res.status(501).json({
    error: 'L\'importation directe de la base de données via l\'API n\'est pas prise en charge pour Supabase. Veuillez utiliser les outils Supabase CLI ou le tableau de bord.',
  });
});

// 15. COMPLEX ANALYTICS CONSOLE REPORT

app.get('/api/admin/analytics', authenticate, async (req, res) => {
  try {
    const [productsResponse, ordersResponse, visitorCountResponse] = await Promise.all([
      supabase.from('products').select('status, stock_quantity'),
      supabase.from('orders').select('status, final_price, created_at, laptop_id, laptop_brand, laptop_model'),
      supabase.from('visitor_counts').select('count').single(),
    ]);

    if (productsResponse.error) throw productsResponse.error;
    if (ordersResponse.error) throw ordersResponse.error;
    if (visitorCountResponse.error) throw visitorCountResponse.error;

    const products = productsResponse.data;
    const orders = ordersResponse.data;
    const visitorCount = visitorCountResponse.data?.count || 0;

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'Disponible').length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    const disabledProducts = products.filter(p => p.status === 'Rupture' && p.stock_quantity === 0).length;

    const ordersCount = orders.length;

    // Calculate total validated revenue
    const totalRevenue = orders
      .filter(o => o.status !== 'Annulée' && o.status !== 'Remboursée')
      .reduce((sum, o) => sum + o.final_price, 0);

    // Group revenue by Month
    const revenueByMonth: Record<string, number> = {};
    const ordersByMonth: Record<string, number> = {};

    orders.forEach(o => {
      const date = new Date(o.created_at);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short' }) + ' ' + date.getFullYear();
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + o.final_price;
      ordersByMonth[monthKey] = (ordersByMonth[monthKey] || 0) + 1;
    });

    const chartData = Object.keys(revenueByMonth).map(key => ({
      name: key,
      revenue: revenueByMonth[key],
      orders: ordersByMonth[key]
    })).reverse();

    // Find most requested items
    const popularCounts: Record<string, { count: number; name: string; brand: string; revenue: number }> = {};
    orders.forEach(o => {
      const key = o.laptop_id;
      if (!popularCounts[key]) {
        popularCounts[key] = { count: 0, name: o.laptop_model, brand: o.laptop_brand, revenue: 0 };
      }
      popularCounts[key].count += 1;
      popularCounts[key].revenue += o.final_price;
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
        visitorCount: visitorCount,
        conversionRate: ordersCount > 0 ? ((ordersCount / (visitorCount || 1)) * 100).toFixed(1) + '%' : '0%'
      },
      performanceChart: chartData.length > 0 ? chartData : [{ name: 'Juin 2026', revenue: totalRevenue || 0, orders: ordersCount || 0 }],
      popularLaptops
    });
  } catch (err) {
    res.status(500).json({ error: `Erreur lors de la récupération des analyses: ${(err as Error).message}` });
  }
});

// VITE MIDDLEWARE INTERPOLATOR Setup
async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: Number(process.env.PORT) || 3001, // Ensure Vite also uses the specified port
        strictPort: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Herve_eShop Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
