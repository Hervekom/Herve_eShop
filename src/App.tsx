import React, { useState, useEffect } from 'react';
import { 
  Minus, Plus, ShoppingCart, Sparkles, Trash2, Bell, ArrowRight, Shield, Users, CheckCircle, Smartphone, Info, RefreshCw, X,
  Facebook, Instagram, Linkedin, Youtube, Twitter, Music2
} from 'lucide-react';
import Header from './components/Header';
import CatalogView from './components/CatalogView';
import Testimonials from './components/Testimonials';
import BuyingGuides from './components/BuyingGuides';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import BackToTopButton from './components/BackToTopButton';
import HerveLogo from './components/HerveLogo';
import QuoteRequestModal from './components/QuoteRequestModal';
import LaptopDetailModal from './components/LaptopDetailModal';
import CustomerAccountModal from './components/CustomerAccountModal';
import AdminPanel from './components/admin/AdminPanel';
import API from './lib/api';
import { Laptop, QuoteRequest, RealtimeNotification, QuoteStatus, LaptopStatus } from './types';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message || error || 'Erreur inconnue') };
  }

  componentDidCatch(error: any) {
    this.setState({ message: String(error?.message || error || 'Erreur inconnue') });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-warm-cream text-luxe-dark flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-warm-cream-dark/70 shadow-xl p-6 text-left space-y-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <h2 className="font-serif font-extrabold text-luxe-dark">Erreur d'affichage</h2>
          </div>
          <p className="text-xs text-luxe-muted">
            Une erreur a empêché l'ouverture de la fiche produit. Cliquez sur “Réinitialiser” puis rechargez la page.
          </p>
          <div className="bg-warm-cream/60 border border-warm-cream-dark/60 rounded-2xl p-3 text-[11px] font-mono text-luxe-dark whitespace-pre-wrap">
            {this.state.message}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  [
                    'herve_eshop_customer_user',
                    'herve_eshop_customer_token',
                    'herve_eshop_admin_user',
                    'herve_eshop_admin_token',
                    'herve_eshop_cart',
                  ].forEach((k) => localStorage.removeItem(k));
                } catch {
                }
                window.location.reload();
              }}
              className="flex-1 bg-luxe-dark text-white hover:bg-luxe-copper transition-colors py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 bg-white text-luxe-dark border border-warm-cream-dark hover:bg-warm-cream transition-colors py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider"
            >
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default function App() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  // --- Core Persistent State Hookup ---
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  // UI Active State Tab selectors
  const [role, setRole] = useState<'client' | 'admin'>(() => {
    return window.location.pathname === '/admin' ? 'admin' : 'client';
  });
  const [activeTab, setActiveTab] = useState<string>('catalogue');
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedLaptopForQuote, setSelectedLaptopForQuote] = useState<Laptop | null>(null);
  const [selectedLaptopForDetails, setSelectedLaptopForDetails] = useState<Laptop | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Array<{ product: Laptop; quantity: number }>>(() => {
    try {
      const raw = localStorage.getItem('herve_eshop_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // --- Customer / User Account State ---
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [activeCustomerUser, setActiveCustomerUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('herve_eshop_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active floating live alert simulation state
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);

  // Favorites state tracking
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('herve_eshop_favourites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('herve_eshop_cart', JSON.stringify(cartItems));
    } catch {
    }
  }, [cartItems]);

  useEffect(() => {
    if (activeCustomerUser) {
      setCheckoutName(activeCustomerUser.name || '');
      setCheckoutPhone(activeCustomerUser.phone || '');
      setCheckoutCity(activeCustomerUser.city || '');
    }
  }, [activeCustomerUser]);

  const cartCount = cartItems.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const cartTotal = cartItems.reduce((sum, it) => sum + Number(it.product.price || 0) * Number(it.quantity || 0), 0);

  const socialCMS = clientData?.socialCMS || {};
  const normalizeExternalUrl = (raw: any) => {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  };

  const socialLinks = [
    { key: 'facebook', label: 'Facebook', Icon: Facebook, active: socialCMS?.facebook?.active, url: socialCMS?.facebook?.url },
    { key: 'instagram', label: 'Instagram', Icon: Instagram, active: socialCMS?.instagram?.active, url: socialCMS?.instagram?.url },
    { key: 'tiktok', label: 'TikTok', Icon: Music2, active: socialCMS?.tiktok?.active, url: socialCMS?.tiktok?.url },
    { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin, active: socialCMS?.linkedin?.active, url: socialCMS?.linkedin?.url },
    { key: 'youtube', label: 'YouTube', Icon: Youtube, active: socialCMS?.youtube?.active, url: socialCMS?.youtube?.url },
    { key: 'twitter', label: 'X', Icon: Twitter, active: socialCMS?.twitter?.active, url: socialCMS?.twitter?.url },
  ]
    .filter((s) => Boolean(s.active) && Boolean(String(s.url || '').trim()))
    .map((s) => ({ ...s, url: normalizeExternalUrl(s.url) }))
    .filter((s) => Boolean(s.url));

  // Load from real server on mount
  const loadServerData = async () => {
    try {
      setLoading(true);
      try {
        const data = await API.getClientData();
        setClientData(data);
        setLaptops(data.products || []);
      } catch (cmsErr) {
        setClientData(null);
        const res = await API.getLaptops();
        setLaptops(res);
      }

      const hasAdminToken = localStorage.getItem('herve_eshop_admin_token');
      if (hasAdminToken) {
        try {
          const oRes = await API.getOrders();
          // convert Order[] format to QuoteRequest[] on the client side
          const converted = oRes.map((o: any) => ({
            id: o.id,
            laptopId: o.laptopId,
            laptopBrand: o.laptopBrand,
            laptopModel: o.laptopModel,
            basePrice: o.basePrice,
            finalPrice: o.finalPrice,
            clientName: o.clientName,
            clientEmail: o.clientEmail,
            clientPhone: o.clientPhone,
            clientCity: o.clientCity,
            customizations: o.customizations,
            additionalNotes: o.additionalNotes,
            status: o.status,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt
          }));
          setQuotes(converted);
        } catch (oErr) {
          console.error('Failed to parse orders payload', oErr);
        }
      }
    } catch (err) {
      console.error('Database connection failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServerData();

    // Listen for manual URL path modifications or hash updates
    const handleLocationChange = () => {
      if (window.location.pathname === '/admin') {
        setRole('admin');
      } else {
        setRole('client');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('herve_eshop_favourites', JSON.stringify(favouriteIds));
  }, [favouriteIds]);

  const handleToggleFavourite = (id: string) => {
    setFavouriteIds((prev) => {
      const isFav = prev.includes(id);
      let nextFavs;
      if (isFav) {
        nextFavs = prev.filter((item_id) => item_id !== id);
        triggerToastAlert('Favoris mis à jour 🤍', 'Retiré de vos favoris.');
      } else {
        nextFavs = [...prev, id];
        triggerToastAlert('Ajouté aux favoris! ❤️', 'Retrouvez-le facilement dans vos favoris.');
      }
      return nextFavs;
    });
  };

  const handleAddToCart = (product: Laptop) => {
    if (product.stockQuantity <= 0 || product.status === 'Rupture') {
      triggerToastAlert('Indisponible', 'Cet article est en rupture de stock.', 'warning');
      return;
    }
    setCartItems((prev) => {
      const idx = prev.findIndex((x) => x.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const currentQty = Number(next[idx].quantity || 0);
        const maxQty = Math.max(1, Number(product.stockQuantity || 1));
        next[idx] = { ...next[idx], quantity: Math.min(maxQty, currentQty + 1) };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
    triggerToastAlert('Ajout au panier', `${product.brand} ${product.model} ajouté au panier.`, 'success');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleUpdateCartQty = (productId: string, nextQty: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => (it.product.id === productId ? { ...it, quantity: Math.max(1, Math.floor(nextQty)) } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartItems.length) return;

    try {
      setIsCheckingOut(true);
      const res = await API.checkoutCart({
        items: cartItems.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
        shipping: {
          clientName: checkoutName,
          clientPhone: checkoutPhone,
          clientCity: checkoutCity,
          address: checkoutAddress,
          clientEmail: activeCustomerUser?.email || '',
        },
        delivery: {
          method: deliveryMethod,
          notes: deliveryNotes,
        },
      });
      if (res?.success) {
        setCartItems([]);
        setIsCartOpen(false);
        triggerToastAlert('Commande envoyée', 'Votre commande panier a été enregistrée. Nous vous contactons rapidement.', 'success');
      }
    } catch (err) {
      triggerToastAlert('Erreur commande', (err as Error).message, 'danger');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Utility to fire custom UI Toast alerts instantly 
  const triggerToastAlert = (title: string, message: string, type: string = 'info') => {
    const toastId = `toast-${Date.now()}`;
    setActiveToast({ id: toastId, title, message, type });
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setActiveToast((prev) => (prev?.id === toastId ? null : prev));
    }, 6000);
  };

  // --- Handlers for Catalog Operations ---

  const handleSelectLaptopForQuote = (laptop: Laptop) => {
    setSelectedLaptopForQuote(laptop);
  };

  const handleCloseQuoteModal = () => {
    setSelectedLaptopForQuote(null);
  };

  // Submit client customized quote request
  const handleSubmitQuote = async (newQuote: QuoteRequest) => {
    try {
      // Map customized QuoteRequest to DB order shape
      await API.createOrder({
        id: newQuote.id,
        clientName: newQuote.clientName,
        clientPhone: newQuote.clientPhone,
        clientEmail: newQuote.clientEmail,
        clientCity: newQuote.clientCity,
        laptopId: newQuote.laptopId,
        laptopBrand: newQuote.laptopBrand,
        laptopModel: newQuote.laptopModel,
        basePrice: newQuote.basePrice,
        finalPrice: newQuote.finalPrice,
        customizations: newQuote.customizations,
        additionalNotes: newQuote.additionalNotes || '',
        status: 'Demande reçue'
      });

      // Reload fresh state from DB (stock subtract, orders history, state values)
      await loadServerData();

      // Create confirmation system notification
      const newNotif: RealtimeNotification = {
        id: `notif-${Date.now()}`,
        quoteId: newQuote.id,
        clientEmail: newQuote.clientEmail,
        title: 'Demande de devis enregistrée ! 📥',
        message: `Votre demande pour le ${newQuote.laptopBrand} ${newQuote.laptopModel} (${formatPrice(newQuote.finalPrice)}) est reçue par Hervé.`,
        status: 'Demande reçue',
        timestamp: new Date().toISOString(),
        isRead: false
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setSelectedLaptopForQuote(null);

      // Prompt user on screen
      triggerToastAlert(
        'Demande validée ! 📬',
        `Le devis #${newQuote.id} a été généré. Nous vous redirigeons vers votre espace de suivi...`
      );
    } catch (err) {
      triggerToastAlert('Échec de soumission ❌', (err as Error).message, 'danger');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  // SWITCH RENDER IF ROLE IS ADMIN
  if (role === 'admin') {
    return (
      <AdminPanel 
        onBackToPublic={() => {
          setRole('client');
          window.history.pushState({}, '', '/');
        }} 
      />
    );
  }  // Notification center operations
  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-warm-cream text-luxe-dark selection:bg-luxe-gold/30 flex flex-col justify-between antialiased">
      {/* Dynamic Header Component */}
      <Header
        onSearchChange={setSearchValue}
        searchValue={searchValue}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
        activeUser={activeCustomerUser}
        cms={clientData}
      />

      {/* FLOATING REALTIME SIMULATION TOAST */}
      {activeToast && (
        <div 
          className="fixed bottom-6 right-6 z-55 max-w-sm w-full bg-luxe-dark text-warm-cream rounded-2xl shadow-2xl border-2 border-luxe-gold/60 p-5 flex gap-4 animate-in slide-in-from-right-8 duration-300"
          id={`toast-alert-${activeToast.id}`}
        >
          <div className="mt-0.5">
            <span className="w-3.5 h-3.5 rounded-full bg-luxe-copper animate-ping inline-block"></span>
          </div>
          <div className="flex-1 text-left">
            <h5 className="font-serif font-bold text-sm text-luxe-gold flex items-center justify-between">
              {activeToast.title}
              <button 
                onClick={() => setActiveToast(null)} 
                className="text-warm-cream/50 hover:text-white font-serif font-bold"
              >
                &times;
              </button>
            </h5>
            <p className="text-xs text-warm-cream-dark/80 mt-1.5 leading-relaxed">
              {activeToast.message}
            </p>
            <span className="text-[9px] uppercase tracking-widest text-luxe-gold font-bold block mt-2 font-mono">
              Live Notification Loop • Herve_eShop
            </span>
          </div>
        </div>
      )}

      {/* PRIMARY VIEWS BODY */}
      <main className="flex-1">
        <CatalogView 
          laptops={laptops} 
          onSelectLaptopForQuote={handleSelectLaptopForQuote} 
          onSelectLaptopForDetails={setSelectedLaptopForDetails}
          searchValue={searchValue}
          favouriteIds={favouriteIds}
          onToggleFavourite={handleToggleFavourite}
          onTriggerToast={triggerToastAlert}
          onAddToCart={handleAddToCart}
          cms={clientData}
        />
        
        {/* CLIENT TESTIMONIALS & TRUST BUILDING SECTION */}
        <Testimonials
          onRequireLogin={() => setIsAccountModalOpen(true)}
          onTriggerToast={triggerToastAlert}
        />

        {/* HERVE BUYING GUIDES RECOMMENDATIONS */}
        <BuyingGuides cms={clientData} />
      </main>

      {/* CUSTOM QUOTE REQUEST MODAL OVERLAY */}
      {selectedLaptopForQuote && (
        <QuoteRequestModal
          laptop={selectedLaptopForQuote}
          onClose={handleCloseQuoteModal}
          onSubmitQuote={handleSubmitQuote}
        />
      )}

      {/* CUSTOMER REGISTRATION / PROFILE BACKEND MODAL */}
      {isAccountModalOpen && (
        <CustomerAccountModal
          onClose={() => setIsAccountModalOpen(false)}
          onSuccess={(user) => setActiveCustomerUser(user)}
          triggerToast={(title, message, type) => {
            setActiveToast({
              id: Date.now().toString(),
              title,
              message,
              type: type || 'info'
            });
            setTimeout(() => {
              setActiveToast(null);
            }, 5000);
          }}
        />
      )}

      {/* LAPTOP SHOWCASE DETAIL MODAL */}
      <LaptopDetailModal
        laptop={selectedLaptopForDetails}
        isOpen={selectedLaptopForDetails !== null}
        onClose={() => setSelectedLaptopForDetails(null)}
        favouriteIds={favouriteIds}
        onToggleFavourite={handleToggleFavourite}
        onSelectLaptopForQuote={handleSelectLaptopForQuote}
        onTriggerToast={triggerToastAlert}
        onAddToCart={handleAddToCart}
        onRequireLogin={() => setIsAccountModalOpen(true)}
        whatsAppPhone={clientData?.contactCMS?.whatsAppPhone}
      />

      {isCartOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-luxe-dark/70 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-warm-cream rounded-3xl border border-warm-cream-dark/70 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-warm-cream-dark/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-luxe-copper" />
                <h3 className="font-serif font-bold text-luxe-dark">Panier</h3>
                <span className="text-[11px] font-bold text-luxe-muted">({cartCount})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-warm-cream-dark/60 text-luxe-muted hover:text-luxe-dark"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-warm-cream-dark/70">
                    <ShoppingCart className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-luxe-dark">Votre panier est vide</p>
                    <p className="text-[10px] text-luxe-muted mt-1">Ajoutez des articles depuis le catalogue.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((it) => (
                      <div key={it.product.id} className="bg-white rounded-2xl border border-warm-cream-dark/60 p-4 flex gap-3 items-start">
                        <img
                          src={it.product.image}
                          alt={`${it.product.brand} ${it.product.model}`}
                          className="w-16 h-16 rounded-xl object-cover border border-warm-cream-dark/60"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="text-xs font-bold text-luxe-dark">{it.product.brand} {it.product.model}</div>
                              <div className="text-[10px] text-luxe-muted mt-0.5">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(it.product.price).replace('XAF', 'FCFA')}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(it.product.id)}
                              className="p-2 rounded-xl hover:bg-warm-cream text-luxe-muted hover:text-luxe-dark border border-warm-cream-dark/60"
                              title="Retirer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 bg-warm-cream/60 border border-warm-cream-dark/60 rounded-full px-2 py-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(it.product.id, it.quantity - 1)}
                                className="w-7 h-7 rounded-full bg-white border border-warm-cream-dark/70 flex items-center justify-center hover:bg-warm-cream"
                                title="Diminuer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold text-luxe-dark w-6 text-center">{it.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(it.product.id, it.quantity + 1)}
                                className="w-7 h-7 rounded-full bg-white border border-warm-cream-dark/70 flex items-center justify-center hover:bg-warm-cream"
                                title="Augmenter"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-xs font-bold text-luxe-dark">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(it.product.price * it.quantity).replace('XAF', 'FCFA')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cartItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-warm-cream-dark/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-luxe-muted uppercase tracking-wider">Total</span>
                      <span className="text-sm font-extrabold text-luxe-dark">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(cartTotal).replace('XAF', 'FCFA')}
                      </span>
                    </div>
                    <form onSubmit={handleCheckout} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        placeholder="Nom complet"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-warm-cream-dark bg-warm-cream focus:outline-none focus:border-luxe-gold"
                      />
                      <input
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        placeholder="Téléphone"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-warm-cream-dark bg-warm-cream focus:outline-none focus:border-luxe-gold"
                      />
                      <input
                        value={checkoutCity}
                        onChange={(e) => setCheckoutCity(e.target.value)}
                        placeholder="Ville"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-warm-cream-dark bg-warm-cream focus:outline-none focus:border-luxe-gold"
                      />
                      <input
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        placeholder="Adresse (quartier, rue...)"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-warm-cream-dark bg-warm-cream focus:outline-none focus:border-luxe-gold"
                      />
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value as any)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-warm-cream-dark bg-warm-cream focus:outline-none focus:border-luxe-gold md:col-span-2"
                      >
                        <option value="delivery">Livraison</option>
                        <option value="pickup">Retrait en boutique</option>
                      </select>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Note de livraison (facultatif)"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-warm-cream-dark bg-warm-cream focus:outline-none focus:border-luxe-gold md:col-span-2 min-h-[80px]"
                      />
                      <button
                        type="submit"
                        disabled={isCheckingOut}
                        className="md:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-luxe-dark hover:bg-luxe-copper text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {isCheckingOut ? 'Envoi...' : 'Valider la commande'}
                      </button>
                      {!activeCustomerUser && (
                        <button
                          type="button"
                          onClick={() => setIsAccountModalOpen(true)}
                          className="md:col-span-2 text-[10px] font-bold text-luxe-copper hover:underline"
                        >
                          Se connecter pour suivre mes commandes
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SECTION */}
      <footer className="bg-luxe-dark text-warm-cream py-10 border-t border-white/5 select-none z-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo brand info */}
          <div className="space-y-4 text-left flex flex-col items-start justify-start">
            <HerveLogo size="md" className="text-white hover:text-luxe-gold transition-colors -ml-4" />
            <p className="text-warm-cream-dark/60 leading-relaxed max-w-sm">
              L'excellence du matériel informatique haut de gamme de seconde main importé au Cameroun. Traçabilité, configuration sur-mesure et service après-vente d'exception.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialLinks.map(({ key, label, Icon, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-luxe-gold/40 hover:bg-white/10 flex items-center justify-center transition-all"
                    title={label}
                  >
                    <Icon className="w-4 h-4 text-warm-cream" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links representation */}
          <div className="space-y-3 text-left">
            <h5 className="font-serif text-xs uppercase tracking-wider text-luxe-gold font-bold">Nos Boutiques de Retrait</h5>
            <ul className="space-y-2 text-warm-cream-dark/60">
              <li>📍 <span className="font-bold">Douala</span> : {(clientData?.contactCMS?.address || 'Akwa, Face Boulangerie Zépol (Showroom principal)')}</li>
              <li>📍 <span className="font-bold">Yaoundé</span> : Avenue Germaine, Immeuble Horizon</li>
              <li>📞 <span className="font-bold">WhatsApp Secours</span> : {(clientData?.contactCMS?.whatsAppPhone || '+237 699 00 11 22')}</li>
            </ul>
          </div>

          {/* Framework indicators */}
          <div className="space-y-3 text-left">
            <h5 className="font-serif text-xs uppercase tracking-wider text-luxe-gold font-bold">Concept Application</h5>
            <p className="text-warm-cream-dark/60 leading-relaxed">
              Propulsé par React, Tailwind CSS v4 et Vite. Permet d'administrer des stocks d'ordinateurs et d'émettre des devis d'importation en direct. Les modifications d'états sont simulées en temps réel.
            </p>
            <p className="text-[10px] text-luxe-gold/70 font-mono italic">
              Conçu d'après la charte graphique de la capture Herve_eShop Cameroon.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 pt-6 border-t border-white/10 text-center text-warm-cream-dark/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Herve_eShop Cameroon. Tous droits réservés. L'excellence au service de vos ambitions.</p>
        </div>
      </footer>

      {/* Floating WhatsApp Quick-Contact Button */}
      <WhatsAppFloatingButton cms={clientData} />

      {/* Floating Back To Top Button list */}
      <BackToTopButton />
      </div>
    </AppErrorBoundary>
  );
}
