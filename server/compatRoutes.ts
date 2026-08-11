import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';

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
  const raw = String(status || '').trim();
  const lower = raw.toLowerCase();

  if (
    [
      'demande reçue',
      'demande recue',
      'confirmée',
      'confirmee',
      'en traitement',
      'expédiée',
      'expediee',
      'livrée',
      'livree',
      'annulée',
      'annulee',
      'remboursée',
      'remboursee',
    ].includes(lower)
  ) {
    if (lower === 'demande recue') return 'Demande reçue';
    if (lower === 'confirmee') return 'Confirmée';
    if (lower === 'expediee') return 'Expédiée';
    if (lower === 'livree') return 'Livrée';
    if (lower === 'annulee') return 'Annulée';
    if (lower === 'remboursee') return 'Remboursée';
    return raw;
  }

  switch (raw) {
    case 'Devis validé':
      return 'Confirmée';
    case 'En préparation':
      return 'En traitement';
    case 'Prêt pour livraison':
      return 'Expédiée';
    case 'Livré':
      return 'Livrée';
    case 'Refusé':
      return 'Annulée';
    case 'Demande reçue':
    default:
      return 'Demande reçue';
  }
}

function fromDbOrderStatus(status?: string | null) {
  const lower = String(status || '').toLowerCase();
  switch (lower) {
    case 'confirmed':
    case 'confirmée':
    case 'confirmee':
      return 'Devis validé';
    case 'processing':
    case 'en traitement':
      return 'En préparation';
    case 'shipped':
    case 'expédiée':
    case 'expediee':
      return 'Prêt pour livraison';
    case 'delivered':
    case 'livrée':
    case 'livree':
      return 'Livré';
    case 'cancelled':
    case 'annulée':
    case 'annulee':
    case 'refunded':
    case 'remboursée':
    case 'remboursee':
      return 'Refusé';
    case 'pending':
    case 'demande reçue':
    case 'demande recue':
    default:
      return 'Demande reçue';
  }
}

function parseItemsPayload(value: any) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value];
}

function mapOrderRowToFrontend(row: any) {
  const isLegacySnake =
    row &&
    (row.client_name !== undefined ||
      row.client_phone !== undefined ||
      row.client_city !== undefined ||
      row.laptop_id !== undefined ||
      row.order_number !== undefined);

  const isLegacyCamel =
    row &&
    (row.clientName !== undefined ||
      row.clientPhone !== undefined ||
      row.clientCity !== undefined ||
      row.laptopId !== undefined ||
      row.orderNumber !== undefined);

  if (isLegacySnake) {
    const customizations = row.customizations || {
      ramUpgrade: 'Aucune',
      storageUpgrade: 'Aucun',
      osOption: 'Windows 11 Pro',
      accessories: [],
    };
    return {
      id: row.id,
      orderNumber: row.order_number || row.id,
      clientName: row.client_name || 'Client',
      clientPhone: row.client_phone || '',
      clientEmail: row.client_email || '',
      clientCity: row.client_city || '',
      laptopId: row.laptop_id || '',
      laptopBrand: row.laptop_brand || '',
      laptopModel: row.laptop_model || '',
      basePrice: Number(row.base_price ?? row.basePrice ?? row.final_price ?? row.finalPrice ?? 0),
      finalPrice: Number(row.final_price ?? row.finalPrice ?? 0),
      customizations,
      additionalNotes: row.additional_notes || '',
      status: fromDbOrderStatus(row.status),
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || row.updatedAt || row.created_at || row.createdAt || new Date().toISOString(),
    };
  }

  if (isLegacyCamel) {
    const customizations = row.customizations || {
      ramUpgrade: 'Aucune',
      storageUpgrade: 'Aucun',
      osOption: 'Windows 11 Pro',
      accessories: [],
    };
    return {
      id: row.id,
      orderNumber: row.orderNumber || row.id,
      clientName: row.clientName || 'Client',
      clientPhone: row.clientPhone || '',
      clientEmail: row.clientEmail || '',
      clientCity: row.clientCity || '',
      laptopId: row.laptopId || '',
      laptopBrand: row.laptopBrand || '',
      laptopModel: row.laptopModel || '',
      basePrice: Number(row.basePrice ?? row.finalPrice ?? 0),
      finalPrice: Number(row.finalPrice ?? 0),
      customizations,
      additionalNotes: row.additionalNotes || '',
      status: fromDbOrderStatus(row.status),
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      updatedAt: row.updatedAt || row.updated_at || row.createdAt || row.created_at || new Date().toISOString(),
    };
  }

  const items = parseItemsPayload(row.items);
  const first = items[0] || {};
  const totalFromItems = items.reduce((sum: number, it: any) => {
    const qty = Number(it?.quantity || 1);
    const unit = Number(it?.finalPrice || it?.price || it?.basePrice || 0);
    return sum + qty * unit;
  }, 0);
  const computedTotal = Number(row.total_amount || totalFromItems || 0);

  const summaryLabel =
    items.length > 1
      ? `${items.length} articles`
      : (first.laptopBrand || first.brand || '');

  return {
    id: row.id,
    orderNumber: row.id,
    clientName: first.clientName || row.shipping_address?.clientName || 'Client',
    clientPhone: first.clientPhone || row.shipping_address?.clientPhone || '',
    clientEmail: first.clientEmail || row.shipping_address?.clientEmail || '',
    clientCity: first.clientCity || row.shipping_address?.clientCity || '',
    laptopId: first.laptopId || first.productId || '',
    laptopBrand: summaryLabel,
    laptopModel: items.length > 1 ? 'Commande panier' : (first.laptopModel || first.model || ''),
    basePrice: Number(first.basePrice || computedTotal || 0),
    finalPrice: computedTotal,
    customizations: first.customizations || {
      ramUpgrade: 'Aucune',
      storageUpgrade: 'Aucun',
      osOption: 'Windows 11 Pro',
      accessories: [],
    },
    additionalNotes: first.additionalNotes || '',
    status: fromDbOrderStatus(row.status),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.created_at || row.createdAt || new Date().toISOString(),
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

function isMissingColumnError(error: any, column: string) {
  const message = String(error?.message || error || '');
  return message.includes(`Could not find the '${column}' column`);
}

function isAnyMissingColumnError(error: any, columns: string[]) {
  return columns.some((col) => isMissingColumnError(error, col));
}

function extractMissingColumnName(error: any) {
  const message = String(error?.message || error || '');
  const match = /Could not find the '([^']+)' column/i.exec(message);
  return match?.[1] ? String(match[1]) : null;
}

