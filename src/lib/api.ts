// Client API helper for Herve_eShop Full-Stack backend

const AUTH_TOKEN_KEY = 'herve_eshop_admin_token';
const AUTH_USER_KEY = 'herve_eshop_admin_user';

const CUSTOMER_TOKEN_KEY = 'herve_eshop_customer_token';
const CUSTOMER_USER_KEY = 'herve_eshop_customer_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function getCachedAdminUser() {
  const user = localStorage.getItem(AUTH_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setCachedAdminUser(user: any) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

// Guest Customer Helpers
export function getGuestToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setGuestToken(token: string | null) {
  if (token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
  }
}

export function getCachedGuestUser() {
  const user = localStorage.getItem(CUSTOMER_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setCachedGuestUser(user: any) {
  if (user) {
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CUSTOMER_USER_KEY);
  }
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

function buildApiUrl(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

// Low-level fetcher
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const guestToken = getGuestToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': token } : {}),
    ...(guestToken ? { 'Authorization-Customer': guestToken } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur de communication serveur (${response.status})`);
  }

  // Handle attachment downloads
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response;
}

export const API = {
  // Public client methods
  visitorIncrement: () => apiFetch('/api/visitor-increment'),
  getClientData: () => apiFetch('/api/client/data'),
  submitQuoteRequest: (data: any) => apiFetch('/api/client/quote', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getQuoteTracking: (id: string) => apiFetch(`/api/client/quote/${id}`),

  // Customer Auth methods
  registerCustomer: async (payload: any) => {
    const res = await apiFetch('/api/client/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      setGuestToken(res.token);
      setCachedGuestUser(res.user);
    }
    return res;
  },
  loginCustomer: async (payload: any) => {
    const res = await apiFetch('/api/client/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      setGuestToken(res.token);
      setCachedGuestUser(res.user);
    }
    return res;
  },
  logoutCustomer: () => {
    setGuestToken(null);
  },
  getCustomerProfile: () => apiFetch('/api/client/auth/profile'),
  updateCustomerProfile: async (payload: any) => {
    const res = await apiFetch('/api/client/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      setCachedGuestUser(res.user);
    }
    return res;
  },

  // Auth methods
  login: async (credentials: any) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res.success) {
      setAuthToken(res.token);
      setCachedAdminUser(res.user);
    }
    return res;
  },
  me: () => apiFetch('/api/auth/me'),
  logout: () => {
    setAuthToken(null);
  },
  changePassword: (data: any) => apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Admin users (Super Admin only)
  getAdminUsers: () => apiFetch('/api/admin/users'),
  createAdminUser: (data: any) => apiFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateAdminUser: (id: string, data: any) => apiFetch(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteAdminUser: (id: string) => apiFetch(`/api/admin/users/${id}`, {
    method: 'DELETE'
  }),

  // Products CRUD
  getProducts: () => apiFetch('/api/admin/products'),
  createProduct: (data: any) => apiFetch('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProduct: (id: string, data: any) => apiFetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProduct: (id: string) => apiFetch(`/api/admin/products/${id}`, {
    method: 'DELETE'
  }),

  // Categories CRUD
  createCategory: (data: any) => apiFetch('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCategory: (id: string, data: any) => apiFetch(`/api/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCategory: (id: string) => apiFetch(`/api/admin/categories/${id}`, {
    method: 'DELETE'
  }),

  // Orders CMS CRUD
  getOrders: () => apiFetch('/api/admin/orders'),
  updateOrder: (id: string, data: any) => apiFetch(`/api/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteOrder: (id: string) => apiFetch(`/api/admin/orders/${id}`, {
    method: 'DELETE'
  }),

  // Customers (view-only ledger)
  getCustomers: () => apiFetch('/api/admin/customers'),

  // Site CMS Editors
  updateSiteCMS: (data: any) => apiFetch('/api/admin/cms/site', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateContactCMS: (data: any) => apiFetch('/api/admin/cms/contact', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateSocialCMS: (data: any) => apiFetch('/api/admin/cms/social', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Banners CRUD
  getBanners: () => apiFetch('/api/admin/banners'),
  createBanner: (data: any) => apiFetch('/api/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateBanner: (id: string, data: any) => apiFetch(`/api/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteBanner: (id: string) => apiFetch(`/api/admin/banners/${id}`, {
    method: 'DELETE'
  }),

  // Buying Guides CRUD
  getGuides: () => apiFetch('/api/admin/guides'),
  createGuide: (data: any) => apiFetch('/api/admin/guides', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateGuide: (id: string, data: any) => apiFetch(`/api/admin/guides/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteGuide: (id: string) => apiFetch(`/api/admin/guides/${id}`, {
    method: 'DELETE'
  }),

  // Blog CMS CRUD
  getBlogPosts: () => apiFetch('/api/admin/blog'),
  createBlogPost: (data: any) => apiFetch('/api/admin/blog', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateBlogPost: (id: string, data: any) => apiFetch(`/api/admin/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteBlogPost: (id: string) => apiFetch(`/api/admin/blog/${id}`, {
    method: 'DELETE'
  }),

  // System Notifications Centre
  getNotifications: () => apiFetch('/api/admin/notifications'),
  markNotificationsAsRead: () => apiFetch('/api/admin/notifications/read', {
    method: 'PUT'
  }),
  deleteNotification: (id: string) => apiFetch(`/api/admin/notifications/${id}`, {
    method: 'DELETE'
  }),

  // Audit Trails logs
  getActivityLogs: () => apiFetch('/api/admin/logs'),

  // Media manager and raw file encoding
  getMediaFiles: () => apiFetch('/api/admin/media'),
  uploadMedia: (fileName: string, base64Data: string, bucketName: string = 'products') => apiFetch('/api/admin/media/upload', {
    method: 'POST',
    body: JSON.stringify({ fileName, base64Data, bucketName })
  }),
  deleteMedia: (filename: string) => apiFetch(`/api/admin/media/${filename}`, {
    method: 'DELETE'
  }),

  // Database Backup Utility
  exportDatabase: async () => {
    const res = await apiFetch('/api/admin/backup/export');
    const blob = await (res as any).blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Herve-eShop-Complete-Backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
  importDatabase: (jsonContent: string) => apiFetch('/api/admin/backup/import', {
    method: 'POST',
    body: JSON.stringify({ jsonContent })
  }),

  // Complex multi-metric Analytics
  getAnalytics: () => apiFetch('/api/admin/analytics'),

  // --- COMPATIBILITY ALIASES FOR COMPONENT ACTIONS ---
  getLaptops: async () => {
    // Get list of products from client data endpoint
    const data = await apiFetch('/api/client/data');
    return data.products || [];
  },
  createOrder: (data: any) => apiFetch('/api/client/quote', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // AdminPanel aliases
  getCurrentUser: () => getCachedAdminUser(),
  checkSession: () => apiFetch('/api/auth/me'),
  loginAdmin: (email: any, password?: string) => {
    const creds = password ? { email, password } : email;
    return API.login(creds);
  },
  logoutAdmin: () => {
    API.logout();
    return Promise.resolve({ success: true });
  },
  resetAdminPassword: (email: any, password?: string) => {
    const data = password ? { email, password } : email;
    return apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // AdminSettings aliases
  getAdmins: () => apiFetch('/api/admin/users'),
  getAuditLogs: () => apiFetch('/api/admin/logs'),
  createAdmin: (data: any) => apiFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAdmin: (id: string) => apiFetch(`/api/admin/users/${id}`, {
    method: 'DELETE'
  }),
  getDatabaseBackupFile: async () => {
    // Return direct string download trigger
    const res = await apiFetch('/api/admin/backup/export');
    return res;
  },
  restoreDatabaseBackupFile: (jsonContent: string) => apiFetch('/api/admin/backup/import', {
    method: 'POST',
    body: JSON.stringify({ jsonContent })
  })
};
export default API;
