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
import { INITIAL_LAPTOPS } from './data';
import { Laptop, QuoteRequest, RealtimeNotification, QuoteStatus, LaptopStatus } from './types';

export default function App() {
  // --- Core Persistent State Hookup ---
  const [laptops, setLaptops] = useState<Laptop[]>(() => {
    const saved = localStorage.getItem('herve_eshop_laptops');
    return saved ? JSON.parse(saved) : INITIAL_LAPTOPS;
  });

  const [quotes, setQuotes] = useState<QuoteRequest[]>(() => {
    const saved = localStorage.getItem('herve_eshop_quotes');
    if (saved) return JSON.parse(saved);
    
    // Pre-populate with one realistic example quote for instant tracking testing
    const sampleQuote: QuoteRequest = {
      id: 'DEV-5A90',
      laptopId: 'macm3-01',
      laptopBrand: 'Apple',
      laptopModel: 'MacBook Pro 14"',
      basePrice: 1350000,
      finalPrice: 1410000, // upgraded with 32GB RAM
      clientName: 'Jean-Pierre Ngué',
      clientEmail: 'jean.pierre@gmail.com',
      clientPhone: '+237 677 88 99 00',
      clientCity: 'Yaoundé',
      customizations: {
        ramUpgrade: '32GB',
        storageUpgrade: 'Aucun',
        osOption: 'Windows d\'origine / macOS natif',
        accessories: []
      },
      additionalNotes: 'Besoin d\'un clavier AZERTY si possible. Merci Hervé !',
      status: 'En préparation',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()  // 1 hour ago
    };
    return [sampleQuote];
  });

  const [notifications, setNotifications] = useState<RealtimeNotification[]>(() => {
    const saved = localStorage.getItem('herve_eshop_notifications');
    if (saved) return JSON.parse(saved);
    
    // Prepopulate 1 sample notification
    const sampleNotification: RealtimeNotification = {
      id: 'notif-01',
      quoteId: 'DEV-5A90',
      clientEmail: 'jean.pierre@gmail.com',
      title: 'Devis #DEV-5A90 mis à jour',
      message: 'Herve_eShop: Le statut de votre configuration MacBook Pro M3 a été mis à jour : "En préparation d\'atelier".',
      status: 'En préparation',
      timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      isRead: false
    };
    return [sampleNotification];
  });

  // UI Active State Tab selectors
  const [role, setRole] = useState<'client' | 'admin'>('client');
  const [activeTab, setActiveTab] = useState<string>('catalogue');
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedLaptopForQuote, setSelectedLaptopForQuote] = useState<Laptop | null>(null);
  const [selectedLaptopForDetails, setSelectedLaptopForDetails] = useState<Laptop | null>(null);

  // Active floating live alert simulation state
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);

  // Favorites state tracking
  const [favouriteIds, setFavouriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('herve_eshop_favourites');
    return saved ? JSON.parse(saved) : [];
  });

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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('herve_eshop_laptops', JSON.stringify(laptops));
  }, [laptops]);

  useEffect(() => {
    localStorage.setItem('herve_eshop_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('herve_eshop_notifications', JSON.stringify(notifications));
  }, [notifications]);

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
  const handleSubmitQuote = (newQuote: QuoteRequest) => {
    // Add quote
    setQuotes((prev) => [...prev, newQuote]);
    
    // Subtract stock quantity by 1 for immediate feedback (if stock > 0)
    setLaptops((prev) => 
      prev.map((l) => {
        if (l.id === newQuote.laptopId) {
          const freshQuantity = Math.max(0, l.stockQuantity - 1);
          return {
            ...l,
            stockQuantity: freshQuantity,
            status: freshQuantity === 0 ? 'Rupture' : l.status
          };
        }
        return l;
      })
    );

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

    // Toast alert triggers a clean minimalist confirmation
  };

  // --- Handlers for Administrator Stock Control ---

  const handleAddLaptop = (newLaptop: Laptop) => {
    setLaptops((prev) => [...prev, newLaptop]);
    triggerToastAlert(
      'Stock Ajouté ! 💻',
      `Le modèle ${newLaptop.brand} ${newLaptop.model} est maintenant visible sur le catalogue.`
    );
  };

  const handleUpdateLaptopStock = (id: string, newStock: number) => {
    setLaptops((prev) => 
      prev.map((l) => {
        if (l.id === id) {
          let updatedStatus: LaptopStatus = l.status;
          if (newStock === 0) {
            updatedStatus = 'Rupture';
          } else if (l.status === 'Rupture') {
            updatedStatus = 'Disponible';
          }
          return {
            ...l,
            stockQuantity: newStock,
            status: updatedStatus
          };
        }
        return l;
      })
    );
  };

  const handleUpdateLaptopPrice = (id: string, newPrice: number) => {
    setLaptops((prev) => 
      prev.map((l) => (l.id === id ? { ...l, price: newPrice } : l))
    );
  };

  const handleUpdateLaptopStatus = (id: string, newStatus: LaptopStatus) => {
    setLaptops((prev) => 
      prev.map((l) => {
        if (l.id === id) {
          // If status is "Disponible" but stock is 0, reset stock to 1 to be logical
          const updatedStock = (newStatus === 'Disponible' && l.stockQuantity === 0) ? 1 : l.stockQuantity;
          return { ...l, status: newStatus, stockQuantity: updatedStock };
        }
        return l;
      })
    );
  };

  const handleDeleteLaptop = (id: string) => {
    setLaptops((prev) => prev.filter((l) => l.id !== id));
    triggerToastAlert(
      'Matériel Supprimé',
      'L\'ordinateur a été complètement retiré du catalogue publique.'
    );
  };

  // Core Real-time status update mechanism
  const handleUpdateQuoteStatus = (quoteId: string, newStatus: QuoteStatus) => {
    setQuotes((prev) => 
      prev.map((q) => {
        if (q.id === quoteId) {
          return {
            ...q,
            status: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return q;
      })
    );

    // Find quote object details for custom message text
    const targetQuote = quotes.find(q => q.id === quoteId);
    if (!targetQuote) return;

    // Build notification for user tracking
    const newNotif: RealtimeNotification = {
      id: `notif-${Date.now()}`,
      quoteId: quoteId,
      clientEmail: targetQuote.clientEmail,
      title: 'Mise à jour de votre Devis ! 🔔',
      message: `Votre commande #${quoteId} (${targetQuote.laptopBrand}) est passée au statut : "${newStatus}".`,
      status: newStatus,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Active instant feedback pop-up to mimic real-time WebSockets
    triggerToastAlert(
      'Statut Devis Modifié en Direct ! 📲',
      `Client: ${targetQuote.clientName} | Nouveau statut: "${newStatus}". Une notification live a été instantanément émise.`,
      'success'
    );
  };

  // Notification center operations
  const handleClearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  return (
    <div className="min-h-screen bg-warm-cream text-luxe-dark selection:bg-luxe-gold/30 flex flex-col justify-between antialiased">
      {/* Dynamic Header Component */}
      <Header
        onSearchChange={setSearchValue}
        searchValue={searchValue}
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
        />
        
        {/* CLIENT TESTIMONIALS & TRUST BUILDING SECTION */}
        <Testimonials />

        {/* HERVE BUYING GUIDES RECOMMENDATIONS */}
        <BuyingGuides />
      </main>

      {/* CUSTOM QUOTE REQUEST MODAL OVERLAY */}
      {selectedLaptopForQuote && (
        <QuoteRequestModal
          laptop={selectedLaptopForQuote}
          onClose={handleCloseQuoteModal}
          onSubmitQuote={handleSubmitQuote}
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
              <li>📍 <span className="font-bold">Douala</span> : Akwa, Face Boulangerie Zépol (Showroom principal)</li>
              <li>📍 <span className="font-bold">Yaoundé</span> : Avenue Germaine, Immeuble Horizon</li>
              <li>📞 <span className="font-bold">WhatsApp Secours</span> : +237 699 00 11 22</li>
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
      <WhatsAppFloatingButton />

      {/* Floating Back To Top Button list */}
      <BackToTopButton />
    </div>
  );
}