function isInvalidStatusValueError(error: any) {
  const message = String(error?.message || error || '').toLowerCase();
  if (!message.includes('status')) return false;
  return (
    message.includes('invalid input value for enum') ||
    message.includes('enum') ||
    message.includes('check constraint') ||
    message.includes('violates check constraint')
  );
}

async function adaptiveInsertSingleRow(adminDb: SupabaseLike, tableName: string, initialPayload: Record<string, any>) {
  const payload: Record<string, any> = { ...(initialPayload || {}) };
  const maxRetries = 30;

  for (let i = 0; i < maxRetries; i += 1) {
    const attempt = await adminDb.from(tableName).insert([payload]).select().single();
    if (!attempt.error) return { data: attempt.data, error: null };

    const missingCol = extractMissingColumnName(attempt.error);
    if (missingCol && Object.prototype.hasOwnProperty.call(payload, missingCol)) {
      delete payload[missingCol];
      continue;
    }

    return { data: null, error: attempt.error };
  }

  return { data: null, error: new Error('Insertion impossible: trop de colonnes incompatibles.') };
}

async function insertNotificationBestEffort(adminDb: SupabaseLike, payload: Record<string, any>) {
  try {
    const enriched = {
      title: String(payload?.title || '').trim() || 'Notification',
      message: payload?.message !== undefined && payload?.message !== null ? String(payload.message) : null,
      type: payload?.type || 'info',
      is_read: false,
      ...payload,
    };
    await adaptiveInsertSingleRow(adminDb, 'notifications', enriched);
  } catch {
    return;
  }
}

let cachedMailTransport: any = null;

function getAdminNotifyEmail() {
  return String(process.env.ADMIN_NOTIFY_EMAIL || 'hervekom37@gmail.com').trim() || 'hervekom37@gmail.com';
}

function getMailFromAddress() {
  return String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
}

