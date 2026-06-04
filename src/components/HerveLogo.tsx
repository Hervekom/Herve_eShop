import React from 'react';

interface HerveLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function HerveLogo({ className = '', size = 'md' }: HerveLogoProps) {
  // Handle proportional sizing scale
  const sizeClasses = {
    sm: 'w-24 h-18',
    md: 'w-32 h-24 sm:w-36 sm:h-28',
    lg: 'w-44 h-32',
    xl: 'w-56 h-42'
  };

  return (
    <div className={`flex items-center justify-center select-none ${className}`} id="herve-eshop-logo-wrapper">
      <svg
        viewBox="0 0 220 135"
        className={`${sizeClasses[size]} text-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.03)]`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="herve-eshop-main-svg"
      >
        {/* --- SHOPPING CART (LEFT GRAPHIC) --- */}
        <g id="shopping-cart-group" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Main Frame / Basket outline */}
          <path d="M 18 36 L 27 36 L 36 78 L 84 78 L 94 44 L 30 44" className="transition-all" />
          
          {/* Inner Grid System (Thin delicate parallel wires for real shop look) */}
          <g strokeWidth="1.2" stroke="currentColor" opacity="0.8">
            {/* Horizontal wires */}
            <line x1="31.5" y1="52" x2="91.5" y2="52" />
            <line x1="33" y1="60" x2="89" y2="60" />
            <line x1="34.5" y1="68" x2="86.5" y2="68" />
            
            {/* Vertical wires */}
            <line x1="42" y1="44" x2="42" y2="78" />
            <line x1="51" y1="44" x2="51" y2="78" />
            <line x1="60" y1="44" x2="60" y2="78" />
            <line x1="69" y1="44" x2="69" y2="78" />
            <line x1="78" y1="44" x2="78" y2="78" />
          </g>
          
          {/* Bottom chassis base rod */}
          <path d="M 36 78 L 41 90 L 82 90" strokeWidth="2.5" />
          
          {/* Back rest handle support dot / small loop */}
          <circle cx="18" cy="36" r="1.5" fill="currentColor" stroke="none" />
        </g>

        {/* Wheels (Delicate vector detailing as in original sketch) */}
        <g id="cart-wheels-group" stroke="currentColor" strokeWidth="2.2" fill="white">
          <circle cx="41.5" cy="99" r="5" />
          <circle cx="80" cy="99" r="5" />
          {/* Center Axles */}
          <circle cx="41.5" cy="99" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="80" cy="99" r="1.2" fill="currentColor" stroke="none" />
        </g>


        {/* --- CIRCLE H EMBLEM (ABOVE THE TEXT 'HERVÉ') --- */}
        <g id="circle-h-emblem-group" className="transition-all duration-300">
          {/* Circle border */}
          <circle cx="132" cy="38" r="21.5" stroke="currentColor" strokeWidth="1.8" />
          
          {/* Big custom high-contrast bold letter H */}
          <text
            x="132"
            y="46"
            fontFamily="var(--font-sans), system-ui, sans-serif"
            fontWeight="900"
            fontSize="23"
            fill="currentColor"
            textAnchor="middle"
          >
            H
          </text>
          
          {/* Signature Orange Brand Dot - positioned precisely on the outer circle ring at approx 45 degrees */}
          <circle cx="147.2" cy="22.8" r="3.2" fill="#eb5e28" className="animate-pulse" />
        </g>


        {/* --- BRAND NAME "Hervé" & "e-SHOP" --- */}
        {/* "Hervé" stylized with elegant Display Typography */}
        <text
          x="134"
          y="82"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontWeight="900"
          fontSize="26.5"
          fill="currentColor"
          textAnchor="middle"
          letterSpacing="-0.01em"
          id="brand-name-herve"
        >
          Hervé
        </text>

        {/* --- "e-SHOP" with the stylized Apple symbol --- */}
        <g id="e-shop-text-group" fill="currentColor">
          {/* "e-SH" */}
          <text
            x="114"
            y="102"
            fontFamily="var(--font-sans), var(--font-mono), monospace"
            fontWeight="800"
            fontSize="14"
            textAnchor="middle"
            letterSpacing="0.04em"
          >
            e-SH
          </text>

          {/* Precise Vector Apple Silhouette replacing the letter 'O' for authentic original representation */}
          <g transform="translate(129, 90.5) scale(0.65)" id="vector-apple-icon">
            {/* The main body of the Apple */}
            <path
              d="M13.5,6.5 C13,7.2 12.5,7.2 11.8,6.9 C11.1,6.6 10.4,6.9 9.8,7.6 C8.4,9.1 7.7,11.5 8.4,15.1 C9.1,18 11.2,19.4 12.6,19.4 C13.3,19.4 14,18.7 14.7,18.7 C15.4,18.7 16.1,19.4 16.8,19.4 C18.2,19.4 20.3,17.6 21,15.1 C21.7,12.7 21,10.1 19.6,8.7 C18.6,7.7 17.2,7 16.1,7 C15.4,7 14.7,7.2 13.5,6.5 Z"
              fill="currentColor"
            />
            {/* The Apple Leaf */}
            <path
              d="M15.4,6.5 C16.1,4.4 17.5,3 19.6,2.3 C19.6,4.4 18.2,5.8 16.1,6.5 Z"
              fill="currentColor"
            />
          </g>

          {/* Letter "P" */}
          <text
            x="152.5"
            y="102"
            fontFamily="var(--font-sans), var(--font-mono), monospace"
            fontWeight="800"
            fontSize="14"
            textAnchor="middle"
            letterSpacing="0.04em"
          >
            P
          </text>
        </g>


        {/* --- BASE BRUSH STROKE (Underlining the composition) --- */}
        {/* Customized organic tapering visual stroke exactly mirroring the hand-drawn ink in the logo */}
        <path
          d="M 52 114 C 92 111.5 132 111.5 186 114 C 132 112.5 92 112.5 52 114 Z"
          fill="currentColor"
          id="organic-brush-stroke"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}
