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
  createdAt: string;
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
    createdAt: '2026-09-26T09:00:00.000Z',
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
    createdAt: '2026-09-22T09:00:00.000Z',
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
    createdAt: '2026-09-15T09:00:00.000Z',
    verified: true
  }
];

const RANDOM_AVATARS = [
  'bg-emerald-600 text-white', 'bg-blue-600 text-white', 'bg-amber-500 text-white',
  'bg-indigo-600 text-white', 'bg-rose-500 text-white', 'bg-teal-600 text-white',
  'bg-luxe-copper text-white', 'bg-luxe-gold text-luxe-dark'
];

const getReviewTimestamp = (value: unknown) => {
  const parsed = Date.parse(String(value || '').trim());
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatReviewDate = (value: unknown) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const timestamp = getReviewTimestamp(raw);
  if (!timestamp) return raw;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(timestamp));
};

const sortTestimonialsByNewest = (items: Testimonial[]) =>
  [...items].sort((a, b) => getReviewTimestamp(b.createdAt) - getReviewTimestamp(a.createdAt));

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
          date: formatReviewDate(r.createdAt || r.date || ''),
          createdAt: String(r.createdAt || r.date || ''),
          verified: true,
        }));
        if (!cancelled && mapped.length) setTestimonials(sortTestimonialsByNewest(mapped));
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
        date: formatReviewDate(r.createdAt || r.date || ''),
        createdAt: String(r.createdAt || r.date || ''),
        verified: true,
      }));
      if (mapped.length) setTestimonials(sortTestimonialsByNewest(mapped));
    } catch (err) {
      onTriggerToast('Erreur avis', (err as Error).message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-14 md:py-20 bg-warm-cream border-t border-warm-cream-dark/60 select-none overflow-hidden" id="temoignages-clients-section">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Block with high contrast custom orange/gold details */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-luxe-orange/10 border border-luxe-orange/20 text-luxe-orange type-badge">
              <Sparkles className="w-3.5 h-3.5" />
              Garantie Confiance & Excellence
            </div>
            <h2 className="type-section-title text-luxe-dark">
              Témoignages Clients
            </h2>
            <p className="type-subtitle text-luxe-muted max-w-xl">
              Découvrez les retours authentiques de professionnels et particuliers qui nous font confiance à Douala, Yaoundé et dans tout le Cameroun pour leurs équipements informatiques d'exception.
            </p>
          </div>

          {/* Service review button */}
          <div className="flex items-center w-full md:w-auto">
            <button
              onClick={openForm}
              disabled={submitting}
              className={`type-button inline-flex w-full md:w-auto items-center justify-center gap-2 px-5 py-3 rounded-xl border cursor-pointer select-none transition-all shadow-md active:scale-95 duration-200 ${
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

        {loading && (
          <div className="type-badge text-luxe-muted font-mono mb-6">
            Chargement des avis...
          </div>
        )}

        <div className="rounded-[1.75rem] border border-warm-cream-dark/60 bg-white/72 p-3 sm:p-4 md:p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="type-meta text-luxe-muted">
              Les avis les plus récents apparaissent en premier.
            </p>
            <span className="hidden sm:inline type-badge text-luxe-copper">
              {testimonials.length} avis
            </span>
          </div>

          <div className="max-h-[22rem] overflow-y-auto overscroll-contain pr-1 sm:max-h-[25rem] md:max-h-[27rem] md:pr-2">
            {testimonials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-warm-cream-dark/70 bg-white px-5 py-10 text-center">
                <p className="type-card-title text-luxe-dark">Aucun avis publié pour le moment</p>
                <p className="type-meta mt-2 text-luxe-muted">
                  Les prochains retours clients apparaitront ici sans agrandir la homepage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="group relative bg-white border border-warm-cream-dark/40 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-luxe-gold/30 transition-all duration-300 flex flex-col justify-between text-left ring-offset-2 hover:ring-2 hover:ring-luxe-gold/20 min-w-0"
                    id={`testimonial-card-${testimonial.id}`}
                  >
                    <div className="absolute top-5 right-5 text-warm-cream-dark/50 select-none">
                      <Quote className="w-7 h-7 rotate-180" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-3">
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

                      <p className="type-badge text-luxe-muted mb-3 font-mono">
                        Achat : {testimonial.product}
                      </p>

                      <p className="type-body text-luxe-dark/90 mb-5 break-words">
                        "{testimonial.comment}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-warm-cream-dark/50 mt-auto">
                      <div className={`w-9 h-9 rounded-full ${testimonial.avatarColor} font-sans font-bold text-xs flex items-center justify-center shadow-xs`}>
                        {testimonial.name.split(' ').map(part => part[0]).join('')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="type-card-title text-luxe-dark flex items-center gap-1">
                          {testimonial.name}
                          {testimonial.verified && (
                            <span title="Acheteur vérifié • Devis validé">
                              <CheckCircle2 className="w-3.5 h-3.5 text-luxe-orange fill-luxe-orange/10" />
                            </span>
                          )}
                        </h4>
                        <p className="type-meta text-luxe-muted flex justify-between items-center gap-3 w-full">
                          <span className="min-w-0 break-words">{testimonial.city}, Cameroun</span>
                          <span className="font-mono text-[0.7rem] text-luxe-gold/80 whitespace-nowrap">{testimonial.date}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-warm-cream-dark shadow-2xl p-5 text-left select-text">
            <div className="flex justify-between items-center border-b border-warm-cream pb-3 mb-4">
              <h4 className="type-card-title text-luxe-dark">Laisser un avis sur le service</h4>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-luxe-muted hover:text-black text-lg font-bold"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="field-label text-luxe-dark">Note</label>
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
                <label className="field-label text-luxe-dark">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="field-input w-full p-3 rounded-xl border border-warm-cream"
                  placeholder="Douala, Yaoundé..."
                />
              </div>

              <div className="space-y-1">
                <label className="field-label text-luxe-dark">Votre avis</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="field-input w-full p-3 rounded-xl border border-warm-cream"
                  placeholder="Parlez du service reçu..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-cream pt-3.5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="type-button px-4 py-2 border border-grey rounded-xl"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitServiceReview}
                  disabled={submitting}
                  className="type-button px-5 py-2 bg-luxe-copper hover:bg-luxe-dark text-white rounded-xl disabled:opacity-60"
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
