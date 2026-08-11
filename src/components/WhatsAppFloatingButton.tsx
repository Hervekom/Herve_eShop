import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

function normalizeWhatsAppNumber(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('237')) return digits;
  if (digits.length === 9 && digits.startsWith('6')) return `237${digits}`;
  return digits;
}

export default function WhatsAppFloatingButton({ cms }: { cms?: any }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-show eye-catching tooltip after a short delay to captivate prospects
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 4000); // Show after 4 seconds

    return () => clearTimeout(timer);
  }, []);

  const contactCMS = cms?.contactCMS || {};
  const phoneNumber = normalizeWhatsAppNumber(contactCMS.whatsAppPhone || contactCMS.primaryPhone || '237699001122');
  const defaultText = encodeURIComponent(
    "Bonjour Herve_eShop, je m'intéresse à vos ordinateurs portables importés d'origine. Pourrais-je avoir plus d'informations ?"
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultText}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end select-none">
      {/* Dynamic Trust-Building Tooltip Panel */}
      {showTooltip && (
        <div className="mb-3 max-w-[280px] bg-white border border-warm-cream-dark/60 text-luxe-dark rounded-2xl p-3.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300 relative text-left">
          {/* Close button */}
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-luxe-muted hover:text-luxe-dark transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-start gap-2.5">
            {/* Pulsing online green dot indicator */}
            <div className="mt-1 relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-luxe-orange">
                Hervé est en ligne 🇨🇲
              </p>
              <p className="text-xs text-luxe-muted mt-1 font-sans leading-relaxed">
                Besoin d'aide pour choisir votre ordinateur portable ? Échangez en direct sur WhatsApp !
              </p>
            </div>
          </div>
          
          {/* Micro arrow downward pointing to the button */}
          <div className="absolute bottom-[-6px] right-5 w-3 h-3 bg-white border-r border-b border-warm-cream-dark/60 rotate-45"></div>
        </div>
      )}

      {/* Pulsing Floating Action Button wrapper with beautiful brand glows */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#20ba5a] active:scale-95 hover:scale-110 transition-all duration-300 ease-out cursor-pointer hover:shadow-emerald-500/40 ring-4 ring-white/10"
        id="whatsapp-floating-contact-btn"
        title="Contactez-nous sur WhatsApp"
      >
        {/* Pulsing halo ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ping duration-1000 -z-10 group-hover:animate-none"></span>

        {/* Clean Communication icon */}
        <MessageCircle className="w-6 h-6 fill-current" />

        {/* Floating tooltip hover label expanding horizontally */}
        <span className="absolute right-16 scale-0 origin-right duration-250 ease-out group-hover:scale-100 bg-luxe-dark text-white text-[11px] font-bold py-2 px-4 rounded-xl whitespace-nowrap shadow-md pointer-events-none transition-all">
          Discuter avec Hervé 💬
        </span>
      </a>
    </div>
  );
}
