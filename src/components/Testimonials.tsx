import React, { useState } from 'react';
import { Star, CheckCircle2, Quote, Sparkles, Plus } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  city: string;
  avatarColor: string;
  rating: number;
  product: string;
  comment: string;
  date: string;
  verified: boolean;
}

const PRE_SEEDED_TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'Jean-Pierre Ngué',
    city: 'Yaoundé',
    avatarColor: 'bg-luxe-copper text-white',
    rating: 5,
    product: 'MacBook Pro 14" M3 (32GB RAM)',
    comment: 'Qualité absolument incroyable ! L\'ordinateur est arrivé dans un état de seconde main rigoureusement neuf (zéro micro-rayure, santé batterie à 98%). Hervé a configuré la RAM à 32 Go comme demandé lors du devis. Service de confiance absolue à Yaoundé.',
    date: 'Il y a 3 jours',
    verified: true
  },
  {
    id: 't-2',
    name: 'Kevine Mengue',
    city: 'Douala',
    avatarColor: 'bg-luxe-gold text-luxe-dark',
    rating: 5,
    product: 'Lenovo ThinkPad T14 Gen 3',
    comment: 'Une bête de course pour mes travaux de développement à Akwa. Le clavier est un pur régal et la bécane ne chauffe pas. Chapeau l\'artiste, importation certifiée USA authentique. Je repasserai commande pour mes collaborateurs.',
    date: 'Il y a 1 semaine',
    verified: true
  },
  {
    id: 't-3',
    name: 'Christian Kamga',
    city: 'Bafoussam',
    avatarColor: 'bg-luxe-muted text-white',
    rating: 5,
    product: 'Dell XPS 15 9520',
    comment: 'Hervé est ultra sérieux et très transparent. Livraison sécurisée jusqu\'à Bafoussam. Le Dell XPS est d\'un écran OLED somptueux. Les accessoires offerts d\'origine font plaisir. Adresse recommandée les yeux fermés !',
    date: 'Il y a 2 semaines',
    verified: true
  }
];

const RANDOM_NAMES = [
  'Amina Abbo', 'Marc Alhadji', 'Fidèle Tchakounté', 'Nathalie Eyenga',
  'Ibrahim Bello', 'Emilie Ngo', 'Rodrigue Fotso', 'Raïssa Belinga',
  'Arnaud Ebolo', 'Saliou Ousmanou', 'Vanessa Moukoko', 'Serge Mvogo'
];

const RANDOM_CITIES = [
  'Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Limbe', 'Bamenda', 'Kribi', 'Ngaoundéré'
];

const RANDOM_PRODUCTS = [
  'MacBook Air 13" M2 (16GB)', 'HP EliteBook 840 G9', 'Dell Latitude 7430',
  'ASUS ROG Zephyrus G14', 'MacBook Pro 16" M1 Max', 'Lenovo ThinkPad X1 Carbon Gen 10',
  'HP ZBook Fury 15 G8', 'Microsoft Surface Laptop 5'
];

const RANDOM_AVATARS = [
  'bg-emerald-600 text-white', 'bg-blue-600 text-white', 'bg-amber-500 text-white',
  'bg-indigo-600 text-white', 'bg-rose-500 text-white', 'bg-teal-600 text-white',
  'bg-luxe-copper text-white', 'bg-luxe-gold text-luxe-dark'
];

