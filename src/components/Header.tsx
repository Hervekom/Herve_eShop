import React from 'react';
import { Search } from 'lucide-react';
import HerveLogo from './HerveLogo';

interface HeaderProps {
  onSearchChange: (search: string) => void;
  searchValue: string;
}

export default function Header({
  onSearchChange,
  searchValue
}: HeaderProps) {
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
              Nouveaux arrivages d'ordinateurs <span className="underline decoration-white/40 underline-offset-2 font-black">MacBook, Dell & ThinkPad</span> importés directement d'Amérique !
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-white/90">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              Akwa Showroom • Ouvert 🇨🇲
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

        {/* Right Elements (Search filter) */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-full bg-warm-cream-dark/50 border border-warm-cream-dark focus:outline-none focus:border-luxe-gold w-32 xs:w-40 md:w-56 font-medium text-luxe-dark placeholder-luxe-muted"
              id="header-search-input"
            />
            <Search className="w-3 h-3 text-luxe-muted absolute left-2.5 top-2" />
          </div>
        </div>
      </div>
    </header>
  );
}
