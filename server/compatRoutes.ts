import express from 'express';
import path from 'path';

type SupabaseLike = any;
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-laptop',
    name: 'Laptop',
    description: 'Ordinateurs portables, ultrabooks et machines de travail.',
    image: '',
    icon: 'Laptop',
    displayOrder: 1,
    status: 'Actif',
  },
  {
    id: 'cat-telephone',
    name: 'Telephone',
    description: 'Smartphones premium, iPhone, Android et appareils reconditionnes.',
    image: '',
    icon: 'Smartphone',
    displayOrder: 2,
    status: 'Actif',
  },
  {
    id: 'cat-accessoire',
    name: 'Accessoire',
    description: 'Chargeurs, ecouteurs, claviers, souris, sacs et complements.',
    image: '',
    icon: 'Headphones',
    displayOrder: 3,
    status: 'Actif',
  },
  {
    id: 'cat-gadget',
    name: 'Gadget',
    description: 'Montres connectees, objets intelligents et tech lifestyle.',
    image: '',
    icon: 'Watch',
    displayOrder: 4,
    status: 'Actif',
  },
];

const DEFAULT_SITE_CMS = {
  siteName: 'Herve_eShop',
  logoText: 'Herve_eShop',
  announcementText: 'Importation premium de laptops et accessoires.',
  heroTitle: 'Ordinateurs importes et verifies',
  heroSubtitle: 'Selection premium pour le Cameroun',
  welcomeText: 'Bienvenue dans la boutique Herve_eShop.',
  aboutText: 'Herve_eShop selectionne des machines fiables et soigneusement preparees.',
  mission: 'Proposer du materiel de qualite avec accompagnement local.',
  vision: 'Devenir la reference premium de l import tech au Cameroun.',
  values: 'Qualite, confiance, reactivite.',
  footerText: 'Herve_eShop - Import premium.',
  termsOfUse: '',
  legalMentions: '',
  privacyPolicy: '',
  returnPolicy: '',
};

const DEFAULT_CONTACT_CMS = {
  primaryPhone: '',
  secondaryPhone: '',
  whatsAppPhone: '',
  email: '',
  gpsCoordinates: '',
  address: '',
  openingHours: '',
  googleMapsIframe: '',
};

const DEFAULT_SOCIAL_CMS = {
  facebook: { active: false, url: '' },
  instagram: { active: false, url: '' },
  tiktok: { active: false, url: '' },
  linkedin: { active: false, url: '' },
  youtube: { active: false, url: '' },
  twitter: { active: false, url: '' },
};

let categoriesStore = clone(DEFAULT_CATEGORIES);
let siteCMSStore = clone(DEFAULT_SITE_CMS);
let contactCMSStore = clone(DEFAULT_CONTACT_CMS);
let socialCMSStore = clone(DEFAULT_SOCIAL_CMS);
let bannersStore: any[] = [];
let guidesStore: any[] = [];
let auditLogsStore: any[] = [];

function pushAuditLog(entry: {
  userEmail?: string;
  userRole?: string;
  action: string;
  entityId?: string;
  entityType?: string;
}) {
  auditLogsStore.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    userEmail: entry.userEmail || 'system@herve-eshop.local',
    userRole: entry.userRole || 'System',
    action: entry.action,
    entityId: entry.entityId || '-',
    entityType: entry.entityType || '-',
  });
  auditLogsStore = auditLogsStore.slice(0, 200);
}

