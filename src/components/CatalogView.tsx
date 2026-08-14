import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Globe2, Tag, Layers, CheckCircle, ArrowUpDown, ChevronRight, Heart, Share2, ShoppingCart, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Laptop, SourceCountry, LaptopStatus } from '../types';

interface CatalogViewProps {
  laptops: Laptop[];
  onSelectLaptopForQuote: (laptop: Laptop) => void;
  onSelectLaptopForDetails: (laptop: Laptop) => void;
  onAddToCart: (laptop: Laptop) => void;
  searchValue: string;
  favouriteIds: string[];
  onToggleFavourite: (id: string) => void;
  onTriggerToast: (title: string, message: string, type?: string) => void;
  cms?: any;
}

export default function CatalogView({
  laptops,
  onSelectLaptopForQuote,
  onSelectLaptopForDetails,
  onAddToCart,
  searchValue,
  favouriteIds,
  onToggleFavourite,
  onTriggerToast,
  cms
}: CatalogViewProps) {
  const siteCMS = cms?.siteCMS || {};
  const heroTitle = siteCMS.heroTitle || 'Excellence';
  const heroSubtitle = siteCMS.heroSubtitle || "Découvrez le summum des ordinateurs portables de seconde main premium.";
  const homepageBanners = (Array.isArray(cms?.banners) ? cms.banners : []).filter(
    (b: any) => String(b?.type || '').trim() === 'Homepage Banner' && String(b?.status || '').trim() === 'Actif',
  );

  // Filters state
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [showOnlyFavourites, setShowOnlyFavourites] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [activeHomepageBannerIndex, setActiveHomepageBannerIndex] = useState(0);

  // Auto-scroll to shared laptop card on mount if ?laptop=ID exists in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const laptopId = params.get('laptop');
    if (laptopId) {
      setTimeout(() => {
        const element = document.getElementById(`laptop-card-${laptopId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add temporary emphasis highlight matching clean minimalism
          element.classList.add('ring-2', 'ring-luxe-gold', 'scale-[1.01]', 'shadow-2xl');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-luxe-gold', 'scale-[1.01]', 'shadow-2xl');
          }, 3500);
        }
      }, 600);
    }
  }, []);

  useEffect(() => {
    if (!homepageBanners.length) return;
    if (homepageBanners.length === 1) {
      setActiveHomepageBannerIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setActiveHomepageBannerIndex((prev) => (prev + 1) % homepageBanners.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [homepageBanners.length]);

  const handleShare = (laptop: Laptop) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?laptop=${laptop.id}#laptop-card-${laptop.id}`;
    
    const copyText = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful ? Promise.resolve() : Promise.reject(new Error("document.execCommand failed"));
        } catch (err) {
          document.body.removeChild(textArea);
          return Promise.reject(err);
        }
      }
    };

    copyText()
      .then(() => {
        onTriggerToast(
          'Lien Copié! 🔗',
          `Le lien direct vers le ${laptop.brand} ${laptop.model} a été sauvegardé dans le presse-papiers. Prêt à partager !`
        );
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        onTriggerToast(
          'Lien de l\'article 🔗',
          `Copiez ce lien : ${shareUrl}`
        );
      });
  };

  // Extract unique brands for filtering
  const brands = ['All', ...Array.from(new Set(laptops.map(l => l.brand)))];
  const productCategories = ['All', ...Array.from(new Set(laptops.map(l => l.category).filter(Boolean)))];
  const categoryIcons: Record<string, string> = {
    All: '🛍️',
    Laptop: '💻',
    Telephone: '📱',
    Accessoire: '🎧',
    Gadget: '⌚',
  };

  // Apply filters
  const filteredLaptops = laptops.filter(laptop => {
    const matchesSearch = 
      laptop.brand.toLowerCase().includes(searchValue.toLowerCase()) ||
      laptop.model.toLowerCase().includes(searchValue.toLowerCase()) ||
      laptop.processor.toLowerCase().includes(searchValue.toLowerCase()) ||
      laptop.description.toLowerCase().includes(searchValue.toLowerCase());
      
    const matchesBrand = selectedBrand === 'All' || laptop.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'All' || laptop.category === selectedCategory;
    const matchesSource = selectedSource === 'All' || laptop.source === selectedSource;
    const matchesStatus = selectedStatus === 'All' || laptop.status === selectedStatus;
    const matchesFavourites = !showOnlyFavourites || favouriteIds.includes(laptop.id);
    const matchesPrice = laptop.price >= minPrice && laptop.price <= maxPrice;

    return matchesSearch && matchesBrand && matchesCategory && matchesSource && matchesStatus && matchesFavourites && matchesPrice;
  });

  // Sort laptops
  const sortedLaptops = [...filteredLaptops].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'stock-desc') return b.stockQuantity - a.stockQuantity;
    return 0; // default order
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 relative overflow-hidden" id="catalog-view-container">
      {/* Decorative Elegant Watermark "Herve_eShop" in the background */}
      <div className="absolute -left-10 top-1/3 opacity-[0.02] text-[18vw] font-serif font-black select-none pointer-events-none tracking-widest leading-none z-0">
        Herve_eShop
      </div>

      {/* HERO BANNER - Exact replication of uploaded capture theme */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-8 md:py-16 border-b border-warm-cream-dark/60 z-10">
        {/* Left Column Text details */}
        <div className="lg:col-span-5 flex flex-col justify-center text-left">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-luxe-copper animate-ping"></span>
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-luxe-copper">
              Gold Standard Arrival
            </span>
          </div>

          <h2 className="text-4xl md:text-5.5.xl font-serif text-luxe-dark leading-[1.05] tracking-tight">
            {heroTitle.split('\n')[0]} <br />
            <span className="text-luxe-copper font-serif font-medium italic">
              {(heroTitle.split('\n')[1] || '').trim() || 'Redefined.'}
            </span>
          </h2>

          <p className="mt-5 md:mt-7 text-xs sm:text-sm text-luxe-muted leading-relaxed max-w-md font-medium">
            {heroSubtitle}
          </p>

          <div className="mt-8 md:mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                const first = sortedLaptops[0];
                if (!first) {
                  onTriggerToast('Aucun article', 'Aucun article n’est disponible pour le moment.', 'danger');
                  return;
                }
                const anchor = document.getElementById('catalog-grid-anchor');
                anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.setTimeout(() => {
                  const el = document.getElementById(`laptop-card-${first.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  onSelectLaptopForDetails(first);
                }, 550);
              }}
              className="inline-flex items-center justify-center bg-luxe-dark text-warm-cream text-11px md:text-xs tracking-widest uppercase font-semibold px-6 py-4 rounded-full shadow-lg hover:bg-luxe-copper transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              id="discover-collection-btn"
            >
              Découvrir la Collection
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>

        {/* Right Column Laptop Mock frame matching screen capture details */}
        <div className="lg:col-span-7 relative flex justify-center">
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-warm-cream to-warm-cream-dark p-4 md:p-8 flex items-center justify-center shadow-lg border border-warm-cream-dark/60 overflow-hidden">
            {/* Ambient inner soft lighting shadow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)]"></div>

            {homepageBanners.length ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/50 shadow-inner">
                <AnimatePresence mode="wait">
                  <motion.a
                    key={String(homepageBanners[activeHomepageBannerIndex]?.id || activeHomepageBannerIndex)}
                    href={String(homepageBanners[activeHomepageBannerIndex]?.link || '#catalog-grid-anchor')}
                    className="absolute inset-0 block"
                    initial={{ opacity: 0, scale: 1.01 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.45 }}
                  >
                    <img
                      src={String(homepageBanners[activeHomepageBannerIndex]?.image || '')}
                      alt={String(homepageBanners[activeHomepageBannerIndex]?.title || 'Bannière')}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-left">
                      <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/80">
                        Publicité
                      </div>
                      <div className="mt-2 font-serif font-extrabold text-xl md:text-2xl text-white leading-tight">
                        {String(homepageBanners[activeHomepageBannerIndex]?.title || '').trim()}
                      </div>
                      {homepageBanners[activeHomepageBannerIndex]?.subtitle && (
                        <div className="mt-1.5 text-xs text-white/85 leading-relaxed max-w-lg">
                          {String(homepageBanners[activeHomepageBannerIndex]?.subtitle || '').trim()}
                        </div>
                      )}
                      <div className="mt-3 inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full text-[10px] uppercase tracking-widest font-extrabold text-luxe-dark border border-white/50">
                        Voir l’offre <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.a>
                </AnimatePresence>

                {homepageBanners.length > 1 && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5">
                    {homepageBanners.slice(0, 7).map((b: any, idx: number) => {
                      const active = idx === activeHomepageBannerIndex;
                      return (
                        <button
                          key={String(b?.id || idx)}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveHomepageBannerIndex(idx);
                          }}
                          className={`w-2 h-2 rounded-full border ${active ? 'bg-white border-white' : 'bg-white/30 border-white/60'}`}
                          title={String(b?.title || 'Bannière')}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200"
                alt="Premium Apple MacBook Cover"
                className="w-4/5 h-auto object-contain rounded-lg drop-shadow-[0_25px_40px_rgba(0,0,0,0.18)] transform -rotate-2 hover:rotate-0 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Float badge 100% verified import on laptops */}
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/90 backdrop-blur-md px-4 py-3 rounded-lg border border-warm-cream-dark/50 flex gap-4 shadow-lg animate-bounce duration-1000">
              <div className="text-center">
                <p className="text-sm md:text-base font-bold text-luxe-copper font-serif">100%</p>
                <p className="text-[8px] md:text-[9px] font-semibold text-luxe-muted uppercase tracking-wider">Certifié</p>
              </div>
              <div className="w-px bg-warm-cream-dark"></div>
              <div className="text-center">
                <p className="text-sm md:text-base font-bold text-luxe-copper font-serif">USA</p>
                <p className="text-[8px] md:text-[9px] font-semibold text-luxe-muted uppercase tracking-wider">Importé</p>
              </div>
            </div>
            
            {/* Floating indicator */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
              <span className="w-9 h-9 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border border-white/50 text-luxe-dark hover:text-luxe-copper cursor-pointer transition-colors">
                <Globe2 className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER PANEL SECTION */}
      <span id="catalog-grid-anchor" className="block scroll-mt-24"></span>
      <section className="mt-12 md:mt-16 bg-white/80 border border-warm-cream-dark/80 rounded-2xl p-5 md:p-7 shadow-xs">
        <div className="flex flex-col gap-6">
          {/* Header elements filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-warm-cream-dark/50 pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-luxe-dark flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-luxe-copper" /> Filtrer le catalogue en temps réel
              </h3>
              <p className="text-xs text-luxe-muted mt-0.5">Retrouvez l article tech qui correspond exactement a vos besoins.</p>
            </div>
            <div className="text-[11px] font-semibold text-luxe-muted bg-warm-cream px-3 py-1.5 rounded-full border border-warm-cream-dark">
              {sortedLaptops.length} article{sortedLaptops.length > 1 ? 's' : ''} trouve{sortedLaptops.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Interactive Button Filters */}
          <div className="flex flex-col gap-5 border-b border-warm-cream-dark/40 pb-5">
            {/* 1. Category & Favorites Filter Buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-luxe-muted">Familles de produits et favoris</span>
              <div className="flex flex-wrap gap-2">
                {productCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const icon = categoryIcons[cat] || '📦';
                  const label = cat === 'All' ? 'Tous les produits' : cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowOnlyFavourites(false); // Standard catalog view is restored when clicking category buttons
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border cursor-pointer select-none ${
                        isSelected && !showOnlyFavourites
                          ? 'bg-luxe-dark text-warm-cream border-luxe-dark shadow-sm scale-[1.02]'
                          : 'bg-warm-cream text-luxe-dark border-warm-cream-dark/70 hover:border-luxe-gold hover:bg-white'
                      }`}
                      id={`filter-category-btn-${cat}`}
                    >
                      <span className="text-sm">{icon}</span>
                      {label}
                    </button>
                  );
                })}

                <div className="w-px h-8 bg-warm-cream-dark/70 mx-1.5 hidden sm:block"></div>

                <button
                  type="button"
                  onClick={() => {
                    setShowOnlyFavourites(!showOnlyFavourites);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border cursor-pointer select-none ${
                    showOnlyFavourites
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm scale-[1.02]'
                      : 'bg-rose-50/50 text-rose-600 border-rose-200/60 hover:border-rose-400 hover:bg-rose-50/80'
                  }`}
                  id="filter-only-favourites-btn"
                >
                  <span className="text-sm">❤️</span>
                  Mes Favoris ({favouriteIds.length})
                </button>
              </div>
            </div>

            {/* 2. Brand Filter Buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-luxe-muted font-sans font-semibold">Filtrer par Marque</span>
              <div className="flex flex-wrap gap-1.5">
                {brands.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-luxe-gold text-luxe-dark border-luxe-gold shadow-sm scale-[1.02]'
                          : 'bg-warm-cream text-luxe-dark border-warm-cream-dark/60 hover:border-luxe-gold hover:bg-white'
                      }`}
                      id={`filter-brand-btn-${brand}`}
                    >
                      {brand === 'All' ? 'Toutes les marques' : brand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Budget & Price range slider */}
            <div className="flex flex-col gap-3 pt-2 border-t border-warm-cream-dark/40">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-luxe-muted font-sans font-semibold">
                  Budget & Fourchette de prix (FCFA)
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-luxe-copper font-mono bg-warm-cream px-3 py-1 rounded-full border border-warm-cream-dark shadow-xs">
                  <span>{formatPrice(minPrice)}</span>
                  <span className="text-luxe-muted mx-1">à</span>
                  <span>{formatPrice(maxPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-warm-cream/40 p-4 rounded-xl border border-warm-cream-dark/50">
                {/* Min Price Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-luxe-muted">
                    <span>Prix Minimum</span>
                    <span className="font-mono text-luxe-dark font-bold">{formatPrice(minPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-luxe-muted font-mono font-bold">0</span>
                    <input
                      type="range"
                      min="0"
                      max="5000000"
                      step="25000"
                      value={minPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= maxPrice) {
                          setMinPrice(val);
                        }
                      }}
                      className="flex-1 h-2 bg-warm-cream-dark rounded-full appearance-none cursor-pointer accent-luxe-copper focus:outline-none focus:ring-1 focus:ring-luxe-gold"
                      id="price-range-min-slider"
                    />
                    <span className="text-[10px] text-luxe-muted font-mono font-bold">5M</span>
                  </div>
                </div>

                {/* Max Price Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-luxe-muted">
                    <span>Prix Maximum</span>
                    <span className="font-mono text-luxe-dark font-bold">{formatPrice(maxPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-luxe-muted font-mono font-bold">0</span>
                    <input
                      type="range"
                      min="0"
                      max="5000000"
                      step="25000"
                      value={maxPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= minPrice) {
                          setMaxPrice(val);
                        }
                      }}
                      className="flex-1 h-2 bg-warm-cream-dark rounded-full appearance-none cursor-pointer accent-luxe-copper focus:outline-none focus:ring-1 focus:ring-luxe-gold"
                      id="price-range-max-slider"
                    />
                    <span className="text-[10px] text-luxe-muted font-mono font-bold">5M</span>
                  </div>
                </div>
              </div>

              {/* Express popular budgets */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-luxe-muted mr-1">Raccourcis Budget :</span>
                {[
                  { label: "Tous budgets", min: 0, max: 5000000 },
                  { label: "Moins de 600K 💸", min: 0, max: 600000 },
                  { label: "600K - 1M 💻", min: 600000, max: 1000000 },
                  { label: "Plus de 1M 🔥", min: 1000000, max: 5000000 }
                ].map((b, i) => {
                  const isCurrent = minPrice === b.min && maxPrice === b.max;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setMinPrice(b.min);
                        setMaxPrice(b.max);
                      }}
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full border transition-all cursor-pointer select-none ${
                        isCurrent
                          ? 'bg-luxe-copper text-white border-luxe-copper shadow-xs'
                          : 'bg-white text-luxe-muted border-warm-cream-dark/60 hover:border-luxe-copper hover:text-luxe-copper'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secondary Filters Inputs Grid (Provenance, Availability, Sort) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filter by Import Source */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-luxe-muted">Provenance d'Import</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full text-xs bg-warm-cream border border-warm-cream-dark rounded-lg py-2 px-3 text-luxe-dark focus:outline-none focus:border-luxe-gold font-medium"
                id="filter-source-select"
              >
                <option value="All">Toutes provenances</option>
                <option value="USA">Importé des USA 🇺🇸</option>
                <option value="Europe">Importé d'Europe 🇪🇺</option>
                <option value="Asia">Importé d'Asie 🇦🇸</option>
              </select>
            </div>

            {/* Filter by Live Stock Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-luxe-muted">Disponibilité</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs bg-warm-cream border border-warm-cream-dark rounded-lg py-2 px-3 text-luxe-dark focus:outline-none focus:border-luxe-gold font-medium"
                id="filter-status-select"
              >
                <option value="All">Tous les statuts</option>
                <option value="Disponible">Disponible de suite</option>
                <option value="Arrivage imminent">Arrivage imminent</option>
                <option value="Rupture">Rupture de stock</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-luxe-muted">Trier par</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-xs bg-warm-cream border border-warm-cream-dark rounded-lg py-2 px-3 text-luxe-dark focus:outline-none focus:border-luxe-gold font-medium appearance-none"
                  id="sort-select"
                >
                  <option value="default">Ordre alphabétique</option>
                  <option value="price-asc">Prix : Croissant</option>
                  <option value="price-desc">Prix : Décroissant</option>
                  <option value="stock-desc">Stock dispo : Décroissant</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-luxe-muted absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG GRID */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 min-h-[300px]" id="catalog-section-grid">
        <AnimatePresence mode="popLayout">
          {sortedLaptops.length === 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="col-span-full bg-white/40 border border-dashed border-warm-cream-dark p-12 text-center rounded-2xl flex flex-col items-center justify-center"
              key="no-matching-laptops"
            >
              <Globe2 className="w-10 h-10 text-luxe-muted mb-2 animate-pulse" />
              <h4 className="font-serif text-base font-semibold text-luxe-dark">Aucun matériel ne correspond</h4>
              <p className="text-xs text-luxe-muted mt-1 max-w-sm">
                Réduisez vos filtres ou modifiez votre recherche pour découvrir d'autres modèles d'exception.
              </p>
              <button
                onClick={() => {
                  setSelectedBrand('All');
                  setSelectedCategory('All');
                  setSelectedSource('All');
                  setSelectedStatus('All');
                  setSortBy('default');
                  setShowOnlyFavourites(false);
                  setMinPrice(0);
                  setMaxPrice(5000000);
                }}
                className="mt-4 text-xs font-semibold text-luxe-copper hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </motion.div>
          ) : (
            sortedLaptops.map((laptop) => {
              const isOutOfStock = laptop.stockQuantity === 0 || laptop.status === 'Rupture';
              const isIncoming = laptop.status === 'Arrivage imminent';

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  key={laptop.id}
                  id={`laptop-card-${laptop.id}`}
                  className="group flex flex-col bg-white rounded-2xl border border-warm-cream-dark/60 overflow-hidden shadow-xs hover:shadow-xl hover:border-luxe-gold/50 transition-all duration-300"
                >
                  {/* Image Section */}
                  <div 
                    onClick={() => onSelectLaptopForDetails(laptop)}
                    className="relative aspect-[16/10] bg-warm-cream/50 overflow-hidden border-b border-warm-cream-dark/40 cursor-pointer group/img"
                    title="Cliquez pour voir les photos additionnelles, la vidéo démo et les avis clients"
                  >
                    <img
                      src={laptop.image}
                      alt={`${laptop.brand} ${laptop.model}`}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />

                    {/* Absolute elegant action buttons for favorites & sharing */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavourite(laptop.id);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border shadow-xs select-none cursor-pointer ${
                          favouriteIds.includes(laptop.id)
                            ? 'bg-rose-500 border-rose-500 text-white hover:scale-115 active:scale-90 shadow-md shadow-rose-300/60'
                            : 'bg-white/95 backdrop-blur-md text-luxe-muted hover:text-rose-500 hover:scale-115 active:scale-90 border-warm-cream-dark/50'
                        }`}
                        title={favouriteIds.includes(laptop.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        id={`toggle-fav-${laptop.id}`}
                      >
                        <Heart className={`w-4 h-4 ${favouriteIds.includes(laptop.id) ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(laptop);
                        }}
                        className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md text-luxe-muted hover:text-luxe-copper hover:scale-115 hover:border-luxe-copper active:scale-90 border border-warm-cream-dark/50 flex items-center justify-center transition-all shadow-xs select-none cursor-pointer"
                        title="Partager cet article"
                        id={`share-btn-${laptop.id}`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Glass Header Badges on Hover */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                      {/* Source flag tag */}
                      <span className="bg-white/95 text-[10px] font-semibold tracking-wider text-luxe-dark px-2.5 py-1 rounded-full border border-warm-cream-dark/40 shadow-xs flex items-center gap-1">
                        <Globe2 className="w-3 h-3 text-luxe-copper" /> 
                        Import {laptop.source === 'USA' ? 'USA 🇺🇸' : laptop.source === 'Europe' ? 'Europe 🇪🇺' : 'Asie 🇦🇸'}
                      </span>
                      {/* Condition badge */}
                      <span className="bg-luxe-dark/85 text-warm-cream text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                        {laptop.condition}
                      </span>
                    </div>

                    {/* Absolute price block overlay */}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 font-semibold text-xs py-1.5 rounded-lg border border-warm-cream-dark/45 shadow-sm font-mono text-luxe-dark flex items-center gap-0.5">
                      ID: {laptop.id.toUpperCase()}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div 
                      onClick={() => onSelectLaptopForDetails(laptop)}
                      className="cursor-pointer text-left"
                      title="Cliquer pour voir les détails de cette machine"
                    >
                      {/* Brand & Name */}
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-[17px] font-bold text-luxe-dark group-hover:text-luxe-copper transition-colors">
                          {laptop.brand} {laptop.model}
                        </h4>
                      </div>

                      {/* Polished golden-yellow star ratings for the premium yellow request */}
                      <div className="mt-1 flex items-center gap-1 select-none">
                        <div className="flex items-center text-luxe-yellow">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span className="text-[10px] text-luxe-muted font-medium ml-1">
                          4.9 (Certifié d'Origine)
                        </span>
                      </div>

                      {/* Stock status indicator details */}
                      <div className="mt-2 flex items-center gap-3">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Rupture de stock
                          </span>
                        ) : isIncoming ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Arrivage imminent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            En Stock ({laptop.stockQuantity} dispos)
                          </span>
                        )}

                        {!isOutOfStock && (
                          <p className="text-[10px] text-luxe-muted font-medium font-mono">
                            Mise à jour en direct
                          </p>
                        )}
                      </div>

                      {/* Technical Specifications highlights */}
                      <div className="mt-4 bg-warm-cream/70 border border-warm-cream-dark/40 rounded-xl p-3 flex flex-col gap-1.5 font-sans">
                        <div className="flex justify-between text-[11px] border-b border-warm-cream-dark/30 pb-1.5">
                          <span className="text-luxe-muted">Processeur</span>
                          <span className="text-luxe-dark font-semibold text-right max-w-[180px] break-words">{laptop.processor}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-warm-cream-dark/30 pb-1.5">
                          <span className="text-luxe-muted">Mémoire RAM</span>
                          <span className="text-luxe-dark font-semibold font-mono">{laptop.ram}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-warm-cream-dark/30 pb-1.5">
                          <span className="text-luxe-muted">Disque SSD</span>
                          <span className="text-luxe-dark font-semibold font-mono">{laptop.storage}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-luxe-muted">Écran d'affichage</span>
                          <span className="text-luxe-dark font-semibold">{laptop.screenSize}</span>
                        </div>
                      </div>

                      {/* Exquisite custom description */}
                      <p className="mt-3 text-[11px] text-luxe-muted leading-relaxed italic">
                        « {laptop.description} »
                      </p>
                    </div>

                    {/* Call To Action Row */}
                    <div className="mt-5 pt-4 border-t border-warm-cream-dark/50 flex flex-col gap-3">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-luxe-muted font-sans font-semibold">Tarif indicatif</span>
                          <span className="text-base font-bold font-serif text-luxe-dark tracking-tight">
                            {formatPrice(laptop.price)}
                          </span>
                        </div>

                        {/* Explicit micro-button tag for media details trigger */}
                        <button
                          type="button"
                          onClick={() => onSelectLaptopForDetails(laptop)}
                          className="inline-flex items-center text-[10px] font-sans font-extrabold text-luxe-orange hover:text-luxe-dark transition-colors cursor-pointer select-none"
                          id={`details-link-${laptop.id}`}
                        >
                          Photos & Vidéos 📸
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectLaptopForDetails(laptop)}
                          className="flex-1 inline-flex items-center justify-center text-[10px] tracking-wider uppercase font-bold py-2.5 rounded-full bg-white text-luxe-dark border border-warm-cream-dark/80 hover:bg-warm-cream transition-all shadow-xs cursor-pointer select-none"
                          title="Voir plus de photos, vidéos de test et avis des clients sur cet article"
                        >
                          Médias & Avis
                        </button>

                        <button
                          type="button"
                          onClick={() => onAddToCart(laptop)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] tracking-wider uppercase font-bold py-2.5 rounded-full transition-all border ${
                            isOutOfStock
                              ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed font-medium'
                              : 'bg-white text-luxe-dark border-warm-cream-dark/80 hover:bg-warm-cream hover:border-luxe-gold/60 shadow-xs'
                          }`}
                          disabled={isOutOfStock}
                          title="Ajouter au panier"
                          id={`add-to-cart-btn-${laptop.id}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Panier
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectLaptopForQuote(laptop)}
                          className={`flex-1 inline-flex items-center justify-center text-[10px] tracking-wider uppercase font-bold py-2.5 rounded-full transition-all border ${
                            isOutOfStock
                              ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed font-medium'
                              : 'bg-luxe-dark text-warm-cream border-luxe-dark hover:bg-luxe-copper hover:border-luxe-copper shadow-sm hover:shadow-md'
                          }`}
                          disabled={isOutOfStock}
                          id={`quote-btn-${laptop.id}`}
                        >
                          {isIncoming ? 'Réserver' : 'Devis'}
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </section>

      {/* WHY CHOOSE HERVE_ESHOP ADVANTAGE */}
      <section className="mt-16 md:mt-24 bg-luxe-dark text-warm-cream rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-[0.03] text-[20vw] font-serif select-none pointer-events-none tracking-tight">
          Luxe
        </div>
        <div className="max-w-2xl text-left z-10 relative">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-luxe-gold">La Charte Confiance d'Hervé</span>
          <h3 className="text-xl md:text-3xl font-serif mt-2 mb-6">
            Pourquoi choisir notre catalogue pour équiper vos études & projets ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-luxe-gold" />
              </div>
              <h5 className="text-sm font-semibold text-white">Authenticité Garantie</h5>
              <p className="text-[11px] text-warm-cream-dark/70 mt-1 leading-relaxed">
                Toutes nos machines subissent 40 points de tests rigoureux avant d'entrer au Cameroun.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-luxe-gold" />
              </div>
              <h5 className="text-sm font-semibold text-white">Traçabilité Claire</h5>
              <p className="text-[11px] text-warm-cream-dark/70 mt-1 leading-relaxed">
                Provenance transparente (USA, Europe ou Asie) - aucun reconditionnement de basse qualité.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-luxe-gold" />
              </div>
              <h5 className="text-sm font-semibold text-white">Accompagnement Devis</h5>
              <p className="text-[11px] text-warm-cream-dark/70 mt-1 leading-relaxed">
                Configurations à la carte sur demande (mémoire augmentée, pack housse cuir premium).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
