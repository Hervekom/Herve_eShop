import React from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import HerveLogo from './HerveLogo';

interface HeaderProps {
  onSearchChange: (search: string) => void;
  searchValue: string;
  onOpenAccountModal: () => void;
  onOpenCart: () => void;
  cartCount: number;
  activeUser: any;
  cms?: any;
}

export default function Header({
  onSearchChange,
  searchValue,
  onOpenAccountModal,
  onOpenCart,
  cartCount,
  activeUser,
  cms
}: HeaderProps) {
  const siteCMS = cms?.siteCMS || {};
  const contactCMS = cms?.contactCMS || {};
  const announcementText =
    siteCMS.announcementText ||
    "Nouveaux arrivages d'ordinateurs MacBook, Dell & ThinkPad importés directement d'Amérique !";
  const headerStatus = contactCMS.openingHours || "Akwa Showroom • Ouvert 🇨🇲";

  return (
    <header className="border-b border-warm-cream-dark bg-warm-cream/95 sticky top-0 z-40 backdrop-blur-sm shadow-xs">
      {/* Captivating Live Orange Announcement Header Bar */}
      <div className="w-full bg-gradient-to-r from-luxe-orange to-luxe-gold text-white text-[10px] sm:text-xs font-bold py-1 px-4 shadow-sm select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center justify-center bg-white/25 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold animate-pulse">
              Arrivage Chaud 🔥
            </span>
            <span className="tracking-wide text-white/95 text-[10px] sm:text-xs">
              {announcementText}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-white/90">
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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-1 flex items-center justify-between">
        {/* Left Elements */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-luxe-orange">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxe-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-luxe-orange"></span>
            </span>
            Live Cameroon
          </div>
        </div>

        {/* Center Elegant Logo */}
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

        {/* Right Elements (Search filter & Account) */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-full bg-warm-cream-dark/50 border border-warm-cream-dark focus:outline-none focus:border-luxe-gold w-24 xs:w-32 md:w-48 font-medium text-luxe-dark placeholder-luxe-muted"
              id="header-search-input"
            />
            <Search className="w-3.5 h-3.5 text-luxe-muted absolute left-2.5 top-2" />
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white border border-warm-cream-dark hover:border-luxe-gold/60 hover:bg-warm-cream transition-all shadow-xs cursor-pointer select-none"
            id="open-cart-btn"
            title="Panier"
          >
            <ShoppingCart className="w-4 h-4 text-luxe-dark" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-luxe-copper text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAccountModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-luxe-dark hover:bg-luxe-copper text-white text-[10px] md:text-xs font-bold transition-all shadow-xs cursor-pointer select-none border border-luxe-gold/20"
            id="open-customer-account-modal-header-btn"
          >
            <User className="w-3.5 h-3.5 text-luxe-gold" />
            <span className="hidden sm:inline">
              {activeUser ? activeUser.name.split(' ')[0] : 'Mon Compte'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