function extractToken(headerValue?: string | string[]) {
  if (!headerValue) return null;
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function inferLaptopCategory(laptop: any) {
  const text = `${laptop.brand || ''} ${laptop.model || ''} ${laptop.processor || ''}`.toLowerCase();
  if (/(rog|legion|rtx|gaming|zephyrus|predator)/.test(text)) return 'Gaming';
  if (/(air|xps|elitebook|macbook|ultra|thinkpad x|spectre)/.test(text)) return 'Ultrabook';
  return 'Bureautique';
}

function normalizeProductCategory(value?: string | null) {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return 'Laptop';
  if (['laptop', 'pc', 'ordinateur', 'ordinateur portable'].includes(normalized)) return 'Laptop';
  if (['telephone', 'téléphone', 'phone', 'smartphone', 'mobile', 'iphone'].includes(normalized)) return 'Telephone';
  if (['accessoire', 'accessoires', 'accessory', 'accessories'].includes(normalized)) return 'Accessoire';
  if (['gadget', 'gadgets'].includes(normalized)) return 'Gadget';
  return value?.trim() || 'Laptop';
}

function inferLegacyProductCategory(row: any) {
  const id = String(row?.id || '').toLowerCase();
  const text = `${row?.brand || ''} ${row?.model || ''} ${row?.description || ''}`.toLowerCase();
  if (id.startsWith('phn-') || id.startsWith('tel-') || /(iphone|galaxy|pixel|redmi|infinix|tecno)/.test(text)) return 'Telephone';
  if (id.startsWith('acc-') || /(chargeur|ecouteur|écouteur|headphone|souris|clavier|case|coque|adapter|adaptateur)/.test(text)) return 'Accessoire';
  if (id.startsWith('gdt-') || /(watch|montre|speaker|enceinte|tracker|console|camera|caméra)/.test(text)) return 'Gadget';
  return 'Laptop';
}

function defaultSubCategoryForProduct(category: string, row?: any) {
  switch (normalizeProductCategory(category)) {
    case 'Telephone':
      return 'Smartphone';
    case 'Accessoire':
      return 'Accessoire';
    case 'Gadget':
      return 'Gadget';
    case 'Laptop':
    default:
      return inferLaptopCategory(row || {});
  }
}

function defaultImageForProduct(category: string) {
  switch (normalizeProductCategory(category)) {
    case 'Telephone':
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1200';
    case 'Accessoire':
      return 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=1200';
    case 'Gadget':
      return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=1200';
    case 'Laptop':
    default:
      return 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1200';
  }
}

function buildProductId(category?: string | null) {
  switch (normalizeProductCategory(category)) {
    case 'Telephone':
      return `phn-${Date.now()}`;
    case 'Accessoire':
      return `acc-${Date.now()}`;
    case 'Gadget':
      return `gdt-${Date.now()}`;
    case 'Laptop':
    default:
      return `lpt-${Date.now()}`;
  }
}

function parseStoredProductDescription(rawValue?: string | null) {
  const raw = rawValue || '';
  if (!raw.startsWith('[[meta:')) {
    return { meta: {}, description: raw };
  }

  const markerEnd = raw.indexOf(']]');
  if (markerEnd === -1) {
    return { meta: {}, description: raw };
  }

  const metaText = raw.slice('[[meta:'.length, markerEnd);
  try {
    const parsed = JSON.parse(metaText);
    const description = raw.slice(markerEnd + 2).replace(/^\n/, '');
    return { meta: parsed || {}, description };
  } catch {
    return { meta: {}, description: raw };
  }
}

function serializeStoredProductDescription(description: string, meta: Record<string, any>) {
  const normalizedMeta = {
    category: normalizeProductCategory(meta.category),
    subCategory: meta.subCategory || '',
    shortDescription: meta.shortDescription || '',
    skuByAdmin: meta.skuByAdmin || '',
    isFeatured: Boolean(meta.isFeatured),
    isPopular: Boolean(meta.isPopular),
    isRecommended: Boolean(meta.isRecommended),
  };

  return `[[meta:${JSON.stringify(normalizedMeta)}]]\n${description || ''}`;
}

function mapLaptopStatus(laptop: any) {
  if (laptop?.is_active === false) return 'Rupture';
  const stock = Number(laptop?.stock_quantity || 0);
  if (stock <= 0) return 'Rupture';
  if (stock <= 1) return 'Arrivage imminent';
  return 'Disponible';
}

function mapLaptopSource(origin?: string | null): 'USA' | 'Europe' | 'Asia' {
  const text = (origin || '').toLowerCase();
  if (text.includes('europe')) return 'Europe';
  if (text.includes('asia') || text.includes('corea') || text.includes('korea')) return 'Asia';
  return 'USA';
}

function mapLaptopRowToFrontend(row: any) {
  const stored = parseStoredProductDescription(row.description);
  const category = normalizeProductCategory(
    stored.meta?.category || row.category || row.product_type || inferLegacyProductCategory(row),
  );
  const description = stored.description || '';
  const subCategory = stored.meta?.subCategory || row.sub_category || defaultSubCategoryForProduct(category, row);

  return {
    id: row.id,
    brand: row.brand || 'N/A',
    model: row.model || 'N/A',
    processor: row.processor || 'Non specifie',
    ram: row.ram || 'Non specifie',
    storage: row.storage || 'Non specifie',
    screenSize: row.screen_size || '',
    condition: row.condition || 'Tres bon etat',
    source: mapLaptopSource(row.origin),
    image: row.image_url || defaultImageForProduct(category),
    price: Number(row.price_xaf || 0),
    oldPrice: row.old_price_xaf ? Number(row.old_price_xaf) : undefined,
    stockQuantity: Number(row.stock_quantity || 0),
    status: mapLaptopStatus(row),
    category,
    subCategory,
    description,
    shortDescription: stored.meta?.shortDescription || description || '',
    skuByAdmin: stored.meta?.skuByAdmin || row.sku || row.id,
    isFeatured: Boolean(stored.meta?.isFeatured),
    isPopular: Boolean(stored.meta?.isPopular),
    isRecommended: Boolean(stored.meta?.isRecommended),
  };
}

function detectImageContentType(fileName: string, base64Data: string) {
  const dataMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(base64Data || '');
  if (dataMatch?.[1]) return dataMatch[1];

  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.jpg':
    case '.jpeg':
    default:
      return 'image/jpeg';
  }
}

async function ensureStorageBucket(adminDb: SupabaseLike, bucketName: string) {
  const { data, error } = await adminDb.storage.listBuckets();
  if (error) throw error;

  const exists = (data || []).some((bucket: any) => bucket.name === bucketName);
  if (!exists) {
    const { error: createError } = await adminDb.storage.createBucket(bucketName, { public: true });
    if (createError && !/already exists/i.test(createError.message)) {
      throw createError;
    }
  }
}

function toDbOrderStatus(status?: string | null) {
  switch (status) {
    case 'Devis validé':
      return 'confirmed';
    case 'En préparation':
      return 'processing';
    case 'Prêt pour livraison':
      return 'shipped';
    case 'Livré':
      return 'delivered';
    case 'Refusé':
      return 'cancelled';
    case 'Demande reçue':
    default:
      return 'pending';
  }
}

function fromDbOrderStatus(status?: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return 'Devis validé';
    case 'processing':
      return 'En préparation';
    case 'shipped':
      return 'Prêt pour livraison';
    case 'delivered':
      return 'Livré';
    case 'cancelled':
    case 'refunded':
      return 'Refusé';
    case 'pending':
    default:
      return 'Demande reçue';
  }
}

function parseItemsPayload(value: any) {
  if (!value || typeof value !== 'object') return {};
  if (Array.isArray(value)) return value[0] || {};
  return value;
}

