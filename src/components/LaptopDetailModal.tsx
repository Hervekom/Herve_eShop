import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckCircle, Star, Globe2, Share2, Heart, 
  Play, Pause, Volume2, VolumeX, RefreshCw, Cpu, 
  MessageSquare, ChevronLeft, ChevronRight, Send, AlertCircle
} from 'lucide-react';
import { Laptop } from '../types';

interface LaptopDetailModalProps {
  laptop: Laptop | null;
  isOpen: boolean;
  onClose: () => void;
  favouriteIds: string[];
  onToggleFavourite: (id: string) => void;
  onSelectLaptopForQuote: (laptop: Laptop) => void;
  onTriggerToast: (title: string, message: string, type?: string) => void;
  whatsAppPhone?: string;
}

interface ProductReview {
  id: string;
  author: string;
  city: string;
  rating: number;
  comment: string;
  date: string;
  badge: string;
}

// Model-specific media & reviews mapping
const LAPTOP_MEDIA_REVIEWS: Record<string, {
  images: string[];
  videoUrl: string;
  reviews: ProductReview[];
}> = {
  'macm3-01': {
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-laptop-42289-large.mp4',
    reviews: [
      {
        id: 'rev-m3-1',
        author: 'Arthur Tagne',
        city: 'Douala',
        rating: 5,
        comment: "Idéal pour mes gros rendus Xcode. La batterie dure une journée entière de code sans broncher. Superbe recommandation d'Hervé !",
        date: 'Il y a 3 jours',
        badge: 'Développeur iOS'
      },
      {
        id: 'rev-m3-2',
        author: 'Salomon Djibril',
        city: 'Yaoundé',
        rating: 5,
        comment: "Reçu dans sa boîte d'origine avec tous ses accessoires. Rien à redire, l'état Comme Neuf est scrupuleusement respecté.",
        date: 'Il y a 1 semaine',
        badge: 'Cadre Privé'
      },
      {
        id: 'rev-m3-3',
        author: 'Carine Moko',
        city: 'Kribi',
        rating: 5,
        comment: "Les 18 Go de RAM unifiée gèrent mon montage photo et vidéo 4K sans aucune saccade. Un investissement très rentable !",
        date: 'Il y a 2 semaines',
        badge: 'Artiste 3D'
      }
    ]
  },
  'xps15-02': {
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-designer-working-on-his-laptop-and-drawing-tablet-41860-large.mp4',
    reviews: [
      {
        id: 'rev-xps-1',
        author: 'Vanessa Ewonda',
        city: 'Douala',
        rating: 5,
        comment: "L'écran tactile OLED 3.5K est tout simplement fantastique. Je l'utilise pour le graphisme publicitaire, les couleurs sont d'une précision chirurgicale.",
        date: 'Il y a 2 jours',
        badge: 'Designer Graphique'
      },
      {
        id: 'rev-xps-2',
        author: 'Michel Tsafack',
        city: 'Bafoussam',
        rating: 5,
        comment: "Boîtier en carbone ultra robuste et élégant. Performance ultime. Service hyper réactif pour m'envoyer la facture certifié d'origine américaine.",
        date: 'Il y a 5 jours',
        badge: 'Architecte'
      }
    ]
  },
  't14-03': {
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-typing-on-his-laptop-in-an-office-space-41863-large.mp4',
    reviews: [
      {
        id: 'rev-t14-1',
        author: 'William Ndi',
        city: 'Bamenda',
        rating: 5,
        comment: "Clavier d'une souplesse inégalée. Le processeur Ryzen 7 est d'une stabilité incroyable sous Linux. Excellent choix pro.",
        date: 'Il y a 4 jours',
        badge: 'Admin Reseau'
      },
      {
        id: 'rev-t14-2',
        author: 'Martine Fouda',
        city: 'Yaoundé',
        rating: 5,
        comment: "Idéal pour mon cabinet d'audit à Yaoundé. Fin, sobre et d'une autonomie de batterie impressionnante. Hervé l'a livré en moins de 24 heures !",
        date: 'Il y a 10 jours',
        badge: 'Auditeur Principal'
      }
    ]
  },
  'elite-04': {
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-writing-on-laptop-with-a-coffee-cup-nearby-41851-large.mp4',
    reviews: [
      {
        id: 'rev-elite-1',
        author: 'Olivier Sali',
        city: 'Garoua',
        rating: 5,
        comment: "Châssis totalement en aluminium qui reste bien frais sous les fortes chaleurs du Nord. Idéal pour le travail de reportage sur le terrain.",
        date: 'Il y a 1 semaine',
        badge: 'Journaliste indépendant'
      },
      {
        id: 'rev-elite-2',
        author: 'Bernadette Noah',
        city: 'Yaoundé',
        rating: 4,
        comment: "Très léger pour mes déplacements réguliers à l'université. Bon son pour les visioconférences Zoom. Très bon rapport qualité-prix.",
        date: 'Il y a 2 semaines',
        badge: 'Étudiante Chercheuse'
      }
    ]
  },
  'rog-05': {
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-video-games-on-his-high-end-computer-41846-large.mp4',
    reviews: [
      {
        id: 'rev-rog-1',
        author: 'Didier Ndoumbe',
        city: 'Douala',
        rating: 5,
        comment: "La puce graphique RTX 4060 fait tourner tous mes outils d'intelligence artificielle et de calcul 3D à l'aise. L'écran 165Hz est magique.",
        date: 'Il y a 6 jours',
        badge: 'Ingénieur Data'
      },
      {
        id: 'rev-rog-2',
        author: 'Yannick Mbarga',
        city: 'Yaoundé',
        rating: 5,
        comment: "Excellent pour le gaming exigeant le week-end et la programmation en semaine. Hervé m'a gentiment offert un tapis de souris XXL. Trop sympa !",
        date: 'Il y a 3 semaines',
        badge: 'Game Developer'
      }
    ]
  },
  'macair-06': {
    images: [
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1000'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-open-laptop-with-colored-light-glows-41862-large.mp4',
    reviews: [
      {
        id: 'rev-air-1',
        author: 'Nadine Bikoy',
        city: 'Douala',
        rating: 5,
        comment: "Incroyablement léger ! Il se glisse dans mon sac à main sans encombre. Parfait pour prendre mes notes à l'université sans fatiguer.",
        date: 'Il y a 2 jours',
        badge: 'Étudiante Droit'
      },
      {
        id: 'rev-air-2',
        author: 'Patrick Kuate',
        city: 'Yaoundé',
        rating: 5,
        comment: "La conception sans ventilateur est un pur bonheur silencieux pour coder tard le soir. Reçu dans l'emballage sécurisé, batterie à 100% !",
        date: 'Il y a 12 jours',
        badge: 'Architecte Cloud'
      }
    ]
  }
};

export default function LaptopDetailModal({
  laptop,
  isOpen,
  onClose,
  favouriteIds,
  onToggleFavourite,
  onSelectLaptopForQuote,
  onTriggerToast,
  whatsAppPhone
}: LaptopDetailModalProps) {
  const resolvedWhatsAppPhone = String(whatsAppPhone || '237699001122').replace(/\D/g, '') || '237699001122';
  const [activeTab, setActiveTab] = useState<'gallery' | 'video' | 'reviews'>('gallery');
  const [selectedImgIndex, setSelectedImgIndex] = useState<number>(0);
  
  // Video player controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // New review state
  const [customReviews, setCustomReviews] = useState<Record<string, ProductReview[]>>({});
  const [newAuthor, setNewAuthor] = useState('');
  const [newCity, setNewCity] = useState('Douala');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Reset tab and image selection when modal changes laptop
  useEffect(() => {
    setActiveTab('gallery');
    setSelectedImgIndex(0);
    setIsPlaying(false);
    setVideoProgress(0);
    
    // Auto-play preview video when switching tabs (or pause)
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [laptop]);

  if (!laptop || !isOpen) return null;

  // Retrieve model information or fall back to defaults
  const details = LAPTOP_MEDIA_REVIEWS[laptop.id] || {
    images: [laptop.image],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-laptop-42289-large.mp4',
    reviews: [
      {
        id: `rev-fallback-${laptop.id}`,
        author: 'Stéphane Mbida',
        city: 'Yaoundé',
        rating: 5,
        comment: `Excellent ordinateur portable ${laptop.brand}. Très performant pour le prix. Tout à fait conforme aux conseils fournis par Hervé !`,
        date: 'Il y a quelques jours',
        badge: 'Professionnel'
      }
    ]
  };

  // Combine pre-seeded with custom user reviews
  const currentModelReviews = [...(customReviews[laptop.id] || []), ...details.reviews];

  // Video functionality
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.log("Playback blocked or failed", err);
        });
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setVideoProgress((current / duration) * 100);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const targetTime = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 1);
      videoRef.current.currentTime = targetTime;
      setVideoProgress(parseFloat(e.target.value));
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Submit dynamic review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) {
      onTriggerToast('Champs Requis ⚠️', 'Veuillez saisir votre nom et un avis honnête pour continuer.', 'error');
      return;
    }

    setIsSubmittingReview(true);

    setTimeout(() => {
      const newReview: ProductReview = {
        id: `custom-rev-${Date.now()}`,
        author: newAuthor,
        city: newCity,
        rating: newRating,
        comment: newComment,
        date: "À l'instant",
        badge: 'Acheteur Vérifié'
      };

      setCustomReviews(prev => ({
        ...prev,
        [laptop.id]: [newReview, ...(prev[laptop.id] || [])]
      }));

      // Cleanup
      setNewAuthor('');
      setNewComment('');
      setIsSubmittingReview(false);
      onTriggerToast('Merci ! ❤️', 'Votre avis a été ajouté avec succès et renforce notre communauté.', 'success');
    }, 600);
  };

  const isFav = favouriteIds.includes(laptop.id);
  const isOutOfStock = laptop.stockQuantity === 0 || laptop.status === 'Rupture';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-luxe-dark/80 backdrop-blur-md"
        />

        {/* Modal Main container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.45 }}
          className="relative w-full max-w-4xl bg-warm-cream border border-warm-cream-dark/65 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-none outline-none z-10"
          id="laptop-detail-modal"
        >
          {/* Top Close bar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-luxe-dark/10 hover:bg-luxe-dark text-luxe-dark hover:text-warm-cream transition-all duration-300 shadow-sm cursor-pointer select-none"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrolling Content Block */}
          <div className="overflow-y-auto w-full flex-1 md:grid md:grid-cols-12">
            
            {/* LEFT COLUMN: Visual Media (Images or Video player tab dependent) */}
            <div className="md:col-span-6 bg-white border-b md:border-b-0 md:border-r border-warm-cream-dark/50 p-6 flex flex-col justify-start">
              
              {/* Media Container Box */}
              <div className="relative aspect-[16/10] rounded-2xl bg-warm-cream/50 border border-warm-cream-dark/40 overflow-hidden flex items-center justify-center w-full min-h-[220px]">
                
                {activeTab === 'gallery' && (
                  <>
                    <img
                      src={details.images[selectedImgIndex]}
                      alt={`${laptop.brand} View`}
                      className="w-full h-full object-cover rounded-2xl animate-fade-in"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Navigation inside gallery images */}
                    {details.images.length > 1 && (
                      <div className="absolute inset-x-3 bottom-3 flex justify-between items-center z-10">
                        <button
                          onClick={() => setSelectedImgIndex(prev => (prev === 0 ? details.images.length - 1 : prev - 1))}
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-luxe-dark border border-warm-cream-dark/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all select-none cursor-pointer shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold font-mono bg-luxe-dark/80 text-white px-2.5 py-1 rounded-full">
                          {selectedImgIndex + 1} / {details.images.length}
                        </span>
                        <button
                          onClick={() => setSelectedImgIndex(prev => (prev === details.images.length - 1 ? 0 : prev + 1))}
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-luxe-dark border border-warm-cream-dark/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all select-none cursor-pointer shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'video' && (
                  <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-2xl">
                    <video
                      ref={videoRef}
                      src={details.videoUrl}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      className="w-full h-full object-cover"
                      loop
                      muted={isMuted}
                      playsInline
                    />

                    {/* Dark gradient shadow overlay for HUD controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-between p-4">
                      
                      {/* Top status indicator tag */}
                      <div className="flex justify-between items-center w-full">
                        <span className="inline-flex items-center gap-1.5 bg-luxe-orange text-white text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                          Vidéo Démo Live 📺
                        </span>
                        <span className="text-[9px] text-white/70 font-mono">
                          Importé d'une provenance certifiée ({laptop.source})
                        </span>
                      </div>

                      {/* Video Center Big Play controller */}
                      {!isPlaying && (
                        <button
                          onClick={handlePlayPause}
                          className="self-center w-12 h-12 rounded-full bg-luxe-orange text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer select-none shadow-md shadow-luxe-orange/40"
                          title="Lancer la démonstration"
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>
                      )}

                      {/* Bottom Playback HUD */}
                      <div className="space-y-2">
                        {/* Interactive seeker range */}
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={videoProgress}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-luxe-orange"
                            title="Progression"
                          />
                        </div>

                        {/* Control buttons line */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handlePlayPause}
                              className="text-white hover:text-luxe-orange transition-colors cursor-pointer select-none"
                              title={isPlaying ? "Mettre en pause" : "Lire"}
                            >
                              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            </button>
                            <button
                              onClick={restartVideo}
                              className="text-white/80 hover:text-white transition-colors cursor-pointer select-none"
                              title="Recommencer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-white/85 font-mono select-none">
                              {videoRef.current ? Math.floor(videoRef.current.currentTime) + 's' : '0s'} / {Math.floor(videoDuration) + 's'}
                            </span>
                          </div>

                          {/* Sound controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleMuteToggle}
                              className="text-white hover:text-luxe-orange transition-colors cursor-pointer select-none"
                              title={isMuted ? "Activer le son" : "Désactiver le son"}
                            >
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <span className="text-[9px] text-white/60 font-mono tracking-wider uppercase">
                              {isMuted ? 'MUTE' : 'AUDIO LOUDR'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="w-full h-full bg-luxe-dark text-white rounded-2xl flex flex-col justify-center items-center p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-luxe-gold mb-2" />
                    <h5 className="font-serif text-sm font-bold text-warm-cream">Avis Globaux du Modèle</h5>
                    <div className="flex items-center gap-1 text-luxe-yellow my-2">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-xs text-white/90 font-mono ml-2 font-bold">4.9 / 5</span>
                    </div>
                    <p className="text-[11px] text-warm-cream-dark/60 max-w-xs leading-relaxed">
                      Chaque avis provient d'un client camerounais vérifié par nos équipes de Douala & Yaoundé.
                    </p>
                    <div className="mt-4 text-[10px] uppercase font-bold tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15">
                      {currentModelReviews.length} témoignages archivés
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails line for gallery view */}
              {activeTab === 'gallery' && details.images.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {details.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`relative w-12 h-10 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        selectedImgIndex === idx 
                          ? 'border-luxe-orange ring-2 ring-luxe-orange/15 shadow-sm scale-102' 
                          : 'border-warm-cream-dark/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail view" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Specs Highlight Panel */}
              <div className="mt-5 p-4 rounded-xl bg-warm-cream border border-warm-cream-dark/50 text-left">
                <h5 className="text-[11px] uppercase tracking-wider font-extrabold text-luxe-orange mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Fiche d'Origine Certifiée
                </h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[9px] text-luxe-muted uppercase">RAM d'origine</span>
                    <span className="font-bold text-luxe-dark font-mono">{laptop.ram}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-luxe-muted uppercase">Disque de stockage</span>
                    <span className="font-bold text-luxe-dark font-mono">{laptop.storage}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-luxe-muted uppercase">Pays d'Import</span>
                    <span className="font-bold text-luxe-dark flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5 text-luxe-copper" /> {laptop.source === 'USA' ? 'États-Unis 🇺🇸' : laptop.source === 'Europe' ? 'Europe 🇪🇺' : 'Asie 🇦🇸'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-luxe-muted uppercase">État de Seconemain</span>
                    <span className="font-black text-luxe-dark uppercase text-[10px] bg-white border border-warm-cream-dark px-1.5 py-0.5 rounded-md inline-block">
                      {laptop.condition}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Interaction Details with active dynamic Tab Content */}
            <div className="md:col-span-6 p-6 flex flex-col justify-between bg-warm-cream">
              
              <div>
                {/* Visual Header / Brand detail */}
                <div className="border-b border-warm-cream-dark/50 pb-4 text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] text-luxe-orange font-extrabold uppercase tracking-widest">{laptop.brand} Prestige</span>
                      <h3 className="font-serif text-xl sm:text-2xl font-black text-luxe-dark leading-tight mt-0.5">
                        {laptop.brand} {laptop.model}
                      </h3>
                    </div>
                    
                    {/* Action buttons Favorite/Share */}
                    <div className="flex gap-1.5 select-none shrink-0">
                      <button
                        onClick={() => onToggleFavourite(laptop.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border cursor-pointer select-none ${
                          isFav 
                            ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-300' 
                            : 'bg-white text-luxe-muted border-warm-cream-dark/50 hover:text-rose-500'
                        }`}
                        title={isFav ? "Retirer de vos favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Status Indicator Bar */}
                  <div className="flex items-center gap-4 mt-2 select-none">
                    {isOutOfStock ? (
                      <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        ● Rupture de stock
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        ● Disponible de suite ({laptop.stockQuantity} unités)
                      </span>
                    )}
                    <span className="text-[10px] text-luxe-muted font-medium font-mono">
                      Code : {laptop.id.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* TAB SELECTOR HEADER BAR (ORANGE HIGHLIGHTED) */}
                <div className="flex border-b border-warm-cream-dark/50 mt-4 mb-4 select-none">
                  {[
                    { id: 'gallery', label: 'Images d\'Illustration' },
                    { id: 'video', label: 'Démonstration Vidéo' },
                    { id: 'reviews', label: 'Avis Clients (' + currentModelReviews.length + ')' }
                  ].map((tab) => {
                    const idxActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          if (tab.id !== 'video' && videoRef.current) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                          }
                        }}
                        className={`flex-1 text-center py-2.5 text-[11px] font-bold tracking-wide transition-all border-b-2 cursor-pointer select-none ${
                          idxActive 
                            ? 'border-luxe-orange text-luxe-orange bg-luxe-orange/5 font-extrabold scale-102' 
                            : 'border-transparent text-luxe-muted hover:text-luxe-dark hover:border-warm-cream-dark/70'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB DEPENDENT CONTENT PANELS */}
                <div className="min-h-[220px] max-h-[340px] overflow-y-auto pr-1">
                  
                  {activeTab === 'gallery' && (
                    <div className="text-left space-y-4">
                      <div className="bg-white/80 p-4 rounded-xl border border-warm-cream-dark/40 space-y-2">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-luxe-orange">Pourquoi cette machine ?</span>
                        <p className="text-xs text-luxe-dark leading-relaxed">
                          « {laptop.description} »
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <h4 className="font-bold text-luxe-dark uppercase tracking-wider text-[10px] text-luxe-muted">Détails techniques additionnels :</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-warm-cream-dark/30">
                            <CheckCircle className="w-4 h-4 text-luxe-orange shrink-0" />
                            <span><strong>Processeur :</strong> {laptop.processor} d'origine américaine certifiée.</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-warm-cream-dark/30">
                            <CheckCircle className="w-4 h-4 text-luxe-orange shrink-0" />
                            <span><strong>Écran :</strong> {laptop.screenSize} IPS / Retina sans reflet pour un confort de lecture ultime.</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-warm-cream-dark/30">
                            <CheckCircle className="w-4 h-4 text-luxe-orange shrink-0" />
                            <span><strong>Châssis :</strong> Seconde main d'exception importée (Zéro choc matériel ou interne).</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'video' && (
                    <div className="text-left space-y-3 p-2">
                      <div className="bg-luxe-orange/10 p-3.5 rounded-xl border border-luxe-orange/20 text-luxe-orange flex gap-3.5 items-start">
                        <Play className="w-5 h-5 fill-current shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wide">Lancez la vidéo de test à gauche !</h5>
                          <p className="text-xs text-luxe-dark mt-1 leading-relaxed">
                            Cette vidéo montre l'authenticité de l'ordinateur en action. Nous garantissons la conformité absolue de chaque touche physique, de l'écran, et de l'aspect esthétique soigné de la bécane.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-warm-cream-dark/40 space-y-2">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-luxe-muted">Charte Qualité Vidéo</span>
                        <p className="text-xs text-luxe-muted leading-relaxed">
                          La netteté d'utilisation est validée en showroom avant livraison à Douala Akwa ou Yaoundé. Demandez une vidéo WhatsApp personnalisée en cliquant sur notre bouton vert flottant !
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4">
                      {/* Avis List */}
                      <div className="space-y-3">
                        {currentModelReviews.map((rev) => (
                          <div key={rev.id} className="bg-white p-4 rounded-xl border border-warm-cream-dark/40 text-left space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-luxe-dark">{rev.author}</span>
                                <span className="text-[9px] bg-warm-cream border border-warm-cream-dark px-1.5 py-0.5 rounded-md text-luxe-muted font-bold">
                                  {rev.badge}
                                </span>
                              </div>
                              <div className="flex items-center text-luxe-yellow">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-neutral-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-luxe-dark leading-relaxed italic">
                              "{rev.comment}"
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-luxe-muted font-medium font-mono pt-1 border-t border-dashed border-warm-cream-dark/20">
                              <span>Achat validé à {rev.city} 🇨🇲</span>
                              <span>{rev.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Interactive form to add a review */}
                      <form onSubmit={handleAddReview} className="p-4 bg-white/70 border border-warm-cream-dark rounded-xl space-y-3 text-left">
                        <h5 className="text-[11px] uppercase tracking-wider font-black text-luxe-orange flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> Laissez un Avis Vérifié
                        </h5>
                        <p className="text-[10px] text-luxe-muted">Votre expérience de devis ou d'achat aide la communauté !</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Votre Prénom & Nom"
                            value={newAuthor}
                            onChange={(e) => setNewAuthor(e.target.value)}
                            className="bg-white border text-xs border-warm-cream-dark rounded-lg px-2.5 py-1.5 text-luxe-dark focus:outline-none focus:border-luxe-orange"
                            required
                          />
                          <select
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            className="bg-white border text-xs border-warm-cream-dark rounded-lg px-2.5 py-1.5 text-luxe-dark focus:outline-none focus:border-luxe-orange"
                          >
                            <option value="Douala">Douala</option>
                            <option value="Yaoundé">Yaoundé</option>
                            <option value="Bafoussam">Bafoussam</option>
                            <option value="Kribi">Kribi</option>
                            <option value="Garoua">Garoua</option>
                            <option value="Limbe">Limbe</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-luxe-muted">Note Étoilée :</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() => setNewRating(star)}
                                className="text-luxe-yellow hover:scale-115 transition-transform"
                                title={`${star} étoiles`}
                              >
                                <Star className={`w-4 h-4 ${star <= newRating ? 'fill-current' : 'text-neutral-200'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          placeholder="Exprimez votre satisfaction (état de la machine, livraison, réactivité d'Hervé...)"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full bg-white border text-xs border-warm-cream-dark rounded-lg p-2.5 text-luxe-dark focus:outline-none focus:border-luxe-orange min-h-[60px]"
                          required
                        />

                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-luxe-dark text-white hover:bg-luxe-orange transition-colors py-2 rounded-lg text-xs font-bold uppercase tracking-wider select-none cursor-pointer"
                        >
                          {isSubmittingReview ? 'Publication...' : 'Publier mon avis certifié'}
                        </button>
                      </form>

                    </div>
                  )}

                </div>
              </div>

              {/* Call To Action & Pricing Footer Row */}
              <div className="mt-6 pt-5 border-t border-warm-cream-dark/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-left select-none">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-luxe-muted">Tarif Indicatif d'Importation</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5 text-luxe-dark">
                    <span className="text-xl sm:text-2xl font-serif font-black text-luxe-dark">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
                        .format(laptop.price)
                        .replace('XAF', 'FCFA')}
                    </span>
                    <span className="text-[10px] text-luxe-orange font-bold uppercase tracking-wider bg-luxe-orange/10 px-2 py-0.5 rounded-md">
                      Prix Ferme
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {isOutOfStock ? (
                    <div className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed select-none">
                      Rupture de Stock
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  ) : (
                    <a
                      href={`https://wa.me/${resolvedWhatsAppPhone}?text=${encodeURIComponent(
                        `Bonjour Herve_eShop, je m'intéresse à l'ordinateur portable d'exception : *${laptop.brand} ${laptop.model}* (${laptop.ram} RAM, ${laptop.storage} SSD de seconde main certifiée). Est-il disponible de suite ?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-luxe-dark text-white border border-luxe-dark hover:bg-luxe-orange hover:border-luxe-orange shadow-md active:scale-95 duration-200 cursor-pointer text-center"
                    >
                      Contacter Hervé
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
