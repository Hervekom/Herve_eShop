import React from 'react';
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

  return (
    <header className="border-b border-warm-cream-dark/80 bg-warm-cream/95 sticky top-0 z-40 backdrop-blur-sm shadow-xs">
      <div className="w-full bg-gradient-to-r from-luxe-orange to-luxe-gold text-white py-1.5 px-4 shadow-sm select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center justify-center bg-white/20 backdrop-blur-xs text-white px-2.5 py-1 rounded-full type-badge">
              Nouveaux arrivages
            </span>
            <span className="type-meta text-white/95">
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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 type-kicker text-luxe-orange">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxe-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-luxe-orange"></span>
            </span>
            Live Cameroon
          </div>
        </div>

        <div className="flex flex-col items-center">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSearchChange('');
            }}
            className="flex flex-col items-center select-none group transition-all duration-300 hover:scale-[1.03]"
            title="Herve_eShop Cameroon"
          >
            <HerveLogo size="sm" className="transition-all group-hover:text-luxe-orange" />
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="field-input pl-9 pr-4 py-2 rounded-full bg-warm-cream-dark/45 border border-warm-cream-dark/90 focus:outline-none focus:border-luxe-gold w-28 xs:w-36 md:w-52 text-luxe-dark placeholder-luxe-muted"
              id="header-search-input"
            />
            <Search className="w-3.5 h-3.5 text-luxe-muted absolute left-3 top-2.5" />
          </div>

          <button
            type="button"
            onClick={onOpenNotificationCenter}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-warm-cream-dark hover:border-luxe-gold/60 hover:bg-warm-cream transition-all shadow-xs cursor-pointer select-none"
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
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-warm-cream-dark hover:border-luxe-gold/60 hover:bg-warm-cream transition-all shadow-xs cursor-pointer select-none"
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
            className="type-button flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-luxe-dark hover:bg-luxe-copper text-white transition-all shadow-xs cursor-pointer select-none border border-luxe-gold/20"
            id="open-customer-account-modal-header-btn"
          >
            <User className="w-3.5 h-3.5 text-luxe-gold" />
            <span className="hidden sm:inline">
              {activeUser && typeof activeUser.name === 'string' && activeUser.name.trim()
                ? activeUser.name.trim().split(' ')[0]
                : 'Mon Compte'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