function mapOrderRowToFrontend(row: any) {
  const item = parseItemsPayload(row.items);
  return {
    id: row.id,
    orderNumber: row.id,
    clientName: item.clientName || row.shipping_address?.clientName || 'Client',
    clientPhone: item.clientPhone || row.shipping_address?.clientPhone || '',
    clientEmail: item.clientEmail || row.shipping_address?.clientEmail || '',
    clientCity: item.clientCity || row.shipping_address?.clientCity || '',
    laptopId: item.laptopId || item.productId || '',
    laptopBrand: item.laptopBrand || item.brand || '',
    laptopModel: item.laptopModel || item.model || '',
    basePrice: Number(item.basePrice || row.total_amount || 0),
    finalPrice: Number(item.finalPrice || row.total_amount || 0),
    customizations: item.customizations || {
      ramUpgrade: 'Aucune',
      storageUpgrade: 'Aucun',
      osOption: 'Windows 11 Pro',
      accessories: [],
    },
    additionalNotes: item.additionalNotes || '',
    status: fromDbOrderStatus(row.status),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

function mapBlogRowToFrontend(row: any) {
  return {
    id: row.id,
    title: row.title,
    slug: slugify(row.title || row.id),
    content: row.content || '',
    image: row.image_url || '',
    category: row.category || 'Conseils',
    status: row.is_published ? 'Publié' : 'Brouillon',
    seoTitle: row.title,
    seoDesc: row.excerpt || (row.content || '').slice(0, 150),
    seoKeywords: row.category || 'Conseils',
    createdAt: row.created_at || new Date().toISOString(),
    publishedAt: row.is_published ? row.date || row.created_at || new Date().toISOString() : undefined,
  };
}

function mapDbRoleToUi(role?: string | null) {
  switch ((role || '').toLowerCase()) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    default:
      return 'Editor';
  }
}

function mapUiRoleToDb(role?: string | null) {
  switch ((role || '').toLowerCase()) {
    case 'super admin':
    case 'super_admin':
      return 'super_admin';
    case 'admin':
      return 'admin';
    default:
      return 'editor';
  }
}

function isMissingTableError(error: any) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('does not exist') || message.includes('schema cache') || message.includes('cannot find');
}

async function loadCmsFromDb(adminDb: SupabaseLike) {
  try {
    const { data, error } = await adminDb
      .from('site_settings')
      .select('key,value')
      .in('key', ['site_cms', 'contact_cms', 'social_cms']);

    if (error) throw error;

    const map = new Map<string, any>();
    (data || []).forEach((row: any) => {
      map.set(String(row.key), row.value || {});
    });

    siteCMSStore = { ...clone(DEFAULT_SITE_CMS), ...(map.get('site_cms') || {}) };
    contactCMSStore = { ...clone(DEFAULT_CONTACT_CMS), ...(map.get('contact_cms') || {}) };
    socialCMSStore = { ...clone(DEFAULT_SOCIAL_CMS), ...(map.get('social_cms') || {}) };
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }
}

async function persistCmsToDb(adminDb: SupabaseLike, key: string, value: any) {
  try {
    const { error } = await adminDb.from('site_settings').upsert(
      [
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'key' },
    );
    if (error) throw error;
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }
}

async function listAllAuthUsers(adminDb: SupabaseLike) {
  const users: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await adminDb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }
  return users;
}

async function resolveAuthUserByIdentifier(adminDb: SupabaseLike, identifier: string) {
  const users = await listAllAuthUsers(adminDb);
  const normalized = identifier.trim().toLowerCase();
  return users.find((user: any) => {
    const email = (user.email || '').toLowerCase();
    const username = (user.user_metadata?.username || '').toLowerCase();
    const name = (user.user_metadata?.name || '').toLowerCase();
    const phone = (user.user_metadata?.phone || user.phone || '').toLowerCase();
    const emailLocal = email.split('@')[0];
    return [email, username, name, phone, emailLocal].includes(normalized);
  }) || null;
}

async function getAdminContext(db: SupabaseLike, adminDb: SupabaseLike, userId: string) {
  const { data: roleRow } = await adminDb.from('admin_users').select('*').eq('user_id', userId).single();
  if (!roleRow) return null;
  const users = await listAllAuthUsers(adminDb);
  const authUser = users.find((user: any) => user.id === userId) || null;
  const email = authUser?.email || '';
  const username = authUser?.user_metadata?.username || email.split('@')[0] || 'admin';
  return {
    id: userId,
    email,
    username,
    name: authUser?.user_metadata?.name || username,
    dbRole: roleRow.role || 'editor',
    role: mapDbRoleToUi(roleRow.role),
    permissions: roleRow.permissions || {},
  };
}

async function compatAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction, supabase: SupabaseLike, adminDb: SupabaseLike) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Identification requise' });
    }
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(403).json({ error: 'Session invalide ou expirée' });
    }
    const adminContext = await getAdminContext(supabase, adminDb, data.user.id);
    if (!adminContext) {
      return res.status(403).json({ error: 'Compte administrateur introuvable.' });
    }
    (req as any).user = adminContext;
    next();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}

async function extractCustomerUser(req: express.Request, supabase: SupabaseLike) {
  const token = extractToken(req.headers['authorization-customer'] as string | undefined);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const metadata = data.user.user_metadata || {};
  return {
    id: data.user.id,
    email: data.user.email || '',
    name: metadata.name || metadata.username || (data.user.email || '').split('@')[0] || 'Client',
    phone: metadata.phone || '',
    city: metadata.city || '',
    created_at: data.user.created_at,
  };
}

