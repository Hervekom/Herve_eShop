import React, { useState } from 'react';
import { Sparkles, Check, HelpCircle, HardDrive, Cpu, Layers, Battery, ExternalLink, HelpCircle as HelpIcon, ArrowRight, Laptop, Gamepad2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function normalizeWhatsAppNumber(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('237')) return digits;
  if (digits.length === 9 && digits.startsWith('6')) return `237${digits}`;
  return digits;
}

interface GuideCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
    battery: string;
  };
  advantages: string[];
  keyAdvice: string;
  suitableFor: string[];
  recommendedModels: string;
}

const GUIDES_DATA: GuideCategory[] = [
  {
    id: 'ultrabook',
    title: 'Mobilité & Autonomie (Ultrabook)',
    subtitle: 'La combinaison ultime entre finesse, légèreté et endurance.',
    icon: <Laptop className="w-5 h-5 text-luxe-gold" />,
    specs: {
      cpu: 'Intel Core i5 / i7 (Série U/G) ou Apple Silicon M1 / M2',
      ram: '8 Go ou 16 Go LPDDR4X / LPDDR5',
      storage: '256 Go à 512 Go SSD NVMe haute vitesse',
      gpu: 'Intel Iris Xe, AMD Radeon Vega ou Apple GPU (intégré)',
      battery: '8h à 14h en utilisation réelle'
    },
    advantages: [
      'Poids plume (< 1.4 kg) et châssis en aluminium raffiné',
      'Excellente autonomie pour travailler sereinement sans chargeur',
      'Écran haute définition ultra-lumineux et antireflet',
      'Démarrage instantané et parfaite discrétion (silencieux)'
    ],
    keyAdvice: "Privilégiez absolument la qualité du châssis (Dell XPS, MacBook Air, ThinkPad X1 Carbon) et un minimum de 16 Go de RAM soudée si vous souhaitez garder la machine plus de 4 ans sans ralentissement.",
    suitableFor: ['Étudiants & Enseignants', 'Cadres & Commerciaux nomades', 'Rédacteurs & Community Managers', 'Consultants & Grand Public'],
    recommendedModels: 'Dell XPS 13, MacBook Air M1/M2, HP EliteBook 840, Lenovo ThinkPad X1'
  },
  {
    id: 'bureautique',
    title: 'Bureautique & Télétravail',
    subtitle: 'Fiabilité à long terme, confort de frappe et excellent rapport qualité/prix.',
    icon: <Briefcase className="w-5 h-5 text-luxe-copper" />,
    specs: {
      cpu: 'Intel Core i5 / AMD Ryzen 5',
      ram: '16 Go DDR4 (extensible ou dual-channel)',
      storage: '512 Go SSD NVMe PCIe',
      gpu: 'Intel UHD Graphics ou AMD Radeon (robuste)',
      battery: '5h à 8h d\'autonomie'
    },
    advantages: [
      'Clavier ergonomique haut de gamme pour les longues sessions de saisie',
      'Connectique complète (USB-A, HDMI, RJ45) pour éviter les adaptateurs',
      'Grande robustesse de fabrication de gamme professionnelle (MIL-SPEC)',
      'Maintenance et remplacement des composants aisés (RAM/Disque)'
    ],
    keyAdvice: "Une machine pro de seconde main certifiée (séries HP ProBook/EliteBook ou Lenovo ThinkPad T) offrira une durabilité de frappe et un refroidissement largement supérieurs à un ordinateur neuf grand public au même tarif.",
    suitableFor: ['Secrétariat & Administration', 'Comptables & Analystes financiers', 'Enseignants & Écrivains', 'PME & Télétravailleurs'],
    recommendedModels: 'Lenovo ThinkPad T14 / L14, HP ProBook 440, Dell Latitude 5430'
  },
  {
    id: 'gaming',
    title: 'Création & Graphisme (Gaming)',
    subtitle: 'Puissance graphique brute et calcul intensif pour les créatifs et joueurs exigents.',
    icon: <Gamepad2 className="w-5 h-5 text-luxe-orange" />,
    specs: {
      cpu: 'Intel Core i7 / i9 (Série H) ou AMD Ryzen 7 / 9 (Série H)',
      ram: '16 Go à 32 Go DDR5 (haute fréquence)',
      storage: '512 Go à 2 To SSD NVMe (PCIe Gen 4)',
      gpu: 'NVIDIA GeForce RTX 3065/4060/4070 ou AMD Radeon RX dédié',
      battery: '3h à 5h (consommation graphique élevée)'
    },
    advantages: [
      'Carte graphique dédiée pour l\'accélération 3D, le montage et le jeu',
      'Système de refroidissement actif haute performance à double ventilateur',
      'Écran à taux de rafraîchissement élevé (120Hz, 144Hz+) pour une fluidité absolue',
      'Extensibilité maximale pour rajouter de la mémoire ou des disques durs'
    ],
    keyAdvice: "Pour le montage vidéo 4K, le rendu 3D (Blender/AutoCAD) ou le Gaming, la carte graphique dédiée (dGPU) est obligatoire. Un modèle avec RTX 3060 ou supérieur vous garantira l'accélération matérielle indispensable.",
    suitableFor: ['Monteurs Vidéo & Motion Designers', 'Architectes & Ingénieurs 3D', 'Développeurs de jeux & IA', 'Hardcore Gamers du Cameroun'],
    recommendedModels: 'ASUS ROG Zephyrus, Dell G15 / Alienware, HP OMEN, Lenovo Legion 5'
  }
];