function getMailTransport() {
  if (cachedMailTransport) return cachedMailTransport;

  const smtpUrl = String(process.env.SMTP_URL || '').trim();
  if (smtpUrl) {
    cachedMailTransport = nodemailer.createTransport(smtpUrl);
    return cachedMailTransport;
  }

  const host = String(process.env.SMTP_HOST || '').trim();
  const portRaw = String(process.env.SMTP_PORT || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  if (!host || !portRaw || !user || !pass) return null;

  const port = Number(portRaw);
  const secure = String(process.env.SMTP_SECURE || '').trim()
    ? String(process.env.SMTP_SECURE).trim().toLowerCase() === 'true'
    : port === 465;

  cachedMailTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedMailTransport;
}

async function sendAdminEmailBestEffort(subject: string, text: string) {
  try {
    const transport = getMailTransport();
    const to = getAdminNotifyEmail();
    const from = getMailFromAddress();
    if (!transport || !to || !from) return;

    await transport.sendMail({
      from,
      to,
      subject: String(subject || '').trim() || 'Herve_eShop',
      text: String(text || '').trim(),
    });
  } catch {
    return;
  }
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

      const orderId = id || `DV-${Date.now()}`;
      const quoteItem = {
        productId: laptopId,
        laptopId,
        brand: laptop.brand || '',
        model: laptop.model || '',
        quantity: 1,
        basePrice: Number(laptop.price_xaf || 0),
        finalPrice: resolvedFinalPrice,
        customizations: customizations || null,
        additionalNotes: additionalNotes || null,
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        clientCity: clientCity || '',
      };

      const unifiedPayloadBase: any = {
        id: id || undefined,
        order_number: orderId,
        orderNumber: orderId,
        client_name: clientName,
        clientName,
        client_phone: clientPhone,
        clientPhone,
        client_email: clientEmail || null,
        clientEmail: clientEmail || null,
        client_city: clientCity || '',
        clientCity: clientCity || '',
        laptop_id: laptopId,
        laptopId,
        laptop_brand: laptop.brand || '',
        laptopBrand: laptop.brand || '',
        laptop_model: laptop.model || '',
        laptopModel: laptop.model || '',
        base_price: Number(laptop.price_xaf || 0),
        basePrice: Number(laptop.price_xaf || 0),
        final_price: resolvedFinalPrice,
        finalPrice: resolvedFinalPrice,
        total_amount: resolvedFinalPrice,
        totalAmount: resolvedFinalPrice,
        items: [quoteItem],
        shipping_address: {
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          clientCity: clientCity || '',
          address: '',
        },
        customizations: customizations || null,
        additional_notes: additionalNotes || null,
        payment_status: 'pending',
        paymentStatus: 'pending',
        payment_method: null,
        paymentMethod: null,
        user_id: customerUser?.id || null,
        userId: customerUser?.id || null,
      };

      let inserted: any = null;
      const pendingAttempt = await adaptiveInsertSingleRow(adminDb, 'orders', { ...unifiedPayloadBase, status: 'pending' });
      if (!pendingAttempt.error) {
        inserted = pendingAttempt.data;
      } else if (isInvalidStatusValueError(pendingAttempt.error)) {
        const frenchAttempt = await adaptiveInsertSingleRow(adminDb, 'orders', { ...unifiedPayloadBase, status: toDbOrderStatus('Demande reçue') });
        if (frenchAttempt.error) throw frenchAttempt.error;
        inserted = frenchAttempt.data;
      } else {
        throw pendingAttempt.error;
      }

      await insertNotificationBestEffort(adminDb, {
        title: 'Nouvelle demande',
        message: `${clientName} a soumis une demande pour ${laptop.brand} ${laptop.model}.`,
        type: 'success',
        user_id: customerUser?.id || 'system',
        metadata: { orderId: inserted.id, source: 'client_quote' },
      });

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

  app.get('/api/client/reviews/:productId', async (req, res) => {
    const productId = String(req.params.productId || '').trim();
    if (!productId) return res.status(400).json({ error: 'productId requis.' });
    try {
      const { data, error } = await adminDb
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const reviews = (data || []).map((row: any) => ({
        id: row.id,
        author: row.author_name || 'Client',
        city: row.city || '',
        rating: Number(row.rating || 5),
        comment: row.comment || '',
        date: row.created_at || new Date().toISOString(),
        badge: row.badge || 'Client',
      }));
      res.json({ success: true, reviews });
    } catch (error) {
      if (isMissingTableError(error)) {
        return res.json({ success: true, reviews: [] });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/client/reviews', async (req, res) => {
    try {
      const customerUser = await extractCustomerUser(req, supabase);
      if (!customerUser) {
        return res.status(401).json({ error: 'Veuillez vous connecter pour publier un avis.' });
      }
      const { productId, rating, comment, city } = req.body || {};
      const normalizedProductId = String(productId || '').trim();
      const normalizedComment = String(comment || '').trim();
      const normalizedRating = Math.min(5, Math.max(1, Number(rating || 5)));
      const resolvedCity = String(city || customerUser.city || '').trim();

      if (!normalizedProductId || !normalizedComment) {
        return res.status(400).json({ error: 'productId et commentaire requis.' });
      }

      const metadata = (await supabase.auth.getUser(extractToken(req.headers['authorization-customer'] as string | undefined))).data?.user?.user_metadata || {};
      const authorName =
        String(metadata.name || metadata.username || customerUser.email || '')
          .trim() || 'Client';

      const insertPayload = {
        product_id: normalizedProductId,
        user_id: customerUser.id,
        rating: normalizedRating,
        comment: normalizedComment,
        author_name: authorName,
        city: resolvedCity,
        badge: 'Acheteur',
        is_published: true,
      };

      const { data, error } = await adminDb.from('product_reviews').insert([insertPayload]).select().single();
      if (error) throw error;

      pushAuditLog({
        userEmail: customerUser.email || 'client@herve-eshop.local',
        userRole: 'Client',
        action: 'Creation avis',
        entityId: String(data.id),
        entityType: 'Review',
      });

      res.json({
        success: true,
        review: {
          id: data.id,
          author: data.author_name || authorName,
          city: data.city || resolvedCity,
          rating: Number(data.rating || normalizedRating),
          comment: data.comment || normalizedComment,
          date: data.created_at || new Date().toISOString(),
          badge: data.badge || 'Acheteur',
        }
      });
    } catch (error) {
      if (isMissingTableError(error)) {
        return res.status(500).json({ error: 'Table product_reviews introuvable. Ajoutez-la dans Supabase.' });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/client/checkout', async (req, res) => {
    try {
      const payload = req.body || {};
      const cartItems = Array.isArray(payload.items) ? payload.items : [];
      const shipping = payload.shipping || {};
      const delivery = payload.delivery || {};

      if (!cartItems.length) {
        return res.status(400).json({ error: 'Panier vide.' });
      }

      const clientName = String(shipping.clientName || shipping.name || '').trim();
      const clientPhone = String(shipping.clientPhone || shipping.phone || '').trim();
      const clientEmail = String(shipping.clientEmail || shipping.email || '').trim();
      const clientCity = String(shipping.clientCity || shipping.city || '').trim();
      const clientAddress = String(shipping.address || shipping.clientAddress || '').trim();

      if (!clientName || !clientPhone || !clientCity) {
        return res.status(400).json({ error: 'Nom, téléphone et ville sont obligatoires pour la livraison.' });
      }

      const requestedIds = cartItems.map((it: any) => String(it.productId || it.id || '').trim()).filter(Boolean);
      const quantitiesById = new Map<string, number>();
      cartItems.forEach((it: any) => {
        const id = String(it.productId || it.id || '').trim();
        const qty = Math.max(1, Number(it.quantity || 1));
        if (!id) return;
        quantitiesById.set(id, (quantitiesById.get(id) || 0) + qty);
      });

      const { data: products, error } = await adminDb.from('laptops').select('*').in('id', requestedIds);
      if (error) throw error;
      const productsById = new Map<string, any>((products || []).map((p: any) => [String(p.id), p]));

      const normalizedItems = Array.from(quantitiesById.entries()).map(([id, quantity]) => {
        const row = productsById.get(id);
        if (!row) {
          throw new Error(`Produit introuvable: ${id}`);
        }
        const unitPrice = Number(row.price_xaf || 0);
        return {
          productId: id,
          brand: row.brand || '',
          model: row.model || '',
          quantity,
          basePrice: unitPrice,
          finalPrice: unitPrice,
        };
      });

      const totalAmount = normalizedItems.reduce((sum: number, it: any) => sum + Number(it.finalPrice || 0) * Number(it.quantity || 1), 0);
      if (totalAmount <= 0) {
        return res.status(400).json({ error: 'Montant total invalide.' });
      }

      const customerUser = await extractCustomerUser(req, supabase);
      const firstItem = normalizedItems[0];
      const orderId = `CMD-${Date.now()}`;
      const unifiedPayloadBase: any = {
        order_number: orderId,
        orderNumber: orderId,
        client_name: clientName,
        clientName,
        client_phone: clientPhone,
        clientPhone,
        client_email: clientEmail || null,
        clientEmail: clientEmail || null,
        client_city: clientCity,
        clientCity,
        laptop_id: String(firstItem?.productId || ''),
        laptopId: String(firstItem?.productId || ''),
        laptop_brand: normalizedItems.length > 1 ? `${normalizedItems.length} articles` : String(firstItem?.brand || ''),
        laptopBrand: normalizedItems.length > 1 ? `${normalizedItems.length} articles` : String(firstItem?.brand || ''),
        laptop_model: normalizedItems.length > 1 ? 'Commande panier' : String(firstItem?.model || ''),
        laptopModel: normalizedItems.length > 1 ? 'Commande panier' : String(firstItem?.model || ''),
        base_price: totalAmount,
        basePrice: totalAmount,
        final_price: totalAmount,
        finalPrice: totalAmount,
        total_amount: totalAmount,
        totalAmount: totalAmount,
        items: normalizedItems,
        shipping_address: {
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          clientCity,
          address: clientAddress,
        },
        customizations: {
          type: 'cart',
          items: normalizedItems,
          shipping: {
            address: clientAddress,
            clientName,
            clientPhone,
            clientEmail,
            clientCity,
          },
          delivery: {
            method: String(delivery.method || 'delivery'),
            notes: String(delivery.notes || ''),
          },
        },
        additional_notes: normalizedItems.length > 1 ? `Commande panier: ${normalizedItems.length} article(s).` : null,
        payment_status: 'pending',
        paymentStatus: 'pending',
        payment_method: null,
        paymentMethod: null,
        user_id: customerUser?.id || null,
        userId: customerUser?.id || null,
      };

      let inserted: any = null;
      const pendingAttempt = await adaptiveInsertSingleRow(adminDb, 'orders', { ...unifiedPayloadBase, status: 'pending' });
      if (!pendingAttempt.error) {
        inserted = pendingAttempt.data;
      } else if (isInvalidStatusValueError(pendingAttempt.error)) {
        const frenchAttempt = await adaptiveInsertSingleRow(adminDb, 'orders', { ...unifiedPayloadBase, status: toDbOrderStatus('Demande reçue') });
        if (frenchAttempt.error) throw frenchAttempt.error;
        inserted = frenchAttempt.data;
      } else {
        throw pendingAttempt.error;
      }

      for (const it of normalizedItems) {
        const row = productsById.get(it.productId);
        const stock = Number(row?.stock_quantity || 0);
        const nextStock = Math.max(0, stock - Number(it.quantity || 1));
        await adminDb.from('laptops').update({ stock_quantity: nextStock, updated_at: new Date().toISOString() }).eq('id', it.productId);
      }

      await insertNotificationBestEffort(adminDb, {
        title: 'Nouvelle commande panier',
        message: `${clientName} a validé un panier (${normalizedItems.length} article(s)) - Total: ${totalAmount.toLocaleString('fr-FR')} FCFA.`,
        type: 'success',
        user_id: customerUser?.id || 'system',
        metadata: { orderId: inserted.id, source: 'client_checkout' },
      });

      await sendAdminEmailBestEffort(
        'Herve_eShop - Nouvelle commande panier',
        [
          `Une nouvelle commande panier vient d'être validée.`,
          ``,
          `Commande: ${String(inserted?.id || '').trim() || 'N/A'}`,
          `Client: ${clientName}`,
          `Téléphone: ${clientPhone}`,
          `Ville: ${clientCity}`,
          clientEmail ? `Email: ${clientEmail}` : null,
          clientAddress ? `Adresse: ${clientAddress}` : null,
          `Articles: ${normalizedItems.length}`,
          `Total: ${totalAmount.toLocaleString('fr-FR')} FCFA`,
        ].filter(Boolean).join('\n'),
      );

      pushAuditLog({
        userEmail: customerUser?.email || 'guest@herve-eshop.local',
        userRole: customerUser ? 'Client' : 'Guest',
        action: 'Creation commande panier',
        entityId: inserted.id,
        entityType: 'Order',
      });

      res.json({ success: true, order: mapOrderRowToFrontend(inserted) });
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

      let token = data.session?.access_token || null;
      if (!token) {
        const { data: loginData } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password,
        });
        token = loginData?.session?.access_token || null;
      }

      await insertNotificationBestEffort(adminDb, {
        title: 'Nouvel utilisateur',
        message: `${String(name || '').trim()} vient de créer un compte${city ? ` (${String(city).trim()})` : ''}${phone ? ` - ${String(phone).trim()}` : ''}${email ? ` - ${String(email).trim()}` : ''}.`,
        type: 'info',
        user_id: data.user?.id || 'system',
        metadata: { source: 'client_register', userId: data.user?.id || null },
      });

      await sendAdminEmailBestEffort(
        'Herve_eShop - Nouvel utilisateur',
        [
          `Un nouvel utilisateur vient de s'inscrire.`,
          ``,
          `Nom: ${String(name || '').trim() || 'N/A'}`,
          email ? `Email: ${String(email).trim()}` : null,
          phone ? `Téléphone: ${String(phone).trim()}` : null,
          city ? `Ville: ${String(city).trim()}` : null,
          `UserId: ${String(data.user?.id || '').trim() || 'N/A'}`,
        ].filter(Boolean).join('\n'),
      );

      res.json({
        success: true,
        token,
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
      let orders: any[] = [];
      const firstAttempt = await (async () => {
        let ordersQuery: any = adminDb.from('orders').select('*').order('created_at', { ascending: false });
        if (user.email && user.phone) {
          ordersQuery = ordersQuery.or(`client_email.eq.${user.email},client_phone.eq.${user.phone}`);
        } else if (user.email) {
          ordersQuery = ordersQuery.eq('client_email', user.email);
        } else if (user.phone) {
          ordersQuery = ordersQuery.eq('client_phone', user.phone);
        }
        return ordersQuery;
      })();

      if (firstAttempt.error) {
        const cols = ['created_at', 'client_email', 'client_phone'];
        if (isAnyMissingColumnError(firstAttempt.error, cols)) {
          const allAttempt = await adminDb.from('orders').select('*');
          if (allAttempt.error) throw allAttempt.error;
          const mapped = (allAttempt.data || []).map(mapOrderRowToFrontend);
          orders = mapped.filter((o: any) => {
            const emailMatch = user.email ? String(o.clientEmail || '').trim() === String(user.email || '').trim() : false;
            const phoneMatch = user.phone ? String(o.clientPhone || '').trim() === String(user.phone || '').trim() : false;
            return emailMatch || phoneMatch;
          });
        } else {
          throw firstAttempt.error;
        }
      } else {
        orders = firstAttempt.data || [];
      }
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
      const firstAttempt = await adminDb.from('orders').select('*').order('created_at', { ascending: false });
      if (firstAttempt.error) {
        if (isMissingColumnError(firstAttempt.error, 'created_at')) {
          const secondAttempt = await adminDb.from('orders').select('*').order('createdAt', { ascending: false });
          if (secondAttempt.error) throw secondAttempt.error;
          return res.json((secondAttempt.data || []).map(mapOrderRowToFrontend));
        }
        throw firstAttempt.error;
      }
      res.json((firstAttempt.data || []).map(mapOrderRowToFrontend));
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
      const isLegacy =
        current &&
        (current.client_name !== undefined ||
          current.client_phone !== undefined ||
          current.client_city !== undefined ||
          current.laptop_id !== undefined ||
          current.order_number !== undefined);

      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (req.body.status) {
        updatePayload.status = toDbOrderStatus(req.body.status);
      }
      if (req.body.finalPrice !== undefined) {
        if (isLegacy) {
          updatePayload.final_price = Number(req.body.finalPrice);
        } else {
          updatePayload.total_amount = Number(req.body.finalPrice);
          const items = parseItemsPayload(current.items);
          const first = items[0] || {};
          updatePayload.items = { ...first, finalPrice: Number(req.body.finalPrice) };
        }
      }

      const { data, error } = await adminDb.from('orders').update(updatePayload).eq('id', req.params.id).select().single();
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
      const firstAttempt = await adminDb.from('orders').select('*').order('created_at', { ascending: false });
      if (firstAttempt.error) {
        if (isMissingColumnError(firstAttempt.error, 'created_at')) {
          const secondAttempt = await adminDb.from('orders').select('*').order('createdAt', { ascending: false });
          if (secondAttempt.error) throw secondAttempt.error;
          const data = secondAttempt.data || [];
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
          return res.json(Array.from(grouped.values()));
        }
        throw firstAttempt.error;
      }
      const data = firstAttempt.data || [];
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
