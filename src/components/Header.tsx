import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, ShoppingCart, User } from 'lucide-react';
import HerveLogo from './HerveLogo';

interface HeaderProps {
  onSearchChange: (search: string) => void;
  searchValue: string;
  onOpenAccountModal: () => void;
  onOpenNotificationCenter: () => void;
  onOpenCart: () => void;
  cartCount: number;
  unreadNotificationCount: number;
  activeUser: any;
  cms?: any;
}

export default function Header({
  onSearchChange,
  searchValue,
  onOpenAccountModal,
  onOpenNotificationCenter,
  onOpenCart,
  cartCount,
  unreadNotificationCount,
  activeUser,
  cms
}: HeaderProps) {
  const siteCMS = cms?.siteCMS || {};
  const contactCMS = cms?.contactCMS || {};
  const announcementText =
    siteCMS.announcementText ||
    "Nouveaux arrivages d'ordinateurs MacBook, Dell & ThinkPad importés directement d'Amérique !";
  const headerStatus = contactCMS.openingHours || "Akwa Showroom • Ouvert";
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      const reachedTop = currentScrollY <= 16;

      setIsAtTop(reachedTop);

      if (reachedTop) {
        setIsHeaderVisible(true);
        lastScrollYRef.current = 0;
        return;
      }

      if (Math.abs(delta) < 8) return;

      if (delta > 0 && currentScrollY > 120) {
        setIsHeaderVisible(false);
      } else if (delta < 0) {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const accountLabel =
    activeUser && typeof activeUser.name === 'string' && activeUser.name.trim()
      ? activeUser.name.trim().split(' ')[0]
      : 'Mon Compte';

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={onOpenNotificationCenter}
        className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white border border-warm-cream-dark hover:border-luxe-gold/60 hover:bg-warm-cream transition-all shadow-xs cursor-pointer select-none"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-luxe-dark" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-luxe-orange text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-white">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white border border-warm-cream-dark hover:border-luxe-gold/60 hover:bg-warm-cream transition-all shadow-xs cursor-pointer select-none"
        id="open-cart-btn"
        title="Panier"
      >
        <ShoppingCart className="w-4 h-4 text-luxe-dark" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-luxe-copper text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-white">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenAccountModal}
        className="type-button inline-flex items-center justify-center gap-1.5 min-h-10 sm:min-h-11 px-3 sm:px-4 rounded-full bg-luxe-dark hover:bg-luxe-copper text-white transition-all shadow-xs cursor-pointer select-none border border-luxe-gold/20"
        id="open-customer-account-modal-header-btn"
      >
        <User className="w-3.5 h-3.5 text-luxe-gold" />
        <span className="hidden lg:inline">{accountLabel}</span>
      </button>
    </>
  );

  return (
    <header
      className={`sticky top-0 z-40 border-b border-warm-cream-dark/80 bg-warm-cream/95 backdrop-blur-sm transition-transform duration-300 ease-out will-change-transform ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1px)]'
      } ${isAtTop ? 'shadow-none' : 'shadow-xs'}`}
    >
      <div className="w-full bg-gradient-to-r from-luxe-orange to-luxe-gold text-white py-1.5 px-4 shadow-sm select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 min-w-0">
            <span className="inline-flex items-center justify-center bg-white/20 backdrop-blur-xs text-white px-2.5 py-1 rounded-full type-badge">
              Nouveaux arrivages
            </span>
            <span className="type-meta text-white/95 max-w-3xl line-clamp-2 sm:line-clamp-1">
              {announcementText}
            </span>
          </div>
          <div className="flex items-center gap-4 type-kicker text-white/90">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              {headerStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3 md:gap-6 md:flex-1">
          <div className="hidden md:flex items-center gap-2 type-kicker text-luxe-orange">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxe-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-luxe-orange"></span>
            </span>
            Live Cameroon
          </div>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSearchChange('');
            }}
            className="flex flex-col items-center select-none group transition-all duration-300 hover:scale-[1.03] md:mr-auto"
            title="Herve_eShop Cameroon"
          >
            <HerveLogo size="sm" className="transition-all group-hover:text-luxe-orange" />
          </a>

          <div className="flex items-center gap-2 md:hidden">
            {actionButtons}
          </div>
        </div>

        <div className="w-full md:max-w-xl md:flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="field-input h-11 w-full pl-10 pr-4 rounded-full bg-warm-cream-dark/45 border border-warm-cream-dark/90 focus:outline-none focus:border-luxe-gold text-luxe-dark placeholder-luxe-muted"
              id="header-search-input"
            />
            <Search className="w-4 h-4 text-luxe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {actionButtons}
        </div>
      </div>
    </header>
  );
}