export default function BuyingGuides({ cms }: { cms?: any }) {
  const [activeTab, setActiveTab] = useState<string>('ultrabook');
  const [userProfile, setUserProfile] = useState<string>('all');
  const contactCMS = cms?.contactCMS || {};
  const whatsAppPhone = normalizeWhatsAppNumber(contactCMS.whatsAppPhone || contactCMS.primaryPhone || '237699001122') || '237699001122';
  
  // Quiz states
  const [quizAnswers, setQuizAnswers] = useState({
    usage: '',
    mobility: '',
    budget: ''
  });
  
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizRecommendation, setQuizRecommendation] = useState<string>('');

  const currentGuide = GUIDES_DATA.find(g => g.id === activeTab) || GUIDES_DATA[0];

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizAnswers.usage || !quizAnswers.mobility || !quizAnswers.budget) return;

    let result = 'bureautique'; // default

    if (quizAnswers.usage === 'creative' || quizAnswers.usage === 'gaming') {
      result = 'gaming';
    } else if (quizAnswers.mobility === 'very' || quizAnswers.usage === 'nomad') {
      result = 'ultrabook';
    } else if (quizAnswers.budget === 'high' && quizAnswers.mobility === 'medium_high') {
      result = 'ultrabook';
    } else if (quizAnswers.budget === 'low') {
      result = 'bureautique';
    } else {
      result = 'bureautique';
    }

    setQuizRecommendation(result);
    setShowQuizResult(true);
    setActiveTab(result);
  };

  const resetQuiz = () => {
    setQuizAnswers({ usage: '', mobility: '', budget: '' });
    setShowQuizResult(false);
  };

  const getWhatsAppProfileText = (profile: string) => {
    const guideName = GUIDES_DATA.find(g => g.id === profile)?.title || "Laptop d'exception";
    return `Bonjour Hervé, j'ai complété votre Guide d'Achat d'Hervé_eShop ! Mon profil idéal est : *${guideName}*. Avez-vous des modèles certifiés ou arrivages qui correspondent à cette configuration ? Merci !`;
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-warm-cream border-t border-warm-cream-dark/60" id="buying-guides-section">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-luxe-gold/15 border border-luxe-gold/35 px-4 py-1.5 rounded-full text-xs font-serif font-bold text-luxe-copper uppercase tracking-wider mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-luxe-copper" />
            <span>Conseils d'Expert • Cameroun</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-luxe-dark tracking-tight leading-tight">
            Les Guides d'Achat d'Hervé
          </h2>
          <p className="mt-3 text-sm md:text-base text-luxe-muted leading-relaxed">
            Pas facile de choisir parmi des dizaines de spécifications. Suivez nos conseils avisés rédigés d'après les configurations réelles demandées à Douala et Yaoundé pour faire le bon investissement.
          </p>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Guide Area - 7 cols */}
          <div className="lg:col-span-8 bg-white border border-warm-cream-dark p-6 md:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
            
            {/* Category Selector Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-warm-cream-dark pb-4">
              {GUIDES_DATA.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setActiveTab(guide.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer select-none border ${
                    activeTab === guide.id
                      ? 'bg-luxe-dark text-white border-luxe-dark shadow-md'
                      : 'bg-warm-cream text-luxe-muted border-warm-cream-dark hover:border-luxe-copper hover:text-luxe-dark'
                  }`}
                >
                  {guide.icon}
                  <span>{guide.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Tab Description Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-luxe-dark flex items-center gap-2">
                    {currentGuide.title}
                  </h3>
                  <p className="text-xs text-luxe-muted mt-1 leading-normal italic font-medium">
                    {currentGuide.subtitle}
                  </p>
                </div>

                {/* Grid layout for Features & Technical Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Left Column: Advantages checklist */}
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-luxe-muted border-b border-warm-cream-dark pb-1.5">
                      Pourquoi choisir ce profil ?
                    </h4>
                    <ul className="space-y-2.5">
                      {currentGuide.advantages.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-luxe-dark leading-relaxed">
                          <span className="p-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mt-0.5 flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Spec Highlights Cards */}
                  <div className="bg-warm-cream/50 border border-warm-cream-dark rounded-2xl p-4 space-y-3">
                    <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-luxe-muted border-b border-warm-cream-dark pb-1 ml-1">
                      Fiche technique préconisée
                    </h4>
                    
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-luxe-dark">
                        <Cpu className="w-4 h-4 text-luxe-copper flex-shrink-0" />
                        <span className="text-luxe-muted mr-1">CPU :</span>
                        <span className="font-semibold">{currentGuide.specs.cpu}</span>
                      </div>

                      <div className="flex items-center gap-2 text-luxe-dark">
                        <Layers className="w-4 h-4 text-luxe-copper flex-shrink-0" />
                        <span className="text-luxe-muted mr-1">RAM :</span>
                        <span className="font-semibold font-mono">{currentGuide.specs.ram}</span>
                      </div>

                      <div className="flex items-center gap-2 text-luxe-dark">
                        <HardDrive className="w-4 h-4 text-luxe-copper flex-shrink-0" />
                        <span className="text-luxe-muted mr-1">Disque :</span>
                        <span className="font-semibold font-mono">{currentGuide.specs.storage}</span>
                      </div>

                      <div className="flex items-center gap-2 text-luxe-dark">
                        <Sparkles className="w-4 h-4 text-luxe-copper flex-shrink-0" />
                        <span className="text-luxe-muted mr-1">Carte Graphique :</span>
                        <span className="font-semibold">{currentGuide.specs.gpu}</span>
                      </div>

                      <div className="flex items-center gap-2 text-luxe-dark">
                        <Battery className="w-4 h-4 text-luxe-copper flex-shrink-0" />
                        <span className="text-luxe-muted mr-1">Autonomie :</span>
                        <span className="font-semibold">{currentGuide.specs.battery}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Professional advice callout banner */}
                <div className="p-4 bg-luxe-dark/5 border-l-4 border-luxe-copper rounded-r-xl text-xs text-luxe-dark leading-relaxed">
                  <span className="font-extrabold text-luxe-copper uppercase tracking-wider block mb-1">📢 Le Conseil d'Hervé :</span>
                  {currentGuide.keyAdvice}
                </div>

                {/* Target profiles and recommended series list */}
                <div className="pt-4 border-t border-warm-cream-dark/50 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-muted">Idéal pour :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentGuide.suitableFor.map((p, i) => (
                        <span key={i} className="text-[10px] font-bold bg-warm-cream text-luxe-muted border border-warm-cream-dark font-sans px-2.5 py-1 rounded-md">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-muted">Gamme de référence recommandée :</span>
                    <p className="text-xs text-luxe-dark font-sans font-extrabold tracking-wide">
                      {currentGuide.recommendedModels}
                    </p>
                  </div>
                </div>

                {/* Instant WhatsApp Inquiry Button for this guide state */}
                <div className="pt-2 flex justify-end">
                  <a
                    href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(getWhatsAppProfileText(currentGuide.id))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-luxe-dark text-warm-cream hover:bg-luxe-copper hover:text-white font-sans text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-full transition-all duration-300 shadow-md active:scale-95 cursor-pointer text-center select-none"
                    id={`guide-cta-${currentGuide.id}`}
                  >
                    <span>Consulter Hervé sur WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </motion.div>
            </AnimatePresence>

          </div>

          {/* Quick Quiz Interactive Panel - 5 cols */}
          <div className="lg:col-span-4 bg-luxe-dark text-warm-cream p-6 md:p-8 rounded-3xl shadow-xl flex flex-col gap-6 text-left border border-white/5 relative overflow-hidden">
            
            {/* Ambient luxury glow background ornament */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-luxe-gold/5 blur-3xl pointer-events-none rounded-full"></div>

            <div className="border-b border-white/10 pb-4">
              <h3 className="font-serif text-lg md:text-xl font-bold text-luxe-gold flex items-center gap-2">
                <HelpIcon className="w-5 h-5 text-luxe-gold" />
                Simulateur Express
              </h3>
              <p className="text-[11px] text-warm-cream-dark/60 mt-1">
                Laissez-nous vous suggérer la meilleure configuration selon 3 questions simples.
              </p>
            </div>

            {!showQuizResult ? (
              <form onSubmit={handleQuizSubmit} className="space-y-4">
                
                {/* Question 1: Principal Usage */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-gold">
                    1. Votre activité principale ?
                  </label>
                  <select
                    value={quizAnswers.usage}
                    onChange={(e) => setQuizAnswers({ ...quizAnswers, usage: e.target.value })}
                    required
                    className="w-full bg-luxe-gray text-xs border border-white/10 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-luxe-gold text-warm-cream"
                    id="quiz-usage-select"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="office">Secrétariat, Textes, Internet</option>
                    <option value="nomad">Bureautique intense & Déplacements</option>
                    <option value="creative">Graphisme, Vidéo, Dessin 3D, Dev</option>
                    <option value="gaming">Jeux vidéo & Logiciels gourmands</option>
                  </select>
                </div>

                {/* Question 2: Mobility */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-gold">
                    2. Besoin de déplacements ?
                  </label>
                  <select
                    value={quizAnswers.mobility}
                    onChange={(e) => setQuizAnswers({ ...quizAnswers, mobility: e.target.value })}
                    required
                    className="w-full bg-luxe-gray text-xs border border-white/10 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-luxe-gold text-warm-cream"
                    id="quiz-mobility-select"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="very">Toujours en mouvement (nomade)</option>
                    <option value="medium_high">Occasionnel (Maison / Bureau)</option>
                    <option value="low">Sédentaire (Reste branché sur secteur)</option>
                  </select>
                </div>

                {/* Question 3: Budget tier */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-gold">
                    3. Portée de votre budget ?
                  </label>
                  <select
                    value={quizAnswers.budget}
                    onChange={(e) => setQuizAnswers({ ...quizAnswers, budget: e.target.value })}
                    required
                    className="w-full bg-luxe-gray text-xs border border-white/10 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-luxe-gold text-warm-cream"
                    id="quiz-budget-select"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="low">Économique (Moins de 600K FCFA)</option>
                    <option value="medium">Intermédiaire (600K - 1M FCFA)</option>
                    <option value="high">Premium (Plus de 1M FCFA)</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-luxe-gold text-luxe-dark hover:bg-luxe-copper hover:text-white text-[11px] font-sans font-bold uppercase tracking-widest py-3 rounded-full transition-all duration-300 block text-center cursor-pointer select-none mt-2 shadow-lg"
                  id="quiz-submit-btn"
                >
                  Calculer mon profil recommandé
                </button>

              </form>
            ) : (
              // Quiz Results State
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-luxe-gold block">
                    Votre Résultat Recommandé :
                  </span>
                  
                  <div className="py-2">
                    <span className="text-lg font-serif font-black text-white uppercase tracking-wider block">
                      {GUIDES_DATA.find(g => g.id === quizRecommendation)?.title.split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-warm-cream-dark/60 block mt-1">
                      {GUIDES_DATA.find(g => g.id === quizRecommendation)?.subtitle}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-luxe-gold/10 border border-luxe-gold/30 rounded-2xl">
                  <p className="text-xs text-warm-cream leading-relaxed">
                    🌟 <span className="font-bold text-luxe-gold">Configuration conseillée :</span> {' '}
                    {GUIDES_DATA.find(g => g.id === quizRecommendation)?.specs.ram} RAM, disque {' '}
                    {GUIDES_DATA.find(g => g.id === quizRecommendation)?.specs.storage}, processeur {' '}
                    {GUIDES_DATA.find(g => g.id === quizRecommendation)?.specs.cpu}.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* WhatsApp contact pre-filled action */}
                  <a
                    href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(getWhatsAppProfileText(quizRecommendation))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-luxe-copper hover:bg-luxe-yellow hover:text-luxe-dark text-white text-[10px] font-bold uppercase tracking-wider py-3 rounded-full transition-all duration-300 text-center block cursor-pointer select-none"
                    id="quiz-whatsapp-btn"
                  >
                    💬 Commander ce Profil (WhatsApp)
                  </a>

                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="w-full bg-transparent text-[10px] text-warm-cream-dark/60 hover:text-white uppercase tracking-wide py-2 font-bold transition-all cursor-pointer underline select-none"
                    id="quiz-reset-btn"
                  >
                    Recommencer le test
                  </button>
                </div>

              </div>
            )}

            {/* Micro details assurance seal */}
            <div className="mt-auto pt-4 border-t border-white/15 text-[10px] text-warm-cream-dark/45 flex items-center justify-between">
              <span>Herve_eShop • Garanti 100% Import</span>
              <span>Double Test Rigoureux 🛠️</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
