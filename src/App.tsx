import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Bell, ArrowRight, Shield, Users, CheckCircle, Smartphone, Info, RefreshCw, X 
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
    <div className="min-h-screen bg-warm-cream text-luxe-dark selection:bg-luxe-gold/30 flex flex-col justify-between antialiased">
      {/* Dynamic Header Component */}
      <Header
        onSearchChange={setSearchValue}
        searchValue={searchValue}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
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
          cms={clientData}
        />
        
        {/* CLIENT TESTIMONIALS & TRUST BUILDING SECTION */}
        <Testimonials />

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
        whatsAppPhone={clientData?.contactCMS?.whatsAppPhone}
      />

      {/* FOOTER SECTION */}
      <footer className="bg-luxe-dark text-warm-cream py-10 border-t border-white/5 select-none z-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo brand info */}
          <div className="space-y-4 text-left flex flex-col items-start justify-start">
            <HerveLogo size="md" className="text-white hover:text-luxe-gold transition-colors -ml-4" />
            <p className="text-warm-cream-dark/60 leading-relaxed max-w-sm">
              L'excellence du matériel informatique haut de gamme de seconde main importé au Cameroun. Traçabilité, configuration sur-mesure et service après-vente d'exception.
            </p>
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
  );
}
