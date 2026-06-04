import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const catalogEl = document.getElementById('catalog-section-grid');
      if (catalogEl) {
        // Show button when the catalog top is scrolled past
        const threshold = catalogEl.offsetTop - 100;
        setIsVisible(window.scrollY > threshold);
      } else {
        // Fallback offset
        setIsVisible(window.scrollY > 600);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initially in case page was loaded scrolled down
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 p-3.5 bg-luxe-dark text-warm-cream hover:text-white rounded-full border border-luxe-gold/30 hover:border-luxe-copper hover:bg-luxe-copper active:scale-95 hover:scale-110 transition-all duration-300 shadow-2xl cursor-pointer select-none group flex items-center gap-2 font-serif text-xs font-bold leading-none tracking-wider uppercase"
          id="back-to-top-floating-btn"
          title="Retour en haut"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-300" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-500 ease-out whitespace-nowrap text-[10px] tracking-widest font-semibold px-0 group-hover:px-1">
            Retour en haut
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