export function registerCompatRoutes(app: express.Express, supabase: SupabaseLike, supabaseAdmin: SupabaseLike) {
  const db = supabase as SupabaseLike;
  const adminDb = supabaseAdmin as SupabaseLike;
  const requireCompatAdmin = (req: Request, res: Response, next: NextFunction) =>
    compatAdminAuth(req, res, next, supabase, adminDb);

  loadCmsFromDb(adminDb).catch(() => {});

  app.get('/api/visitor-increment', async (_req, res) => {
    res.json({ success: true, count: 0 });
  });

  app.get('/api/client/data', async (_req, res) => {
    try {
      await loadCmsFromDb(adminDb);
      const [laptopsRes, blogRes] = await Promise.all([
        adminDb.from('laptops').select('*').order('created_at', { ascending: false }),
        adminDb.from('blog_posts').select('*').order('created_at', { ascending: false }),
      ]);
      if (laptopsRes.error) throw laptopsRes.error;
      if (blogRes.error) throw blogRes.error;

      const products = (laptopsRes.data || [])
        .filter((row: any) => row.is_active !== false)
        .map(mapLaptopRowToFrontend);
      const blogPosts = (blogRes.data || [])
        .filter((row: any) => row.is_published !== false)
        .map(mapBlogRowToFrontend);

      res.json({
        products,
        categories: categoriesStore.filter((item) => item.status === 'Actif'),
        siteCMS: siteCMSStore,
        contactCMS: contactCMSStore,
        socialCMS: socialCMSStore,
        banners: bannersStore.filter((item) => item.status === 'Actif'),
        buyingGuides: guidesStore,
        blogPosts,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/client/quote', async (req, res) => {
    const { clientName, clientPhone, clientEmail, clientCity, laptopId, customizations, additionalNotes, finalPrice, id } = req.body;
    if (!clientName || !clientPhone || !laptopId) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
    }

    try {
      const { data: laptop, error: laptopError } = await db.from('laptops').select('*').eq('id', laptopId).single();
      if (laptopError || !laptop) {
        return res.status(404).json({ error: 'Ordinateur introuvable.' });
      }

      const customerUser = await extractCustomerUser(req, supabase);
      const resolvedFinalPrice = Number(finalPrice || laptop.price_xaf || 0);

      if (Number(laptop.stock_quantity || 0) > 0) {
        await db
          .from('laptops')
          .update({ stock_quantity: Number(laptop.stock_quantity || 0) - 1 })
          .eq('id', laptopId);
      }

      const orderPayload = {
        id: id || undefined,
        user_id: customerUser?.id || `guest:${clientPhone}`,
        items: {
          laptopId,
          laptopBrand: laptop.brand,
          laptopModel: laptop.model,
          basePrice: Number(laptop.price_xaf || 0),
          finalPrice: resolvedFinalPrice,
          clientName,
          clientPhone,
          clientEmail: clientEmail || '',
          clientCity: clientCity || '',
          customizations: customizations || {},
          additionalNotes: additionalNotes || '',
        },
        total_amount: resolvedFinalPrice,
        status: 'pending',
        payment_status: 'pending',
        payment_method: null,
        shipping_address: {
          clientName,
          clientPhone,
          clientEmail: clientEmail || '',
          clientCity: clientCity || '',
        },
      };

      const { data: inserted, error: orderError } = await db.from('orders').insert([orderPayload]).select().single();
      if (orderError) throw orderError;

      await db.from('notifications').insert([{
        user_id: customerUser?.id || 'system',
        title: 'Nouvelle commande soumise',
        message: `${clientName} a soumis une demande pour ${laptop.brand} ${laptop.model}.`,
        type: 'success',
        is_read: false,
        metadata: { orderId: inserted.id, source: 'client_quote' },
      }]);

      pushAuditLog({
        userEmail: customerUser?.email || 'guest@herve-eshop.local',
        userRole: customerUser ? 'Client' : 'Guest',
        action: 'Creation devis',
        entityId: inserted.id,
        entityType: 'Order',
      });

      res.json({ success: true, quote: mapOrderRowToFrontend(inserted) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/client/quote/:id', async (req, res) => {
    try {
      const { data: order, error } = await db.from('orders').select('*').eq('id', req.params.id).single();
      if (error || !order) {
        return res.status(404).json({ error: 'Demande de devis introuvable.' });
      }
      res.json(mapOrderRowToFrontend(order));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/client/auth/register', async (req, res) => {
    const { name, email, phone, city, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Le nom complet et le mot de passe sont obligatoires.' });
    }

    try {
      const syntheticEmail = email || `${String(phone || Date.now()).replace(/\D/g, '')}@client.herve.local`;
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: {
            name,
            username: email ? email.split('@')[0] : String(phone || '').replace(/\D/g, ''),
            phone: phone || '',
            city: city || '',
            customer_email: email || '',
          },
        },
      });
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        success: true,
        token: data.session?.access_token || null,
        user: {
          id: data.user?.id,
          name,
          email: email || syntheticEmail,
          phone: phone || '',
          city: city || '',
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/client/auth/login', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
    }

    try {
      const matchedUser = await resolveAuthUserByIdentifier(adminDb, identifier);
      const email = matchedUser?.email || identifier;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.user || !data.session) {
        return res.status(401).json({ error: 'Identifiants de connexion invalides.' });
      }
      const metadata = data.user.user_metadata || {};
      res.json({
        success: true,
        token: data.session.access_token,
        user: {
          id: data.user.id,
          name: metadata.name || metadata.username || email.split('@')[0],
          email: metadata.customer_email || data.user.email || '',
          phone: metadata.phone || '',
          city: metadata.city || '',
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/client/auth/profile', async (req, res) => {
    try {
      const user = await extractCustomerUser(req, supabase);
      if (!user) {
        return res.status(401).json({ error: 'Session client invalide ou expirée.' });
      }
      const { data: orders, error } = await db.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          createdAt: user.created_at,
        },
        orders: (orders || []).map(mapOrderRowToFrontend),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/client/auth/profile', async (req, res) => {
    try {
      const user = await extractCustomerUser(req, supabase);
      if (!user) {
        return res.status(401).json({ error: 'Session client invalide ou expirée.' });
      }
      const { name, email, phone, city, password } = req.body;
      const updatePayload: any = {
        user_metadata: {
          name: name || user.name,
          username: (email || user.email || user.name).split('@')[0],
          phone: phone || user.phone,
          city: city || user.city,
          customer_email: email || user.email,
        },
      };
      if (email) updatePayload.email = email;
      if (password) updatePayload.password = password;

      const { data, error } = await adminDb.auth.admin.updateUserById(user.id, updatePayload);
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      const metadata = data.user?.user_metadata || updatePayload.user_metadata;
      res.json({
        success: true,
        user: {
          id: user.id,
          name: metadata.name,
          email: metadata.customer_email || data.user?.email || email || user.email,
          phone: metadata.phone,
          city: metadata.city,
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe obligatoires.' });
    }

    try {
      const matchedUser = await resolveAuthUserByIdentifier(adminDb, email);
      const resolvedEmail = matchedUser?.email || email;
      const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
      if (error || !data?.user || !data.session) {
        return res.status(401).json({ error: 'Identifiants invalides ou compte inactif.' });
      }
      const adminContext = await getAdminContext(db, adminDb, data.user.id);
      if (!adminContext) {
        return res.status(403).json({ error: 'Compte administrateur introuvable ou inactif.' });
      }
      pushAuditLog({
        userEmail: adminContext.email,
        userRole: adminContext.role,
        action: 'Connexion admin',
        entityId: adminContext.id,
        entityType: 'AdminUser',
      });
      res.json({
        success: true,
        token: data.session.access_token,
        user: {
          id: adminContext.id,
          username: adminContext.username,
          email: adminContext.email,
          role: adminContext.role,
          name: adminContext.name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/auth/me', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  });

  app.post('/api/auth/change-password', async (req, res) => {
    try {
      const token = extractToken(req.headers.authorization);
      const newPassword = req.body.newPassword || req.body.password;

      if (token) {
        return compatAdminAuth(req, res, async () => {
          const adminUser = (req as any).user;
          const { error } = await adminDb.auth.admin.updateUserById(adminUser.id, { password: newPassword });
          if (error) return res.status(400).json({ error: error.message });
          pushAuditLog({
            userEmail: adminUser.email,
            userRole: adminUser.role,
            action: 'Changement mot de passe',
            entityId: adminUser.id,
            entityType: 'AdminUser',
          });
          res.json({ success: true });
        }, supabase, adminDb);
      }

      const identifier = req.body.email;
      if (!identifier || !newPassword) {
        return res.status(400).json({ error: 'Identifiant et nouveau mot de passe requis.' });
      }
      const matchedUser = await resolveAuthUserByIdentifier(adminDb, identifier);
      const adminContext = matchedUser ? await getAdminContext(db, adminDb, matchedUser.id) : null;
      if (!matchedUser || !adminContext) {
        return res.status(404).json({ error: 'Administrateur introuvable.' });
      }
      const { error } = await adminDb.auth.admin.updateUserById(matchedUser.id, { password: newPassword });
      if (error) return res.status(400).json({ error: error.message });
      pushAuditLog({
        userEmail: adminContext.email,
        userRole: adminContext.role,
        action: 'Reset mot de passe',
        entityId: matchedUser.id,
        entityType: 'AdminUser',
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/users', requireCompatAdmin, async (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.dbRole !== 'super_admin') {
      return res.status(403).json({ error: 'Droits de Super Admin requis.' });
    }
    try {
      const [{ data: adminRows, error }, authUsers] = await Promise.all([
        adminDb.from('admin_users').select('*').order('created_at', { ascending: false }),
        listAllAuthUsers(adminDb),
      ]);
      if (error) throw error;
      const response = (adminRows || []).map((row: any) => {
        const authUser = authUsers.find((user: any) => user.id === row.user_id);
        const email = authUser?.email || '';
        const username = authUser?.user_metadata?.username || email.split('@')[0] || 'admin';
        return {
          id: row.user_id,
          username,
          role: mapDbRoleToUi(row.role),
          createdAt: row.created_at || authUser?.created_at || new Date().toISOString(),
        };
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/admin/users', requireCompatAdmin, async (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.dbRole !== 'super_admin') {
      return res.status(403).json({ error: 'Droits de Super Admin requis.' });
    }

    try {
      const username = req.body.username || req.body.name;
      const password = req.body.password;
      const role = req.body.role;
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Nom utilisateur, mot de passe et role requis.' });
      }
      const email = username.includes('@') ? username : `${slugify(username)}@admin.herve.local`;
      const { data, error } = await adminDb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          name: username,
        },
      });
      if (error || !data.user) {
        return res.status(400).json({ error: error?.message || 'Creation impossible.' });
      }
      const { error: insertError } = await adminDb.from('admin_users').insert([{
        user_id: data.user.id,
        role: mapUiRoleToDb(role),
        permissions: {},
      }]);
      if (insertError) {
        await adminDb.auth.admin.deleteUser(data.user.id);
        return res.status(500).json({ error: insertError.message });
      }
      pushAuditLog({
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'Creation administrateur',
        entityId: data.user.id,
        entityType: 'AdminUser',
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/admin/users/:id', requireCompatAdmin, async (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.dbRole !== 'super_admin') {
      return res.status(403).json({ error: 'Droits de Super Admin requis.' });
    }
    if (req.params.id === currentUser.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }
    try {
      await adminDb.from('admin_users').delete().eq('user_id', req.params.id);
      const { error } = await adminDb.auth.admin.deleteUser(req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      pushAuditLog({
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: 'Suppression administrateur',
        entityId: req.params.id,
        entityType: 'AdminUser',
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/products', requireCompatAdmin, async (_req, res) => {
    try {
      const { data, error } = await adminDb.from('laptops').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapLaptopRowToFrontend));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/admin/products', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    if (user.dbRole === 'editor') {
      return res.status(403).json({ error: 'Les editeurs ne peuvent pas creer des produits.' });
    }
    try {
      const payload = req.body || {};
      const category = normalizeProductCategory(payload.category);
      const insertPayload = {
        id: payload.id || buildProductId(category),
        brand: payload.brand,
        model: payload.model,
        processor: payload.processor || '',
        ram: payload.ram || '',
        storage: payload.storage || '',
        screen_size: payload.screenSize || '',
        condition: payload.condition || '',
        origin: payload.source || '',
        image_url: payload.image || defaultImageForProduct(category),
        price_xaf: Number(payload.price || 0),
        old_price_xaf: payload.oldPrice !== undefined && payload.oldPrice !== null && payload.oldPrice !== ''
          ? Number(payload.oldPrice)
          : null,
        stock_quantity: Number(payload.stockQuantity || 0),
        description: serializeStoredProductDescription(payload.description || '', {
          category,
          subCategory: payload.subCategory || defaultSubCategoryForProduct(category),
          shortDescription: payload.shortDescription || '',
          skuByAdmin: payload.skuByAdmin || '',
          isFeatured: payload.isFeatured,
          isPopular: payload.isPopular,
          isRecommended: payload.isRecommended,
        }),
        is_active: payload.status !== 'Rupture',
        video_url: null,
        youtube_url: null,
      };
      const { data, error } = await adminDb.from('laptops').insert([insertPayload]).select().single();
      if (error) throw error;
      pushAuditLog({
        userEmail: user.email,
        userRole: user.role,
        action: 'Creation produit',
        entityId: data.id,
        entityType: 'Product',
      });
      res.json({ success: true, product: mapLaptopRowToFrontend(data) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/products/:id', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    if (user.dbRole === 'editor') {
      return res.status(403).json({ error: 'Les editeurs ne peuvent pas modifier des produits.' });
    }
    try {
      const payload = req.body || {};
      const category = normalizeProductCategory(payload.category);
      const updatePayload = {
        brand: payload.brand,
        model: payload.model,
        processor: payload.processor,
        ram: payload.ram,
        storage: payload.storage,
        screen_size: payload.screenSize,
        condition: payload.condition,
        origin: payload.source,
        image_url: payload.image || defaultImageForProduct(category),
        price_xaf: payload.price !== undefined ? Number(payload.price) : undefined,
        old_price_xaf: payload.oldPrice !== undefined
          ? (payload.oldPrice === null || payload.oldPrice === '' ? null : Number(payload.oldPrice))
          : undefined,
        stock_quantity: payload.stockQuantity !== undefined ? Number(payload.stockQuantity) : undefined,
        description: payload.description !== undefined
          ? serializeStoredProductDescription(payload.description || '', {
              category,
              subCategory: payload.subCategory || defaultSubCategoryForProduct(category),
              shortDescription: payload.shortDescription || '',
              skuByAdmin: payload.skuByAdmin || '',
              isFeatured: payload.isFeatured,
              isPopular: payload.isPopular,
              isRecommended: payload.isRecommended,
            })
          : undefined,
        is_active: payload.status ? payload.status !== 'Rupture' : undefined,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await adminDb.from('laptops').update(updatePayload).eq('id', req.params.id).select().single();
      if (error) throw error;
      pushAuditLog({
        userEmail: user.email,
        userRole: user.role,
        action: 'Mise a jour produit',
        entityId: req.params.id,
        entityType: 'Product',
      });
      res.json({ success: true, product: mapLaptopRowToFrontend(data) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/admin/products/:id', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    if (user.dbRole === 'editor') {
      return res.status(403).json({ error: 'Les editeurs ne peuvent pas supprimer des produits.' });
    }
    try {
      const { error } = await adminDb.from('laptops').delete().eq('id', req.params.id);
      if (error) throw error;
      pushAuditLog({
        userEmail: user.email,
        userRole: user.role,
        action: 'Suppression produit',
        entityId: req.params.id,
        entityType: 'Product',
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/admin/categories', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    if (user.dbRole === 'editor') {
      return res.status(403).json({ error: 'Droits administrateur requis.' });
    }
    const category = {
      id: `cat-${Date.now()}`,
      name: req.body.name,
      description: req.body.description || '',
      image: req.body.image || '',
      icon: req.body.icon || 'Laptop',
      displayOrder: Number(req.body.displayOrder || categoriesStore.length + 1),
      status: req.body.status || 'Actif',
    };
    categoriesStore.push(category);
    res.json({ success: true, category });
  });

  app.put('/api/admin/categories/:id', requireCompatAdmin, async (req, res) => {
    categoriesStore = categoriesStore.map((category) => category.id === req.params.id ? { ...category, ...req.body } : category);
    const updated = categoriesStore.find((category) => category.id === req.params.id);
    res.json({ success: true, category: updated });
  });

  app.delete('/api/admin/categories/:id', requireCompatAdmin, async (req, res) => {
    categoriesStore = categoriesStore.filter((category) => category.id !== req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/orders', requireCompatAdmin, async (_req, res) => {
    try {
      const { data, error } = await adminDb.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapOrderRowToFrontend));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/orders/:id', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    try {
      const { data: current, error: fetchError } = await adminDb.from('orders').select('*').eq('id', req.params.id).single();
      if (fetchError || !current) {
        return res.status(404).json({ error: 'Commande introuvable.' });
      }
      const item = parseItemsPayload(current.items);
      const nextTotal = req.body.finalPrice !== undefined ? Number(req.body.finalPrice) : Number(current.total_amount || 0);
      const nextItems = {
        ...item,
        finalPrice: nextTotal,
      };
      const { data, error } = await adminDb.from('orders').update({
        status: toDbOrderStatus(req.body.status),
        total_amount: nextTotal,
        items: nextItems,
        updated_at: new Date().toISOString(),
      }).eq('id', req.params.id).select().single();
      if (error) throw error;
      pushAuditLog({
        userEmail: user.email,
        userRole: user.role,
        action: `Mise a jour commande ${req.body.status || ''}`.trim(),
        entityId: req.params.id,
        entityType: 'Order',
      });
      res.json({ success: true, order: mapOrderRowToFrontend(data) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/admin/orders/:id', requireCompatAdmin, async (req, res) => {
    const user = (req as any).user;
    if (user.dbRole !== 'super_admin') {
      return res.status(403).json({ error: 'Seul le Super Admin peut supprimer une commande.' });
    }
    try {
      const { error } = await adminDb.from('orders').delete().eq('id', req.params.id);
      if (error) throw error;
      pushAuditLog({
        userEmail: user.email,
        userRole: user.role,
        action: 'Suppression commande',
        entityId: req.params.id,
        entityType: 'Order',
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/customers', requireCompatAdmin, async (_req, res) => {
    try {
      const { data, error } = await adminDb.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const grouped = new Map<string, any>();
      (data || []).forEach((row: any) => {
        const mapped = mapOrderRowToFrontend(row);
        const key = mapped.clientEmail || mapped.clientPhone || mapped.clientName;
        const current = grouped.get(key) || {
          id: key,
          name: mapped.clientName,
          email: mapped.clientEmail,
          phone: mapped.clientPhone,
          city: mapped.clientCity,
          created_at: mapped.createdAt,
          total_spent: 0,
          orders_count: 0,
        };
        current.total_spent += mapped.finalPrice;
        current.orders_count += 1;
        grouped.set(key, current);
      });
      res.json(Array.from(grouped.values()));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/cms/site', requireCompatAdmin, async (req, res) => {
    try {
      siteCMSStore = { ...siteCMSStore, ...(req.body.key ? req.body : { key: 'site_cms', ...req.body }) };
      delete (siteCMSStore as any).key;
      await persistCmsToDb(adminDb, 'site_cms', siteCMSStore);
      res.json({ success: true, cms: siteCMSStore });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/cms/contact', requireCompatAdmin, async (req, res) => {
    try {
      contactCMSStore = { ...contactCMSStore, ...(req.body.key ? req.body : { key: 'contact_cms', ...req.body }) };
      delete (contactCMSStore as any).key;
      await persistCmsToDb(adminDb, 'contact_cms', contactCMSStore);
      res.json({ success: true, cms: contactCMSStore });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/cms/social', requireCompatAdmin, async (req, res) => {
    try {
      socialCMSStore = { ...socialCMSStore, ...(req.body.key ? req.body : { key: 'social_cms', ...req.body }) };
      delete (socialCMSStore as any).key;
      await persistCmsToDb(adminDb, 'social_cms', socialCMSStore);
      res.json({ success: true, cms: socialCMSStore });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/banners', requireCompatAdmin, async (_req, res) => {
    res.json(bannersStore);
  });

  app.post('/api/admin/banners', requireCompatAdmin, async (req, res) => {
    const banner = { id: `banner-${Date.now()}`, ...req.body };
    bannersStore.unshift(banner);
    res.json({ success: true, banner });
  });

  app.put('/api/admin/banners/:id', requireCompatAdmin, async (req, res) => {
    bannersStore = bannersStore.map((banner) => banner.id === req.params.id ? { ...banner, ...req.body } : banner);
    res.json({ success: true, banner: bannersStore.find((banner) => banner.id === req.params.id) });
  });

  app.delete('/api/admin/banners/:id', requireCompatAdmin, async (req, res) => {
    bannersStore = bannersStore.filter((banner) => banner.id !== req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/guides', requireCompatAdmin, async (_req, res) => {
    res.json(guidesStore);
  });

  app.post('/api/admin/guides', requireCompatAdmin, async (req, res) => {
    const guide = { id: `guide-${Date.now()}`, ...req.body };
    guidesStore.unshift(guide);
    res.json({ success: true, guide });
  });

  app.put('/api/admin/guides/:id', requireCompatAdmin, async (req, res) => {
    guidesStore = guidesStore.map((guide) => guide.id === req.params.id ? { ...guide, ...req.body } : guide);
    res.json({ success: true, guide: guidesStore.find((guide) => guide.id === req.params.id) });
  });

  app.delete('/api/admin/guides/:id', requireCompatAdmin, async (req, res) => {
    guidesStore = guidesStore.filter((guide) => guide.id !== req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/blog', requireCompatAdmin, async (_req, res) => {
    try {
      const { data, error } = await adminDb.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json((data || []).map(mapBlogRowToFrontend));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/admin/blog', requireCompatAdmin, async (req, res) => {
    try {
      const payload = req.body || {};
      const insertPayload = {
        title: payload.title,
        category: payload.category || 'Conseils',
        content: payload.content || '',
        image_url: payload.image || '',
        excerpt: (payload.seoDesc || payload.content || '').slice(0, 180),
        author: 'Herve_eShop',
        role: 'admin',
        read_time: `${Math.max(1, Math.ceil(String(payload.content || '').split(/\s+/).length / 200))} min`,
        date: new Date().toISOString(),
        is_published: payload.status === 'Publié',
      };
      const { data, error } = await adminDb.from('blog_posts').insert([insertPayload]).select().single();
      if (error) throw error;
      res.json({ success: true, post: mapBlogRowToFrontend(data) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/blog/:id', requireCompatAdmin, async (req, res) => {
    try {
      const payload = req.body || {};
      const updatePayload = {
        title: payload.title,
        category: payload.category,
        content: payload.content,
        image_url: payload.image,
        excerpt: (payload.seoDesc || payload.content || '').slice(0, 180),
        is_published: payload.status === 'Publié',
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await adminDb.from('blog_posts').update(updatePayload).eq('id', req.params.id).select().single();
      if (error) throw error;
      res.json({ success: true, post: mapBlogRowToFrontend(data) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/admin/blog/:id', requireCompatAdmin, async (req, res) => {
    try {
      const { error } = await adminDb.from('blog_posts').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/notifications', requireCompatAdmin, async (_req, res) => {
    try {
      const { data, error } = await adminDb.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put('/api/admin/notifications/read', requireCompatAdmin, async (_req, res) => {
    try {
      await adminDb.from('notifications').update({ is_read: true }).eq('is_read', false);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/admin/notifications/:id', requireCompatAdmin, async (req, res) => {
    try {
      await adminDb.from('notifications').delete().eq('id', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/logs', requireCompatAdmin, async (_req, res) => {
    res.json(auditLogsStore);
  });

  app.get('/api/admin/media', requireCompatAdmin, async (_req, res) => {
    try {
      const bucketName = 'products';
      await ensureStorageBucket(adminDb, bucketName);
      const { data, error } = await adminDb.storage.from(bucketName).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      res.json((data || []).map((file: any) => ({
        name: file.name,
        url: adminDb.storage.from(bucketName).getPublicUrl(file.name).data.publicUrl,
        size: file.metadata?.size || 0,
        createdAt: file.created_at,
      })));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/admin/media/upload', requireCompatAdmin, async (req, res) => {
    try {
      const { fileName, base64Data, bucketName = 'products' } = req.body;
      if (!fileName || !base64Data) {
        return res.status(400).json({ error: 'Nom de fichier et base64 requis.' });
      }
      await ensureStorageBucket(adminDb, bucketName);
      const cleanBase64 = String(base64Data).replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const ext = path.extname(fileName) || '.jpg';
      const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const secureName = `${base}-${Date.now()}${ext}`;
      const { error } = await adminDb.storage.from(bucketName).upload(secureName, buffer, {
        contentType: detectImageContentType(fileName, String(base64Data)),
        upsert: false,
      });
      if (error) throw error;
      const publicUrl = adminDb.storage.from(bucketName).getPublicUrl(secureName).data.publicUrl;
      res.json({ success: true, url: publicUrl, name: secureName });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete('/api/admin/media/:filename', requireCompatAdmin, async (req, res) => {
    try {
      const bucketName = String(req.query.bucketName || 'products');
      const { error } = await adminDb.storage.from(bucketName).remove([req.params.filename]);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/admin/backup/export', requireCompatAdmin, async (_req, res) => {
    try {
      const [laptops, orders, blogPosts, notifications, admins] = await Promise.all([
        adminDb.from('laptops').select('*'),
        adminDb.from('orders').select('*'),
        adminDb.from('blog_posts').select('*'),
        adminDb.from('notifications').select('*'),
        adminDb.from('admin_users').select('*'),
      ]);
      res.json({
        laptops: laptops.data || [],
        orders: (orders.data || []).map(mapOrderRowToFrontend),
        blog_posts: (blogPosts.data || []).map(mapBlogRowToFrontend),
        notifications: notifications.data || [],
        admin_users: admins.data || [],
        categories: categoriesStore,
        siteCMS: siteCMSStore,
        contactCMS: contactCMSStore,
        socialCMS: socialCMSStore,
        banners: bannersStore,
        guides: guidesStore,
        audit_logs: auditLogsStore,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/admin/backup/import', requireCompatAdmin, async (_req, res) => {
    res.status(501).json({
      error: 'La restauration automatique n est pas activee pour ce mode de compatibilite.',
    });
  });

  app.get('/api/admin/analytics', requireCompatAdmin, async (_req, res) => {
    try {
      const [laptopsRes, ordersRes] = await Promise.all([
        adminDb.from('laptops').select('*'),
        adminDb.from('orders').select('*'),
      ]);
      if (laptopsRes.error) throw laptopsRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const laptops = (laptopsRes.data || []).map(mapLaptopRowToFrontend);
      const orders = (ordersRes.data || []).map(mapOrderRowToFrontend);
      const totalProducts = laptops.length;
      const activeProducts = laptops.filter((item: any) => item.status === 'Disponible').length;
      const outOfStock = laptops.filter((item: any) => item.stockQuantity === 0).length;
      const disabledProducts = laptops.filter((item: any) => item.status === 'Rupture').length;
      const ordersCount = orders.length;
      const totalRevenue = orders
        .filter((order: any) => order.status !== 'Refusé')
        .reduce((sum: number, order: any) => sum + Number(order.finalPrice || 0), 0);

      const revenueByMonth: Record<string, number> = {};
      const ordersByMonth: Record<string, number> = {};
      const popularCounts: Record<string, { count: number; name: string; brand: string; revenue: number }> = {};

      orders.forEach((order: any) => {
        const date = new Date(order.createdAt);
        const key = `${date.toLocaleString('fr-FR', { month: 'short' })} ${date.getFullYear()}`;
        revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(order.finalPrice || 0);
        ordersByMonth[key] = (ordersByMonth[key] || 0) + 1;
        const productKey = order.laptopId || `${order.laptopBrand}-${order.laptopModel}`;
        if (!popularCounts[productKey]) {
          popularCounts[productKey] = {
            count: 0,
            name: order.laptopModel,
            brand: order.laptopBrand,
            revenue: 0,
          };
        }
        popularCounts[productKey].count += 1;
        popularCounts[productKey].revenue += Number(order.finalPrice || 0);
      });

      res.json({
        metrics: {
          totalProducts,
          activeProducts,
          outOfStock,
          disabledProducts,
          ordersCount,
          totalRevenue,
          visitorCount: 0,
          conversionRate: '0%',
        },
        performanceChart: Object.keys(revenueByMonth).map((name) => ({
          name,
          revenue: revenueByMonth[name],
          orders: ordersByMonth[name],
        })),
        popularLaptops: Object.values(popularCounts).sort((a, b) => b.count - a.count).slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
}
