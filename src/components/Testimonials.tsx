import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, Quote, Sparkles, MessageSquare, X } from 'lucide-react';
import API, { getCachedGuestUser, getGuestToken } from '../lib/api';

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

const RANDOM_AVATARS = [
  'bg-emerald-600 text-white', 'bg-blue-600 text-white', 'bg-amber-500 text-white',
  'bg-indigo-600 text-white', 'bg-rose-500 text-white', 'bg-teal-600 text-white',
  'bg-luxe-copper text-white', 'bg-luxe-gold text-luxe-dark'
];

export default function Testimonials({
  onRequireLogin,
  onTriggerToast,
}: {
  onRequireLogin: () => void;
  onTriggerToast: (title: string, message: string, type?: string) => void;
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(PRE_SEEDED_TESTIMONIALS);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.getProductReviews('service');
        const reviews = Array.isArray(res?.reviews) ? res.reviews : [];
        const mapped: Testimonial[] = reviews.map((r: any) => ({
          id: String(r.id),
          name: String(r.author || 'Client'),
          city: String(r.city || '—'),
          avatarColor: RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)],
          rating: Math.min(5, Math.max(1, Number(r.rating || 5))),
          product: 'Service Herve_eShop',
          comment: String(r.comment || ''),
          date: String(r.date || ''),
          verified: true,
        }));
        if (!cancelled && mapped.length) setTestimonials(mapped);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openForm = () => {
    if (!getGuestToken()) {
      onTriggerToast('Connexion requise', 'Connectez-vous pour laisser un avis sur le service.', 'info');
      onRequireLogin();
      return;
    }
    const user = getCachedGuestUser();
    setCity(String(user?.city || '').trim());
    setRating(5);
    setComment('');
    setFormOpen(true);
  };

  const submitServiceReview = async () => {
    const trimmed = String(comment || '').trim();
    if (!trimmed) {
      onTriggerToast('Avis incomplet', 'Veuillez écrire votre avis.', 'danger');
      return;
    }
    try {
      setSubmitting(true);
      await API.createProductReview({
        productId: 'service',
        rating,
        comment: trimmed,
        city: String(city || '').trim(),
      });
      onTriggerToast('Merci !', 'Votre avis a été publié.', 'success');
      setFormOpen(false);
      setComment('');

      const res = await API.getProductReviews('service');
      const reviews = Array.isArray(res?.reviews) ? res.reviews : [];
      const mapped: Testimonial[] = reviews.map((r: any) => ({
        id: String(r.id),
        name: String(r.author || 'Client'),
        city: String(r.city || '—'),
        avatarColor: RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)],
        rating: Math.min(5, Math.max(1, Number(r.rating || 5))),
        product: 'Service Herve_eShop',
        comment: String(r.comment || ''),
        date: String(r.date || ''),
        verified: true,
      }));
      if (mapped.length) setTestimonials(mapped);
    } catch (err) {
      onTriggerToast('Erreur avis', (err as Error).message, 'danger');
    } finally {
      setSubmitting(false);
    }
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

          {/* Service review button */}
          <div className="flex items-center">
            <button
              onClick={openForm}
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wide border cursor-pointer select-none transition-all shadow-md active:scale-95 duration-200 ${
                submitting
                  ? 'bg-warm-cream-dark border-warm-cream-dark text-luxe-muted cursor-not-allowed'
                  : 'bg-luxe-dark text-white border-luxe-dark hover:bg-luxe-orange hover:border-luxe-orange hover:shadow-luxe-orange/20'
              }`}
              id="leave-service-review-btn"
            >
              <MessageSquare className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
              Laisser un avis sur le service
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

        {loading && (
          <div className="text-xs text-luxe-muted font-mono uppercase tracking-widest font-bold mb-6">
            Chargement des avis...
          </div>
        )}

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

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-warm-cream-dark shadow-2xl p-5 text-left select-text">
            <div className="flex justify-between items-center border-b border-warm-cream pb-3 mb-4">
              <h4 className="font-serif font-bold text-sm text-luxe-dark">Laisser un avis sur le service</h4>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-luxe-muted hover:text-black font-serif text-lg font-bold"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-luxe-dark">Note</label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const v = i + 1;
                    const active = v <= rating;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRating(v)}
                        className="p-1"
                        title={`${v}/5`}
                      >
                        <Star className={`w-5 h-5 ${active ? 'fill-luxe-yellow text-luxe-yellow' : 'text-warm-cream-dark/70'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-luxe-dark">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 rounded-xl border border-warm-cream font-mono text-[11px]"
                  placeholder="Douala, Yaoundé..."
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-luxe-dark">Votre avis</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 rounded-xl border border-warm-cream text-xs"
                  placeholder="Parlez du service reçu..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-cream pt-3.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-3.5 py-1.5 border border-grey rounded-xl font-bold font-sans"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitServiceReview}
                  disabled={submitting}
                  className="px-4.5 py-1.5 bg-luxe-copper hover:bg-luxe-dark text-white rounded-xl font-bold font-sans disabled:opacity-60"
                >
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