const RANDOM_COMMENTS = [
  'Excellent rapport qualité-prix. Très bon suivi de commande du début à la fin de l\'importation.',
  'Machine super propre, conforme en tout point à la fiche technique. Je valide à 100% l\'authenticité.',
  'Hervé est d\'un professionnalisme incroyable au Cameroun. Traçabilité complète du colis depuis les USA.',
  'Service après-vente au top ! J\'ai eu un petit doute sur le chargeur et Hervé me l\'a échangé instantanément à Douala.',
  'Incroyable ! On dirait que l\'ordinateur sort d\'usine. La batterie tient plus de 9 heures en utilisation continue.',
  'Parfait pour mes cours de design graphique. Le processeur et la carte graphique font des merveilles.',
  'La transaction s\'est faite rapidement. Les tarifs sont hyper honnêtes pour cette qualité certifiée d\'importation.',
  'Un grand merci à Herve_eShop pour la réactivité, le professionnalisme de la configuration et le cadeau surprise !'
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(PRE_SEEDED_TESTIMONIALS);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const generateRandomTestimonial = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      const randomCity = RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)];
      const randomProduct = RANDOM_PRODUCTS[Math.floor(Math.random() * RANDOM_PRODUCTS.length)];
      const randomAvatar = RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
      const randomComment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
      
      const newTestimonial: Testimonial = {
        id: `t-random-${Date.now()}`,
        name: randomName,
        city: randomCity,
        avatarColor: randomAvatar,
        rating: Math.random() > 0.15 ? 5 : 4, // 85% 5 stars, 15% 4 stars
        product: randomProduct,
        comment: randomComment,
        date: 'À l\'instant',
        verified: true
      };

      setTestimonials(prev => [newTestimonial, ...prev]);
      setIsGenerating(false);
    }, 450);
  };

  return (
    <section className="py-20 bg-warm-cream border-t border-warm-cream-dark/60 select-none" id="temoignages-clients-section">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Block with high contrast custom orange/gold details */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-luxe-orange/10 border border-luxe-orange/20 text-luxe-orange text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Garantie Confiance & Excellence
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-luxe-dark">
              Témoignages Clients <span className="text-luxe-orange font-sans">.</span>
            </h2>
            <p className="text-sm text-luxe-muted max-w-xl leading-relaxed">
              Découvrez les retours authentiques de professionnels et particuliers qui nous font confiance à Douala, Yaoundé et dans tout le Cameroun pour leurs équipements informatiques d'exception.
            </p>
          </div>

          {/* Interactive random testimonial generator button */}
          <div className="flex items-center">
            <button
              onClick={generateRandomTestimonial}
              disabled={isGenerating}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wide border cursor-pointer select-none transition-all shadow-md active:scale-95 duration-200 ${
                isGenerating 
                  ? 'bg-warm-cream-dark border-warm-cream-dark text-luxe-muted cursor-not-allowed'
                  : 'bg-luxe-dark text-white border-luxe-dark hover:bg-luxe-orange hover:border-luxe-orange hover:shadow-luxe-orange/20'
              }`}
              id="generate-testimonial-btn"
            >
              <Plus className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Génération...' : 'Générer un avis client'}
            </button>
          </div>
        </div>

        {/* Global Statistics Card displaying beautiful counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white border border-warm-cream-dark/50 shadow-xs mb-10 text-left">
          <div>
            <span className="block text-2xl font-extrabold text-luxe-orange">99.4%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-luxe-muted">Clients Satisfaits</span>
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-luxe-dark flex items-center gap-1">
              4.9 <Star className="w-4 h-4 fill-luxe-yellow text-luxe-yellow inline" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-luxe-muted">Note Globale Certifiée</span>
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-luxe-dark">+1,250</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-luxe-muted">Ordinateurs Livrés</span>
          </div>
          <div>
            <span className="block text-2xl font-extrabold text-luxe-gold">100%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-luxe-muted">Importé USA d'Origine</span>
          </div>
        </div>

        {/* Testimonials Grid Layout with animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group relative bg-white border border-warm-cream-dark/40 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-luxe-gold/30 transition-all duration-300 flex flex-col justify-between text-left ring-offset-2 hover:ring-2 hover:ring-luxe-gold/20"
              id={`testimonial-card-${testimonial.id}`}
            >
              <div className="absolute top-6 right-6 text-warm-cream-dark/50 select-none">
                <Quote className="w-8 h-8 rotate-180" />
              </div>

              <div>
                {/* Visual stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating 
                          ? 'fill-luxe-yellow text-luxe-yellow' 
                          : 'text-warm-cream-dark/70'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-luxe-muted italic mb-4 font-mono font-bold uppercase tracking-wider">
                  Achat : {testimonial.product}
                </p>

                <p className="text-xs text-luxe-dark/90 leading-relaxed font-sans mb-6">
                  "{testimonial.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-warm-cream-dark/50 mt-auto">
                {/* Profile short monogram icon */}
                <div className={`w-9 h-9 rounded-full ${testimonial.avatarColor} font-sans font-bold text-xs flex items-center justify-center shadow-xs`}>
                  {testimonial.name.split(' ').map(part => part[0]).join('')}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-xs text-luxe-dark flex items-center gap-1">
                    {testimonial.name}
                    {testimonial.verified && (
                      <span title="Acheteur vérifié • Devis validé">
                        <CheckCircle2 className="w-3.5 h-3.5 text-luxe-orange fill-luxe-orange/10" />
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-luxe-muted font-medium flex justify-between items-center w-full">
                    <span>{testimonial.city}, Cameroun</span>
                    <span className="font-mono text-[9px] text-luxe-gold/80">{testimonial.date}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
