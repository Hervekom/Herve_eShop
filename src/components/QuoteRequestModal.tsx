import React, { useState, useEffect } from 'react';
import { X, Check, Laptop, Sparkles, HelpCircle, PhoneCall, Mail, MapPin } from 'lucide-react';
import { Laptop as LaptopType, QuoteCustomizations, QuoteRequest } from '../types';
import { CAMEROON_CITIES } from '../data';

interface QuoteRequestModalProps {
  laptop: LaptopType;
  onClose: () => void;
  onSubmitQuote: (quote: QuoteRequest) => void;
}

export default function QuoteRequestModal({
  laptop,
  onClose,
  onSubmitQuote
}: QuoteRequestModalProps) {
  // Customer info state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('Douala');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Spec upgrades selection state
  const [ramUpgrade, setRamUpgrade] = useState<'Aucune' | '32GB' | '64GB'>('Aucune');
  const [storageUpgrade, setStorageUpgrade] = useState<'Aucun' | '1TB SSD' | '2TB SSD'>('Aucun');
  const [osOption, setOsOption] = useState('Windows d\'origine / macOS natif');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Real-time calculated price state
  const [finalPrice, setFinalPrice] = useState(laptop.price);

  // Upgrade Pricing Modifiers Configuration (FCFA)
  const PRICING = {
    ram: {
      'Aucune': 0,
      '32GB': 60000,
      '64GB': 140000
    },
    storage: {
      'Aucun': 0,
      '1TB SSD': 45000,
      '2TB SSD': 95000
    },
    accessories: {
      'Housse de protection en cuir véritable': 25000,
      'Souris premium sans fil ergonomique': 15000,
      'Support ventilé en aluminium anodisé': 20000,
      'Garantie d\'extension Hervé Care (1 An)': 35000
    } as Record<string, number>
  };

  // Recalculate cost when selections change
  useEffect(() => {
    let cost = laptop.price;
    cost += PRICING.ram[ramUpgrade];
    cost += PRICING.storage[storageUpgrade];
    
    selectedAccessories.forEach(acc => {
      if (PRICING.accessories[acc]) {
        cost += PRICING.accessories[acc];
      }
    });

    setFinalPrice(cost);
  }, [ramUpgrade, storageUpgrade, selectedAccessories, laptop.price]);

  // Handle accessories toggle
  const toggleAccessory = (accessoryName: string) => {
    if (selectedAccessories.includes(accessoryName)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== accessoryName));
    } else {
      setSelectedAccessories([...selectedAccessories, accessoryName]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core validations
    const formErrors: { [key: string]: string } = {};
    if (!clientName.trim()) formErrors.name = 'Le nom complet est requis.';
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      formErrors.email = 'Veuillez saisir un e-mail valide.';
    }
    if (!clientPhone.trim()) {
      formErrors.phone = 'Le numéro WhatsApp ou téléphone est requis.';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Generate unique Devis code e.g. DEV-723A
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const quoteId = `DEV-${randomHex}`;

    const quoteObject: QuoteRequest = {
      id: quoteId,
      laptopId: laptop.id,
      laptopBrand: laptop.brand,
      laptopModel: laptop.model,
      basePrice: laptop.price,
      finalPrice: finalPrice,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone.trim(),
      clientCity: clientCity,
      customizations: {
        ramUpgrade,
        storageUpgrade,
        osOption,
        accessories: selectedAccessories
      },
      additionalNotes: additionalNotes.trim(),
      status: 'Demande reçue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSubmitQuote(quoteObject);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  return (
    <div className="fixed inset-0 bg-luxe-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-warm-cream-dark flex flex-col md:flex-row overflow-hidden my-8 animate-in zoom-in-95 duration-250 text-left"
        id="quote-modal-container"
      >
        {/* Left column: Selected Hardware Context Cards */}
        <div className="md:w-5/12 bg-warm-cream p-6 md:p-8 flex flex-col justify-between border-r border-warm-cream-dark">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="bg-luxe-copper/10 text-luxe-copper text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Matériel sélectionné
              </span>
              <button onClick={onClose} className="md:hidden text-luxe-muted hover:text-luxe-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden shadow-xs border border-warm-cream-dark/40 bg-white p-3">
              <img
                src={laptop.image}
                alt={laptop.model}
                className="w-full h-32 object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
              <div className="mt-3">
                <h4 className="font-serif font-bold text-sm text-luxe-dark">
                  {laptop.brand} {laptop.model}
                </h4>
                <p className="text-[11px] text-luxe-muted mt-0.5">Importé de {laptop.source} — Condition {laptop.condition}</p>
              </div>
            </div>

            {/* Technical Recap */}
            <div className="mt-6 space-y-2 text-xs">
              <h5 className="font-bold text-luxe-muted uppercase tracking-wider text-[10px]">Fiche d'origine</h5>
              <div className="bg-white/50 p-3 rounded-lg border border-warm-cream-dark/30 space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-warm-cream-dark/20 pb-1">
                  <span className="text-luxe-muted">Processeur</span>
                  <span className="font-medium text-luxe-dark">{laptop.processor}</span>
                </div>
                <div className="flex justify-between border-b border-warm-cream-dark/20 pb-1">
                  <span className="text-luxe-muted">Mémoire de base</span>
                  <span className="font-medium text-luxe-dark font-mono">{laptop.ram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxe-muted">Disque de base</span>
                  <span className="font-medium text-luxe-dark font-mono">{laptop.storage}</span>
                </div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="mt-6 bg-luxe-dark text-warm-cream p-4 rounded-xl shadow-xs">
              <p className="text-[10px] uppercase font-bold tracking-widest text-luxe-gold">Montant Estimé du Devis</p>
              <p className="text-2xl font-bold font-serif text-white mt-1">{formatPrice(finalPrice)}</p>
              <div className="mt-3 space-y-1 border-t border-white/15 pt-2.5 text-[10px] text-warm-cream-dark/75">
                <div className="flex justify-between">
                  <span>Prix d'origine :</span>
                  <span>{formatPrice(laptop.price)}</span>
                </div>
                {ramUpgrade !== 'Aucune' && (
                  <div className="flex justify-between text-luxe-gold">
                    <span>Option RAM (+{ramUpgrade}) :</span>
                    <span>+{formatPrice(PRICING.ram[ramUpgrade])}</span>
                  </div>
                )}
                {storageUpgrade !== 'Aucun' && (
                  <div className="flex justify-between text-luxe-gold">
                    <span>Option SSD (+{storageUpgrade}) :</span>
                    <span>+{formatPrice(PRICING.storage[storageUpgrade])}</span>
                  </div>
                )}
                {selectedAccessories.length > 0 && (
                  <div className="flex justify-between text-luxe-gold">
                    <span>Accessoire(s) ({selectedAccessories.length}) :</span>
                    <span>
                      +{formatPrice(
                        selectedAccessories.reduce((acc, current) => acc + (PRICING.accessories[current] || 0), 0)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block text-[10px] text-luxe-muted mt-6 border-t border-warm-cream-dark/50 pt-3">
            Herve_eShop : Des offres claires, sans coûts cachés. Retrait disponible à Yaoundé & Douala ou livraison sécurisée à domicile.
          </div>
        </div>

        {/* Right column: Interactive configuration Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-[600px]">
          {/* Header Action */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-serif font-bold text-luxe-dark">Personnalisation & Devis</h3>
              <p className="text-xs text-luxe-muted mt-0.5">Sélectionnez vos options d'upgrade de composants physiques.</p>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="hidden md:block p-1.5 rounded-full hover:bg-warm-cream-dark text-luxe-muted hover:text-luxe-dark transition-colors"
              id="quote-modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Form Body */}
          <div className="mt-6 space-y-5">
            {/* Step 1: Upgrades */}
            <div className="space-y-3.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-luxe-gold">1. Amélioration des caractéristiques</h4>
              
              {/* RAM Upgrades (Custom Radio Chips) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-luxe-dark flex items-center justify-between">
                  <span>Augmenter la RAM de l'appareil</span>
                  <span className="text-[10px] text-luxe-muted font-normal">Recommandé pour Virtualisation / Montage</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRamUpgrade('Aucune')}
                    className={`p-2.5 text-xs rounded-lg border text-center font-medium transition-all ${
                      ramUpgrade === 'Aucune'
                        ? 'bg-luxe-dark text-warm-cream border-luxe-dark'
                        : 'bg-white text-luxe-dark border-warm-cream-dark hover:bg-warm-cream'
                    }`}
                  >
                    Origine
                    <span className="block text-[9px] opacity-70">Sans frais</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRamUpgrade('32GB')}
                    className={`p-2.5 text-xs rounded-lg border text-center font-medium transition-all ${
                      ramUpgrade === '32GB'
                        ? 'bg-luxe-dark text-warm-cream border-luxe-dark'
                        : 'bg-white text-luxe-dark border-warm-cream-dark hover:bg-warm-cream'
                    }`}
                  >
                    32 Go
                    <span className="block text-[9px] text-luxe-copper font-bold font-mono">+{formatPrice(PRICING.ram['32GB'])}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRamUpgrade('64GB')}
                    className={`p-2.5 text-xs rounded-lg border text-center font-medium transition-all ${
                      ramUpgrade === '64GB'
                        ? 'bg-luxe-dark text-warm-cream border-luxe-dark'
                        : 'bg-white text-luxe-dark border-warm-cream-dark hover:bg-warm-cream'
                    }`}
                  >
                    64 Go
                    <span className="block text-[9px] text-luxe-copper font-bold font-mono">+{formatPrice(PRICING.ram['64GB'])}</span>
                  </button>
                </div>
              </div>

              {/* Storage upgrades (Custom radio chips) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-luxe-dark flex items-center justify-between">
                  <span>Augmenter l'espace de stockage</span>
                  <span className="text-[10px] text-luxe-muted font-normal">SSD PCIe NVMe Haute Performance</span>
                </label>
                <div className="grid grid-cols-3 gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStorageUpgrade('Aucun')}
                    className={`p-2.5 text-xs rounded-lg border text-center font-medium transition-all ${
                      storageUpgrade === 'Aucun'
                        ? 'bg-luxe-dark text-warm-cream border-luxe-dark'
                        : 'bg-white text-luxe-dark border-warm-cream-dark hover:bg-warm-cream'
                    }`}
                  >
                    Origine
                    <span className="block text-[9px] opacity-70">Sans frais</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageUpgrade('1TB SSD')}
                    className={`p-2.5 text-xs rounded-lg border text-center font-medium transition-all ${
                      storageUpgrade === '1TB SSD'
                        ? 'bg-luxe-dark text-warm-cream border-luxe-dark'
                        : 'bg-white text-luxe-dark border-warm-cream-dark hover:bg-warm-cream'
                    }`}
                  >
                    1 To SSD
                    <span className="block text-[9px] text-luxe-copper font-bold font-mono">+{formatPrice(PRICING.storage['1TB SSD'])}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageUpgrade('2TB SSD')}
                    className={`p-2.5 text-xs rounded-lg border text-center font-medium transition-all ${
                      storageUpgrade === '2TB SSD'
                        ? 'bg-luxe-dark text-warm-cream border-luxe-dark'
                        : 'bg-white text-luxe-dark border-warm-cream-dark hover:bg-warm-cream'
                    }`}
                  >
                    2 To SSD
                    <span className="block text-[9px] text-luxe-copper font-bold font-mono">+{formatPrice(PRICING.storage['2TB SSD'])}</span>
                  </button>
                </div>
              </div>

              {/* Prefetched preconfigured System software option */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-luxe-dark">Système d'exploitation souhaité</label>
                <select
                  value={osOption}
                  onChange={(e) => setOsOption(e.target.value)}
                  className="w-full text-xs bg-warm-cream border border-warm-cream-dark rounded-lg py-2 px-3 text-luxe-dark focus:outline-none focus:border-luxe-gold font-medium"
                  id="selection-os-select"
                >
                  <option value="Windows d'origine / macOS natif">Conserver l'OS d'origine (Recommandé)</option>
                  <option value="Windows 11 Professionnel français activé">Windows 11 Professionnel (Français) [+ Clé Digitale]</option>
                  <option value="Ubuntu Linux 24.04 LTS pré-installé">Ubuntu Linux 24.04 LTS (Optimisé développeurs)</option>
                  <option value="Dual-Boot Windows 11 + Linux Ubuntu">Dual-Boot Windows 11 + Linux Ubuntu</option>
                </select>
              </div>

              {/* Accessories Custom checkboxes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-luxe-dark">Équipez votre ordinateur avec notre pack Accessoires</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(PRICING.accessories).map((acc) => {
                    const price = PRICING.accessories[acc];
                    const isSelected = selectedAccessories.includes(acc);
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => toggleAccessory(acc)}
                        className={`flex items-center justify-between p-2.5 text-[11px] rounded-lg border text-left font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-warm-cream-dark/50 border-luxe-copper text-luxe-dark shadow-xs'
                            : 'bg-white border-warm-cream-dark text-luxe-muted hover:bg-warm-cream'
                        }`}
                      >
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                            isSelected ? 'bg-luxe-copper text-white border-luxe-copper' : 'border-warm-cream-dark bg-white'
                          }`}>
                            {isSelected && '✓'}
                          </span>
                          <span className="truncate">{acc}</span>
                        </div>
                        <span className="font-mono text-xs text-luxe-copper font-bold">+{formatPrice(price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Customer Contact Info */}
            <div className="space-y-3.5 pt-4 border-t border-warm-cream-dark/50">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-luxe-gold">2. Vos coordonnées de prospects</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name input */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-luxe-dark flex items-center gap-1">
                    Nom complet <span className="text-luxe-copper">*</span>
                  </span>
                  <span className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Hervé Kenmogne"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full py-2 px-3 pl-8 text-xs bg-warm-cream border rounded-lg focus:outline-none focus:border-luxe-gold font-medium text-luxe-dark ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-warm-cream-dark'
                      }`}
                      id="quote-client-name"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-luxe-gold absolute left-2.5 top-2.5" />
                  </span>
                  {errors.name && <span className="text-[10px] text-red-500 font-semibold">{errors.name}</span>}
                </div>

                {/* Email input */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-luxe-dark flex items-center gap-1">
                    Adresse Email <span className="text-luxe-copper">*</span>
                  </span>
                  <span className="relative">
                    <input
                      type="email"
                      placeholder="Ex: herve.nom@gmail.com"
                      value={clientEmail}
                      onChange={(e) => {
                        setClientEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full py-2 px-3 pl-8 text-xs bg-warm-cream border rounded-lg focus:outline-none focus:border-luxe-gold font-medium text-luxe-dark ${
                        errors.email ? 'border-red-400 focus:border-red-500' : 'border-warm-cream-dark'
                      }`}
                      id="quote-client-email"
                    />
                    <Mail className="w-3.5 h-3.5 text-luxe-muted absolute left-2.5 top-2.5" />
                  </span>
                  {errors.email && <span className="text-[10px] text-red-500 font-semibold">{errors.email}</span>}
                </div>

                {/* Mobile / Whatsapp input */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-luxe-dark flex items-center gap-1">
                    WhatsApp ou Téléphone <span className="text-luxe-copper">*</span>
                  </span>
                  <span className="relative">
                    <input
                      type="text"
                      placeholder="Ex: +237 699 99 99 99"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full py-2 px-3 pl-8 text-xs bg-warm-cream border rounded-lg focus:outline-none focus:border-luxe-gold font-medium text-luxe-dark ${
                        errors.phone ? 'border-red-400 focus:border-red-500' : 'border-warm-cream-dark'
                      }`}
                      id="quote-client-phone"
                    />
                    <PhoneCall className="w-3.5 h-3.5 text-luxe-muted absolute left-2.5 top-2.5" />
                  </span>
                  {errors.phone && <span className="text-[10px] text-red-500 font-semibold">{errors.phone}</span>}
                </div>

                {/* City select lists */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-luxe-dark flex items-center gap-1">
                    Ville de Résidence <span className="text-luxe-copper">*</span>
                  </span>
                  <span className="relative">
                    <select
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      className="w-full py-2 px-3 pl-8 text-xs bg-warm-cream border border-warm-cream-dark rounded-lg focus:outline-none focus:border-luxe-gold font-medium text-luxe-dark"
                      id="quote-client-city"
                    >
                      {CAMEROON_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <MapPin className="w-3.5 h-3.5 text-luxe-copper absolute left-2.5 top-2.5" />
                  </span>
                </div>
              </div>

              {/* Special requirements/notes */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-luxe-dark">Notes ou Instructions Additionnelles (Optionnel)</span>
                <textarea
                  placeholder="Ex: Besoin d'une sacoche de couleur noire de préférence, ou facture de dédouanement fournie..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full h-16 py-2 px-3 text-xs bg-warm-cream border border-warm-cream-dark rounded-lg focus:outline-none focus:border-luxe-gold font-medium text-luxe-dark"
                  id="quote-additional-notes"
                />
              </div>
            </div>
          </div>

          {/* Form Actions footer */}
          <div className="mt-8 pt-4 border-t border-warm-cream-dark/50 flex flex-col sm:flex-row justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs uppercase tracking-wider font-bold text-luxe-muted hover:text-luxe-dark bg-transparent border border-transparent transition-colors text-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-luxe-dark text-warm-cream text-xs uppercase tracking-widest font-bold rounded-lg shadow-lg hover:bg-luxe-copper transition-all"
              id="submit-quote-request-btn"
            >
              Envoyer ma Demande de Devis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
