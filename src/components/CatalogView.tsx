import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, Globe2, CheckCircle, ArrowUpDown, ChevronRight, Heart, ShoppingCart, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Laptop, SourceCountry, LaptopStatus } from '../types';

interface CatalogViewProps {
  laptops: Laptop[];
  onSelectLaptopForQuote: (laptop: Laptop) => void;
  onSelectLaptopForDetails: (laptop: Laptop) => void;
  onAddToCart: (laptop: Laptop) => void;
  searchValue: string;
  favouriteIds: string[];
  onToggleFavourite: (id: string) => void;
  onTriggerToast: (title: string, message: string, type?: string) => void;
  cms?: any;
}

type CmsBannerRecord = {
  id: string;
  type?: string;
  status?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  mobileImage?: string;
  logo?: string;
  link?: string;
  ctaText?: string;
  advertiserName?: string;
  startDate?: string;
  endDate?: string;
  priority?: number | string;
  targetType?: string;
  trackingCode?: string;
  imageFit?: string;
  imagePosition?: string;
};

type BasePromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  mobileImage?: string;
  ctaText: string;
  badge: string;
  meta: string[];
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
};

type PromoSlide =
  | (BasePromoSlide & {
      kind: 'advertisement';
      image: string;
      logo?: string;
      ctaUrl: string;
      advertiserName: string;
      priority: number;
      targetType: string;
      trackingCode?: string;
    })
  | (BasePromoSlide & {
      kind: 'product';
      image: string;
      price: number;
      product: Laptop;
    })
  | (BasePromoSlide & {
      kind: 'editorial';
      ctaUrl: string;
    });

type PromoImageOrientation = 'panorama' | 'landscape' | 'square' | 'portrait' | 'tall-portrait';

type PromoImageMetrics = {
  width: number;
  height: number;
  ratio: number;
  orientation: PromoImageOrientation;
};

const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1400';

const hasText = (value: unknown) => Boolean(String(value ?? '').trim());

const toValidDate = (value: unknown) => {
  if (!hasText(value)) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getBannerPriority = (banner: CmsBannerRecord) => {
  const raw = Number(banner.priority);
  return Number.isFinite(raw) ? raw : 999;
};

const normalizeImageFit = (value: unknown): 'cover' | 'contain' | undefined => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'contain') return 'contain';
  if (normalized === 'cover') return 'cover';
  return undefined;
};

const normalizeImagePosition = (value: unknown) => {
  const normalized = String(value || '').trim();
  return normalized || undefined;
};

const truncateText = (value: unknown, maxLength: number) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

const buildPromoImageMetrics = (width: number, height: number): PromoImageMetrics => {
  const safeWidth = Math.max(1, Number(width || 1));
  const safeHeight = Math.max(1, Number(height || 1));
  const ratio = safeWidth / safeHeight;
  let orientation: PromoImageOrientation = 'square';

  if (ratio >= 2.15) orientation = 'panorama';
  else if (ratio > 1.12) orientation = 'landscape';
  else if (ratio >= 0.88) orientation = 'square';
  else if (ratio >= 0.62) orientation = 'portrait';
  else orientation = 'tall-portrait';

  return {
    width: safeWidth,
    height: safeHeight,
    ratio,
    orientation,
  };
};

const getFallbackPromoMetrics = (slide?: PromoSlide) => {
  if (!slide) return buildPromoImageMetrics(1600, 760);
  if (slide.kind === 'product') return buildPromoImageMetrics(1080, 1080);
  if (slide.kind === 'advertisement') return buildPromoImageMetrics(1600, 720);
  return buildPromoImageMetrics(1600, 820);
};

const getPromoImageFramePreset = (metrics: PromoImageMetrics, viewportWidth: number) => {
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;

  if (isMobile) {
    switch (metrics.orientation) {
      case 'panorama':
        return { widthPercent: 100, maxHeight: 210, minHeight: 160 };
      case 'landscape':
        return { widthPercent: 100, maxHeight: 250, minHeight: 180 };
      case 'square':
        return { widthPercent: 100, maxHeight: 290, minHeight: 220 };
      case 'portrait':
        return { widthPercent: 82, maxHeight: 360, minHeight: 280 };
      default:
        return { widthPercent: 72, maxHeight: 400, minHeight: 300 };
    }
  }

  if (isTablet) {
    switch (metrics.orientation) {
      case 'panorama':
        return { widthPercent: 100, maxHeight: 250, minHeight: 170 };
      case 'landscape':
        return { widthPercent: 100, maxHeight: 300, minHeight: 210 };
      case 'square':
        return { widthPercent: 76, maxHeight: 340, minHeight: 260 };
      case 'portrait':
        return { widthPercent: 58, maxHeight: 410, minHeight: 300 };
      default:
        return { widthPercent: 50, maxHeight: 430, minHeight: 320 };
    }
  }

  switch (metrics.orientation) {
    case 'panorama':
      return { widthPercent: 100, maxHeight: 285, minHeight: 175 };
    case 'landscape':
      return { widthPercent: 96, maxHeight: 335, minHeight: 215 };
    case 'square':
      return { widthPercent: 72, maxHeight: 360, minHeight: 260 };
    case 'portrait':
      return { widthPercent: 54, maxHeight: 445, minHeight: 320 };
    default:
      return { widthPercent: 48, maxHeight: 470, minHeight: 340 };
  }
};

const isScheduledBannerActive = (banner: CmsBannerRecord, now: Date) => {
  if (String(banner.status || '').trim() !== 'Actif') return false;
  const start = toValidDate(banner.startDate);
  const end = toValidDate(banner.endDate);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

export default function CatalogView({
  laptops,
  onSelectLaptopForQuote,
  onSelectLaptopForDetails,
  onAddToCart,
  searchValue,
  favouriteIds,
  onToggleFavourite,
  onTriggerToast,
  cms
}: CatalogViewProps) {
  const siteCMS = cms?.siteCMS || {};
  const heroTitle = siteCMS.heroTitle || 'Excellence';
  const heroSubtitle = siteCMS.heroSubtitle || "Découvrez le summum des ordinateurs portables de seconde main premium.";
  const cmsBanners: CmsBannerRecord[] = Array.isArray(cms?.banners) ? cms.banners : [];
  const now = new Date();
  const activeAdvertisementCandidates = cmsBanners
    .filter((banner) => String(banner?.type || '').trim() === 'Advertisement Banner')
    .filter((banner) => isScheduledBannerActive(banner, now))
    .sort((a, b) => {
      const priorityDiff = getBannerPriority(a) - getBannerPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      const aStart = toValidDate(a.startDate)?.getTime() || 0;
      const bStart = toValidDate(b.startDate)?.getTime() || 0;
      return bStart - aStart;
    });
  const highestPriority = activeAdvertisementCandidates[0] ? getBannerPriority(activeAdvertisementCandidates[0]) : null;
  const activeAdvertisements = highestPriority === null
    ? []
    : activeAdvertisementCandidates.filter((banner) => getBannerPriority(banner) === highestPriority);
  const homepageBanners = cmsBanners.filter(
    (banner) => String(banner?.type || '').trim() === 'Homepage Banner' && isScheduledBannerActive(banner, now),
  );

  // Filters state
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('default');
  const [showOnlyFavourites, setShowOnlyFavourites] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [isPromoPaused, setIsPromoPaused] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  );
  const [failedAssetUrls, setFailedAssetUrls] = useState<Record<string, boolean>>({});
  const [promoImageMetricsByUrl, setPromoImageMetricsByUrl] = useState<Record<string, PromoImageMetrics>>({});
  const resumeRotationTimeoutRef = useRef<number | null>(null);
  const isMobileViewport = viewportWidth < 768;

  // Auto-scroll to shared laptop card on mount if ?laptop=ID exists in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const laptopId = params.get('laptop');
    if (laptopId) {
      setTimeout(() => {
        const element = document.getElementById(`laptop-card-${laptopId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add temporary emphasis highlight matching clean minimalism
          element.classList.add('ring-2', 'ring-luxe-gold', 'scale-[1.01]', 'shadow-2xl');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-luxe-gold', 'scale-[1.01]', 'shadow-2xl');
          }, 3500);
        }
      }, 600);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleShare = (laptop: Laptop) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?laptop=${laptop.id}#laptop-card-${laptop.id}`;
    
    const copyText = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful ? Promise.resolve() : Promise.reject(new Error("document.execCommand failed"));
        } catch (err) {
          document.body.removeChild(textArea);
          return Promise.reject(err);
        }
      }
    };

    copyText()
      .then(() => {
        onTriggerToast(
          'Lien Copié! 🔗',
          `Le lien direct vers le ${laptop.brand} ${laptop.model} a été sauvegardé dans le presse-papiers. Prêt à partager !`
        );
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        onTriggerToast(
          'Lien de l\'article 🔗',
          `Copiez ce lien : ${shareUrl}`
        );
      });
  };

  // Extract unique brands for filtering
  const brands = ['All', ...Array.from(new Set(laptops.map(l => l.brand)))];
  const productCategories = ['All', ...Array.from(new Set(laptops.map(l => l.category).filter(Boolean)))];
  const categoryIcons: Record<string, string> = {
    All: 'All',
    Laptop: 'Laptop',
    Telephone: 'Phone',
    Accessoire: 'Accessory',
    Gadget: 'Gadget',
  };

  // Apply filters
  const filteredLaptops = laptops.filter(laptop => {
    const matchesSearch = 
      laptop.brand.toLowerCase().includes(searchValue.toLowerCase()) ||
      laptop.model.toLowerCase().includes(searchValue.toLowerCase()) ||
      laptop.processor.toLowerCase().includes(searchValue.toLowerCase()) ||
      laptop.description.toLowerCase().includes(searchValue.toLowerCase());
      
    const matchesBrand = selectedBrand === 'All' || laptop.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'All' || laptop.category === selectedCategory;
    const matchesSource = selectedSource === 'All' || laptop.source === selectedSource;
    const matchesStatus = selectedStatus === 'All' || laptop.status === selectedStatus;
    const matchesFavourites = !showOnlyFavourites || favouriteIds.includes(laptop.id);
    const matchesPrice = laptop.price >= minPrice && laptop.price <= maxPrice;

    return matchesSearch && matchesBrand && matchesCategory && matchesSource && matchesStatus && matchesFavourites && matchesPrice;
  });

  // Sort laptops
  const sortedLaptops = [...filteredLaptops].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'stock-desc') return b.stockQuantity - a.stockQuantity;
    return 0; // default order
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('FCFA', 'FCFA')
      .replace('XAF', 'FCFA');
  };

  const eligiblePromotedProducts = [...laptops]
    .filter((laptop) => hasText(laptop.image))
    .filter((laptop) => hasText(laptop.brand) && hasText(laptop.model))
    .filter((laptop) => laptop.stockQuantity > 0 || laptop.status === 'Arrivage imminent')
    .sort((a, b) => {
      const getScore = (item: Laptop) =>
        (item.isFeatured ? 4 : 0) +
        (item.isRecommended ? 3 : 0) +
        (item.isPopular ? 2 : 0) +
        (item.status === 'Disponible' ? 1 : 0);
      const scoreDiff = getScore(b) - getScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return b.stockQuantity - a.stockQuantity;
    })
    .slice(0, 8);

  const advertisementSlides: PromoSlide[] = activeAdvertisements.map((banner) => ({
    id: String(banner.id),
    kind: 'advertisement',
    title: String(banner.title || banner.advertiserName || 'Promotion partenaire').trim(),
    subtitle: String(banner.subtitle || banner.advertiserName || 'Campagne sponsorisée').trim(),
    description: String(banner.description || banner.subtitle || '').trim(),
    image: String(banner.image || '').trim(),
    mobileImage: String(banner.mobileImage || '').trim() || undefined,
    logo: String(banner.logo || '').trim() || undefined,
    ctaText: String(banner.ctaText || 'Découvrir l’offre').trim(),
    ctaUrl: String(banner.link || '').trim(),
    badge: 'Campagne sponsorisée',
    advertiserName: String(banner.advertiserName || 'Partenaire').trim(),
    priority: getBannerPriority(banner),
    targetType: String(banner.targetType || 'external').trim(),
    trackingCode: String(banner.trackingCode || '').trim() || undefined,
    imageFit: normalizeImageFit(banner.imageFit) || 'cover',
    imagePosition: normalizeImagePosition(banner.imagePosition) || 'center center',
    meta: [
      `Priorité ${getBannerPriority(banner)}`,
      toValidDate(banner.endDate) ? `Jusqu'au ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(toValidDate(banner.endDate) as Date)}` : 'Sans date de fin',
    ],
  }));

  const productSlides: PromoSlide[] = eligiblePromotedProducts.map((laptop) => ({
    id: String(laptop.id),
    kind: 'product',
    title: `${laptop.brand} ${laptop.model}`.trim(),
    subtitle: laptop.shortDescription || `${laptop.processor} • ${laptop.ram} • ${laptop.storage}`,
    description: laptop.description || `Configuration ${laptop.status.toLowerCase()} pour étudiants, créatifs et professionnels.`,
    image: String(laptop.image || '').trim(),
    ctaText: laptop.status === 'Arrivage imminent' ? 'Réserver maintenant' : 'Voir le produit',
    badge: laptop.isFeatured ? 'Produit mis en avant' : 'Sélection catalogue',
    price: laptop.price,
    product: laptop,
    imageFit: 'contain',
    imagePosition: 'center center',
    meta: [laptop.processor, laptop.ram, laptop.storage],
  }));

  const gracefulFallbackSlides: PromoSlide[] = homepageBanners.length > 0
    ? homepageBanners.map((banner) => ({
        id: String(banner.id),
        kind: 'editorial',
        title: String(banner.title || heroTitle).trim(),
        subtitle: String(banner.subtitle || heroSubtitle).trim(),
        description: String(banner.description || siteCMS.welcomeText || siteCMS.aboutText || heroSubtitle).trim(),
        image: String(banner.image || '').trim() || DEFAULT_BANNER_IMAGE,
        mobileImage: String(banner.mobileImage || '').trim() || undefined,
        ctaText: String(banner.ctaText || 'Explorer la sélection').trim(),
        ctaUrl: String(banner.link || '#catalog-grid-anchor').trim(),
        badge: 'Promotion maison',
        imageFit: normalizeImageFit(banner.imageFit) || 'cover',
        imagePosition: normalizeImagePosition(banner.imagePosition) || 'center center',
        meta: ['Collection premium', 'Contenu éditorial'],
      }))
    : [
        {
          id: 'editorial-default',
          kind: 'editorial',
          title: heroTitle,
          subtitle: heroSubtitle,
          description: String(siteCMS.welcomeText || siteCMS.aboutText || 'Découvrez nos machines sélectionnées avec soin, prêtes à équiper vos études et vos projets.').trim(),
          image: eligiblePromotedProducts[0]?.image || DEFAULT_BANNER_IMAGE,
          ctaText: 'Découvrir la collection',
          ctaUrl: '#catalog-grid-anchor',
          badge: 'Sélection premium',
          imageFit: 'cover',
          imagePosition: 'center center',
          meta: ['Toujours actif', 'Orienté catalogue'],
        },
      ];

  const promoSlides = advertisementSlides.length > 0
    ? advertisementSlides
    : productSlides.length > 0
      ? productSlides
      : gracefulFallbackSlides;

  const currentPromoSlide = promoSlides[activePromoIndex] || promoSlides[0];
  const isShowingAdvertisements = advertisementSlides.length > 0;
  const isShowingProductFallback = !advertisementSlides.length && productSlides.length > 0;

  useEffect(() => {
    if (activePromoIndex < promoSlides.length) return;
    setActivePromoIndex(0);
  }, [activePromoIndex, promoSlides.length]);

  const emitPromoEvent = (eventName: string, slide: PromoSlide, extra?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    try {
      window.dispatchEvent(new CustomEvent('herve:promo-banner', {
        detail: {
          event: eventName,
          slideId: slide.id,
          kind: slide.kind,
          advertiserName: slide.kind === 'advertisement' ? slide.advertiserName : null,
          productId: slide.kind === 'product' ? slide.product.id : null,
          trackingCode: slide.kind === 'advertisement' ? slide.trackingCode || null : null,
          timestamp: new Date().toISOString(),
          ...extra,
        },
      }));
    } catch {
      // Tracking is intentionally optional for now.
    }
  };

  useEffect(() => {
    if (!currentPromoSlide) return;
    emitPromoEvent(currentPromoSlide.kind === 'advertisement' ? 'advertisement_view' : 'promo_slide_view', currentPromoSlide, {
      position: activePromoIndex,
    });
  }, [activePromoIndex, currentPromoSlide?.id]);

  useEffect(() => {
    if (isPromoPaused || promoSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActivePromoIndex((prev) => (prev + 1) % promoSlides.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [isPromoPaused, promoSlides.length]);

  useEffect(() => () => {
    if (resumeRotationTimeoutRef.current) {
      window.clearTimeout(resumeRotationTimeoutRef.current);
    }
  }, []);

  const scheduleRotationResume = (delay = 8500) => {
    setIsPromoPaused(true);
    if (resumeRotationTimeoutRef.current) {
      window.clearTimeout(resumeRotationTimeoutRef.current);
    }
    resumeRotationTimeoutRef.current = window.setTimeout(() => {
      setIsPromoPaused(false);
      resumeRotationTimeoutRef.current = null;
    }, delay);
  };

  const handlePromoHover = (paused: boolean) => {
    if (resumeRotationTimeoutRef.current && paused) {
      window.clearTimeout(resumeRotationTimeoutRef.current);
      resumeRotationTimeoutRef.current = null;
    }
    setIsPromoPaused(paused);
  };

  const goToPromoSlide = (index: number) => {
    setActivePromoIndex(index);
    scheduleRotationResume();
  };

  const goToAdjacentPromoSlide = (direction: 1 | -1) => {
    setActivePromoIndex((prev) => {
      const nextIndex = (prev + direction + promoSlides.length) % promoSlides.length;
      return nextIndex;
    });
    scheduleRotationResume();
  };

  const resolvePromoImage = (slide: PromoSlide | undefined) => {
    if (!slide) return '';
    const primary = isMobileViewport && hasText(slide.mobileImage) ? String(slide.mobileImage) : String(slide.image || '');
    const secondary = primary === String(slide.image || '') ? String(slide.mobileImage || '') : String(slide.image || '');
    if (primary && !failedAssetUrls[primary]) return primary;
    if (secondary && !failedAssetUrls[secondary]) return secondary;
    return '';
  };

  const currentPromoImage = resolvePromoImage(currentPromoSlide);
  const currentPromoLogo =
    currentPromoSlide?.kind === 'advertisement' &&
    currentPromoSlide.logo &&
    !failedAssetUrls[currentPromoSlide.logo]
      ? currentPromoSlide.logo
      : '';

  const handlePromoAssetError = (url?: string) => {
    if (!url) return;
    setFailedAssetUrls((prev) => ({ ...prev, [url]: true }));
  };

  const registerPromoImageMetrics = (url: string | undefined, width: number, height: number) => {
    if (!url || !width || !height) return;
    const nextMetrics = buildPromoImageMetrics(width, height);
    setPromoImageMetricsByUrl((prev) => {
      const current = prev[url];
      if (
        current &&
        current.width === nextMetrics.width &&
        current.height === nextMetrics.height &&
        current.orientation === nextMetrics.orientation
      ) {
        return prev;
      }
      return { ...prev, [url]: nextMetrics };
    });
  };

  const handlePromoAction = (slide: PromoSlide) => {
    scheduleRotationResume();

    if (slide.kind === 'product') {
      emitPromoEvent('product_click', slide);
      onSelectLaptopForDetails(slide.product);
      return;
    }

    const targetUrl = String(slide.ctaUrl || '').trim();
    emitPromoEvent(slide.kind === 'advertisement' ? 'advertisement_click' : 'editorial_click', slide, {
      targetUrl,
    });

    if (!targetUrl) {
      document.getElementById('catalog-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (targetUrl.startsWith('#')) {
      document.querySelector(targetUrl)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const isExternal = /^https?:\/\//i.test(targetUrl) || slide.kind === 'advertisement' || ('targetType' in slide && slide.targetType === 'external');
    if (isExternal) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(targetUrl);
  };

  useEffect(() => {
    if (!currentPromoImage || promoImageMetricsByUrl[currentPromoImage]) return;
    const probe = new Image();
    probe.onload = () => {
      registerPromoImageMetrics(currentPromoImage, probe.naturalWidth, probe.naturalHeight);
    };
    probe.onerror = () => {
      handlePromoAssetError(currentPromoImage);
    };
    probe.src = currentPromoImage;
  }, [currentPromoImage, promoImageMetricsByUrl]);

  const currentPromoMetrics = currentPromoImage
    ? promoImageMetricsByUrl[currentPromoImage] || getFallbackPromoMetrics(currentPromoSlide)
    : getFallbackPromoMetrics(currentPromoSlide);
  const currentPromoImageFit = currentPromoSlide?.imageFit || 'contain';
  const currentPromoImagePosition = currentPromoSlide?.imagePosition || 'center center';
  const promoImageUsesContain = currentPromoImageFit !== 'cover';
  const promoImageFramePreset = getPromoImageFramePreset(currentPromoMetrics, viewportWidth);
  const promoImageFrameStyle: React.CSSProperties = {
    width: `${promoImageFramePreset.widthPercent}%`,
    maxWidth: '100%',
    maxHeight: `${promoImageFramePreset.maxHeight}px`,
    minHeight: `${promoImageFramePreset.minHeight}px`,
    aspectRatio: `${currentPromoMetrics.width} / ${currentPromoMetrics.height}`,
  };
  const promoImageColumnClass =
    currentPromoMetrics.orientation === 'portrait' || currentPromoMetrics.orientation === 'tall-portrait'
      ? 'lg:col-span-6'
      : 'lg:col-span-7';
  const promoTextColumnClass =
    currentPromoMetrics.orientation === 'portrait' || currentPromoMetrics.orientation === 'tall-portrait'
      ? 'lg:col-span-6'
      : 'lg:col-span-5';
  const promoTitle = currentPromoSlide?.title || heroTitle;
  const promoSubtitle = currentPromoSlide?.subtitle || heroSubtitle;
  const promoDescription = currentPromoSlide?.description || heroSubtitle;
  const promoDisplayTitle = isMobileViewport ? truncateText(promoTitle, 54) : promoTitle;
  const promoDisplaySubtitle = isMobileViewport ? truncateText(promoSubtitle, 120) : promoSubtitle;
  const promoDisplayDescription = isMobileViewport ? truncateText(promoDescription, 150) : promoDescription;
  const promoImportantInfo =
    currentPromoSlide?.kind === 'product'
      ? formatPrice(currentPromoSlide.price)
      : currentPromoSlide?.kind === 'advertisement'
        ? currentPromoSlide.advertiserName
        : currentPromoSlide?.meta?.[0] || '';
  const promoSupportingInfo =
    currentPromoSlide?.kind === 'product'
      ? 'Produit du catalogue disponible immédiatement'
      : currentPromoSlide?.kind === 'advertisement'
        ? currentPromoSlide?.meta?.[0] || 'Campagne sponsorisée'
        : currentPromoSlide?.meta?.[1] || '';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 sm:py-6 relative overflow-hidden" id="catalog-view-container">
      {/* Decorative Elegant Watermark "Herve_eShop" in the background */}
      <div className="absolute -left-10 top-1/3 opacity-[0.02] text-[18vw] font-black select-none pointer-events-none tracking-tight leading-none z-0">
        Herve_eShop
      </div>

      <section className="relative py-4 md:py-6 border-b border-warm-cream-dark/60 z-10">
        <div
          className="relative overflow-hidden rounded-[1.75rem] border border-luxe-dark/8 bg-luxe-dark text-white shadow-[0_22px_65px_rgba(33,24,18,0.16)]"
          onMouseEnter={() => handlePromoHover(true)}
          onMouseLeave={() => handlePromoHover(false)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.18),transparent_34%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-luxe-dark via-[#2a211b] to-[#171311]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromoSlide?.id || 'promo-fallback'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-3.5 sm:p-4 md:p-5 lg:p-6"
            >
              <div className={`${promoImageColumnClass} order-1 lg:order-1 flex items-center justify-center lg:justify-start`}>
                <div
                  className={`relative mx-auto lg:mx-0 rounded-[1.35rem] overflow-hidden border border-white/10 ${
                  promoImageUsesContain
                    ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(245,242,237,0.96)_62%,rgba(232,223,210,0.9))]'
                    : 'bg-white/6'
                  }`}
                  style={promoImageFrameStyle}
                >
                  {currentPromoImage ? (
                    <button
                      type="button"
                      onClick={() => currentPromoSlide && handlePromoAction(currentPromoSlide)}
                      className={`absolute inset-0 block h-full w-full text-left ${
                        promoImageUsesContain ? 'p-3 sm:p-4 md:p-5 lg:p-6' : ''
                      }`}
                    >
                      <img
                        src={currentPromoImage}
                        alt={currentPromoSlide?.title || 'Promotion'}
                        className={`h-full w-full ${promoImageUsesContain ? 'object-contain' : 'object-cover'} ${promoImageUsesContain ? 'rounded-[1rem]' : 'absolute inset-0'}`}
                        style={{ objectPosition: currentPromoImagePosition }}
                        onLoad={(event) => {
                          registerPromoImageMetrics(
                            currentPromoImage,
                            event.currentTarget.naturalWidth,
                            event.currentTarget.naturalHeight,
                          );
                        }}
                        referrerPolicy="no-referrer"
                        onError={() => handlePromoAssetError(currentPromoImage)}
                      />
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                      <div className="text-center px-6">
                        <div className="type-kicker text-luxe-gold">Visuel promotionnel</div>
                        <div className="type-section-title text-white mt-3">
                          {currentPromoSlide?.kind === 'advertisement' ? 'Campagne active' : 'Produit en vitrine'}
                        </div>
                        <p className="type-body text-white/70 mt-3 max-w-md">
                          Le contenu promotionnel reste accessible meme si un visuel externe n'est pas disponible.
                        </p>
                      </div>
                    </div>
                  )}

                  {!promoImageUsesContain && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/18 to-black/12" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    </>
                  )}

                  {promoImageUsesContain && (
                    <>
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/8 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                    </>
                  )}

                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
                    <div className="hidden sm:inline-flex flex-col gap-2">
                      <span className="type-kicker text-white/70">
                        {isShowingAdvertisements ? 'Sponsored placement' : isShowingProductFallback ? 'Product fallback mode' : 'Editorial fallback'}
                      </span>
                      {currentPromoSlide?.kind === 'advertisement' && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/12 backdrop-blur-md px-2.5 py-1.5 border border-white/10">
                          {currentPromoLogo ? (
                            <img
                              src={currentPromoLogo}
                              alt={currentPromoSlide.advertiserName}
                              className="w-7 h-7 rounded-full object-cover bg-white"
                              referrerPolicy="no-referrer"
                              onError={() => handlePromoAssetError(currentPromoLogo)}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-white/12 border border-white/10 flex items-center justify-center">
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <div className="text-left">
                            <div className="type-badge text-white">{currentPromoSlide.advertiserName}</div>
                            <div className="type-meta text-white/65">Emplacement prioritaire</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => goToAdjacentPromoSlide(-1)}
                        className="h-10 w-10 rounded-full border border-white/14 bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/45 transition-colors"
                        aria-label="Previous slide"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToAdjacentPromoSlide(1)}
                        className="h-10 w-10 rounded-full border border-white/14 bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/45 transition-colors"
                        aria-label="Next slide"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-3 md:justify-between">
                    <div className="hidden md:block max-w-lg">
                      <div className="type-kicker text-white/70">
                        {currentPromoSlide?.kind === 'advertisement'
                          ? 'Annonce active'
                          : currentPromoSlide?.kind === 'product'
                            ? 'Produit selectionne'
                            : 'Collection mise en avant'}
                      </div>
                      <div className="mt-1.5 text-lg sm:text-xl md:text-[1.6rem] font-bold tracking-tight text-white leading-tight">
                        {currentPromoSlide?.title}
                      </div>
                      <div className="type-meta mt-1.5 text-white/74 line-clamp-2">
                        {currentPromoSlide?.kind === 'product'
                          ? currentPromoSlide.subtitle
                          : currentPromoSlide?.description || currentPromoSlide?.subtitle}
                      </div>
                    </div>

                    {promoSlides.length > 1 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                        {promoSlides.slice(0, 7).map((slide, idx) => {
                          const active = idx === activePromoIndex;
                          return (
                            <button
                              key={slide.id}
                              type="button"
                              onClick={() => goToPromoSlide(idx)}
                              className={`h-2 rounded-full transition-all ${
                                active ? 'w-7 bg-white' : 'w-2 bg-white/35 hover:bg-white/55'
                              }`}
                              aria-label={`Go to slide ${idx + 1}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${promoTextColumnClass} order-2 lg:order-2 flex flex-col justify-between text-left`}>
                <div>
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${
                      currentPromoSlide?.kind === 'advertisement'
                        ? 'bg-white/8 border-white/15 text-white'
                        : currentPromoSlide?.kind === 'product'
                          ? 'bg-luxe-copper/20 border-luxe-copper/30 text-luxe-gold'
                          : 'bg-white/8 border-white/15 text-white'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                      <span className="type-badge text-current">{currentPromoSlide?.badge}</span>
                    </span>
                    {currentPromoSlide?.kind === 'advertisement' && (
                      <span className="type-meta text-white/68 sm:hidden">
                        {currentPromoSlide.advertiserName}
                      </span>
                    )}
                    {currentPromoSlide?.kind === 'product' && (
                      <span className="type-meta text-white/68 sm:hidden">
                        Fallback automatique du catalogue
                      </span>
                    )}
                  </div>

                  <h2 className="max-w-[15ch] text-white text-[clamp(1.45rem,6.8vw,3rem)] leading-[0.96] font-extrabold tracking-[-0.04em]">
                    {promoDisplayTitle}
                  </h2>

                  <p className="mt-2.5 max-w-xl text-white/84 text-[0.92rem] md:text-[1rem] leading-relaxed font-medium line-clamp-3">
                    {promoDisplaySubtitle}
                  </p>

                  <p className="type-body mt-2 max-w-xl text-white/66 line-clamp-2 md:line-clamp-3">
                    {promoDisplayDescription}
                  </p>

                  {promoImportantInfo && (
                    <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span className="type-price text-white">
                        {promoImportantInfo}
                      </span>
                      {promoSupportingInfo && (
                        <span className="type-meta text-white/65">
                          {promoSupportingInfo}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 hidden sm:flex flex-wrap gap-2">
                    {currentPromoSlide?.meta?.map((item) => (
                      <span
                        key={item}
                        className="type-meta px-2.5 py-1 rounded-full border border-white/12 bg-white/7 text-white/76"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => currentPromoSlide && handlePromoAction(currentPromoSlide)}
                    className="type-button inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white text-luxe-dark px-4 py-3 hover:bg-luxe-gold transition-colors shadow-lg"
                  >
                    {currentPromoSlide?.ctaText || 'Découvrir'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      scheduleRotationResume();
                      document.getElementById('catalog-grid-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="type-button inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/14 bg-white/6 text-white px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    Explorer le catalogue
                    <Globe2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* FILTER PANEL SECTION */}
      <span id="catalog-grid-anchor" className="block scroll-mt-24"></span>
      <section className="mt-10 md:mt-16 bg-white/80 border border-warm-cream-dark/80 rounded-2xl p-4 sm:p-5 md:p-7 shadow-xs overflow-hidden">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-warm-cream-dark/50 pb-4">
            <div>
              <h3 className="type-card-title text-luxe-dark flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-luxe-copper" /> Filtrer le catalogue en temps réel
              </h3>
              <p className="type-meta text-luxe-muted mt-1">Retrouvez l'article tech qui correspond exactement à vos besoins.</p>
            </div>
            <div className="type-badge text-luxe-muted bg-warm-cream px-3 py-1.5 rounded-full border border-warm-cream-dark">
              {sortedLaptops.length} article{sortedLaptops.length > 1 ? 's' : ''} trouve{sortedLaptops.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Interactive Button Filters */}
          <div className="flex flex-col gap-5 border-b border-warm-cream-dark/40 pb-5">
            {/* 1. Category & Favorites Filter Buttons */}
            <div className="flex flex-col gap-2">
              <span className="field-label text-luxe-muted">Familles de produits et favoris</span>
              <div className="flex flex-wrap gap-2">
                {productCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const icon = categoryIcons[cat] || '📦';
                  const label = cat === 'All' ? 'Tous les produits' : cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowOnlyFavourites(false); // Standard catalog view is restored when clicking category buttons
                      }}
                      className={`type-button inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all border cursor-pointer select-none ${
                        isSelected && !showOnlyFavourites
                          ? 'bg-luxe-dark text-warm-cream border-luxe-dark shadow-sm scale-[1.02]'
                          : 'bg-warm-cream text-luxe-dark border-warm-cream-dark/70 hover:border-luxe-gold hover:bg-white'
                      }`}
                      id={`filter-category-btn-${cat}`}
                    >
                      <span className="text-sm">{icon}</span>
                      {label}
                    </button>
                  );
                })}

                <div className="w-px h-8 bg-warm-cream-dark/70 mx-1.5 hidden sm:block"></div>

                <button
                  type="button"
                  onClick={() => {
                    setShowOnlyFavourites(!showOnlyFavourites);
                  }}
                  className={`type-button inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all border cursor-pointer select-none ${
                    showOnlyFavourites
                      ? 'bg-red-500 text-white border-red-500 shadow-sm scale-[1.02]'
                      : 'bg-red-50 text-red-600 border-red-200 hover:border-red-400 hover:bg-red-100'
                  }`}
                  id="filter-only-favourites-btn"
                >
                  <Heart className="w-4 h-4" />
                  Mes Favoris ({favouriteIds.length})
                </button>
              </div>
            </div>

            {/* 2. Brand Filter Buttons */}
            <div className="flex flex-col gap-2">
              <span className="field-label text-luxe-muted">Filtrer par marque</span>
              <div className="flex flex-wrap gap-1.5">
                {brands.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`type-button inline-flex items-center px-3.5 py-2 rounded-lg transition-all border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-luxe-gold text-luxe-dark border-luxe-gold shadow-sm scale-[1.02]'
                          : 'bg-warm-cream text-luxe-dark border-warm-cream-dark/60 hover:border-luxe-gold hover:bg-white'
                      }`}
                      id={`filter-brand-btn-${brand}`}
                    >
                      {brand === 'All' ? 'Toutes les marques' : brand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Budget & Price range slider */}
            <div className="flex flex-col gap-3 pt-2 border-t border-warm-cream-dark/40">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="field-label text-luxe-muted">
                  Budget & Fourchette de prix (FCFA)
                </span>
                <div className="flex items-center gap-1 type-meta text-luxe-copper font-mono bg-warm-cream px-3 py-1.5 rounded-full border border-warm-cream-dark shadow-xs">
                  <span>{formatPrice(minPrice)}</span>
                  <span className="text-luxe-muted mx-1">à</span>
                  <span>{formatPrice(maxPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-warm-cream/40 p-3.5 sm:p-4 rounded-xl border border-warm-cream-dark/50">
                {/* Min Price Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center type-badge text-luxe-muted">
                    <span>Prix Minimum</span>
                    <span className="font-mono text-luxe-dark font-bold">{formatPrice(minPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="type-badge text-luxe-muted font-mono">0</span>
                    <input
                      type="range"
                      min="0"
                      max="5000000"
                      step="25000"
                      value={minPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= maxPrice) {
                          setMinPrice(val);
                        }
                      }}
                      className="flex-1 h-2 bg-warm-cream-dark rounded-full appearance-none cursor-pointer accent-luxe-copper focus:outline-none focus:ring-1 focus:ring-luxe-gold"
                      id="price-range-min-slider"
                    />
                    <span className="type-badge text-luxe-muted font-mono">5M</span>
                  </div>
                </div>

                {/* Max Price Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center type-badge text-luxe-muted">
                    <span>Prix Maximum</span>
                    <span className="font-mono text-luxe-dark font-bold">{formatPrice(maxPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="type-badge text-luxe-muted font-mono">0</span>
                    <input
                      type="range"
                      min="0"
                      max="5000000"
                      step="25000"
                      value={maxPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= minPrice) {
                          setMaxPrice(val);
                        }
                      }}
                      className="flex-1 h-2 bg-warm-cream-dark rounded-full appearance-none cursor-pointer accent-luxe-copper focus:outline-none focus:ring-1 focus:ring-luxe-gold"
                      id="price-range-max-slider"
                    />
                    <span className="type-badge text-luxe-muted font-mono">5M</span>
                  </div>
                </div>
              </div>

              {/* Express popular budgets */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="field-label text-luxe-muted mr-1">Raccourcis budget</span>
                {[
                  { label: "Tous budgets", min: 0, max: 5000000 },
                  { label: "Moins de 600K", min: 0, max: 600000 },
                  { label: "600K - 1M", min: 600000, max: 1000000 },
                  { label: "Plus de 1M", min: 1000000, max: 5000000 }
                ].map((b, i) => {
                  const isCurrent = minPrice === b.min && maxPrice === b.max;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setMinPrice(b.min);
                        setMaxPrice(b.max);
                      }}
                      className={`type-badge px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${
                        isCurrent
                          ? 'bg-luxe-copper text-white border-luxe-copper shadow-xs'
                          : 'bg-white text-luxe-muted border-warm-cream-dark/60 hover:border-luxe-copper hover:text-luxe-copper'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Secondary Filters Inputs Grid (Provenance, Availability, Sort) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filter by Import Source */}
            <div className="flex flex-col gap-1.5">
              <label className="field-label text-luxe-muted">Provenance d'import</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="field-input w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-3 text-gray-900 focus:outline-none focus:border-blue-500"
                id="filter-source-select"
              >
                <option value="All">Toutes provenances</option>
                <option value="USA">Importé des USA</option>
                <option value="Europe">Importé d'Europe</option>
                <option value="Asia">Importé d'Asie</option>
              </select>
            </div>

            {/* Filter by Live Stock Status */}
            <div className="flex flex-col gap-1.5">
              <label className="field-label text-luxe-muted">Disponibilité</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="field-input w-full bg-warm-cream border border-warm-cream-dark rounded-lg py-2.5 px-3 text-luxe-dark focus:outline-none focus:border-luxe-gold"
                id="filter-status-select"
              >
                <option value="All">Tous les statuts</option>
                <option value="Disponible">Disponible de suite</option>
                <option value="Arrivage imminent">Arrivage imminent</option>
                <option value="Rupture">Rupture de stock</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1.5">
              <label className="field-label text-luxe-muted">Trier par</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="field-input w-full bg-warm-cream border border-warm-cream-dark rounded-lg py-2.5 px-3 text-luxe-dark focus:outline-none focus:border-luxe-gold appearance-none"
                  id="sort-select"
                >
                  <option value="default">Ordre alphabétique</option>
                  <option value="price-asc">Prix : Croissant</option>
                  <option value="price-desc">Prix : Décroissant</option>
                  <option value="stock-desc">Stock dispo : Décroissant</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-luxe-muted absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG GRID - LabCraft Style */}
      <section className="mt-12" id="catalog-section-grid">
        <div className="mb-10">
          <h2 className="type-section-title text-gray-900 mb-4">Notre Collection</h2>
          <p className="type-subtitle text-gray-600 max-w-2xl">
            Découvrez notre sélection exclusive d'ordinateurs portables premium, soigneusement sélectionnés pour leur performance exceptionnelle et leur qualité irréprochable.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {sortedLaptops.length === 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="col-span-full bg-white/40 border border-dashed border-warm-cream-dark p-12 text-center rounded-2xl flex flex-col items-center justify-center"
              key="no-matching-laptops"
            >
              <Globe2 className="w-10 h-10 text-luxe-muted mb-2 animate-pulse" />
              <h4 className="type-card-title text-luxe-dark">Aucun matériel ne correspond</h4>
              <p className="type-meta text-luxe-muted mt-1 max-w-sm">
                Réduisez vos filtres ou modifiez votre recherche pour découvrir d'autres modèles d'exception.
              </p>
              <button
                onClick={() => {
                  setSelectedBrand('All');
                  setSelectedCategory('All');
                  setSelectedSource('All');
                  setSelectedStatus('All');
                  setSortBy('default');
                  setShowOnlyFavourites(false);
                  setMinPrice(0);
                  setMaxPrice(5000000);
                }}
                className="mt-4 text-xs font-semibold text-luxe-copper hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </motion.div>
          ) : (
            sortedLaptops.map((laptop) => {
              const isOutOfStock = laptop.stockQuantity === 0 || laptop.status === 'Rupture';
              const isIncoming = laptop.status === 'Arrivage imminent';

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  key={laptop.id}
                  id={`laptop-card-${laptop.id}`}
                  className="group min-w-0 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                >
                  {/* Image Section - LabCraft Style */}
                  <div 
                    onClick={() => onSelectLaptopForDetails(laptop)}
                    className="relative aspect-[5/4] sm:aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer"
                    title="Cliquez pour voir les détails du produit"
                  >
                    <img
                      src={laptop.image}
                      alt={`${laptop.brand} ${laptop.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {isOutOfStock ? (
                        <span className="type-badge bg-red-500 text-white px-2.5 py-1 rounded-full">
                          Rupture
                        </span>
                      ) : isIncoming ? (
                        <span className="type-badge bg-yellow-500 text-white px-2.5 py-1 rounded-full">
                          Arrivage
                        </span>
                      ) : (
                        <span className="type-badge bg-green-500 text-white px-2.5 py-1 rounded-full">
                          En Stock
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavourite(laptop.id);
                      }}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-sm transition-all ${
                        favouriteIds.includes(laptop.id)
                          ? 'bg-white text-red-500 border-white'
                          : 'bg-white/85 text-luxe-dark border-white/90 hover:text-red-500'
                      }`}
                      id={`toggle-fav-${laptop.id}`}
                      title={favouriteIds.includes(laptop.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart className={`w-4 h-4 ${favouriteIds.includes(laptop.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Product Details - LabCraft Style */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4 sm:gap-5">
                    <div 
                      onClick={() => onSelectLaptopForDetails(laptop)}
                      className="min-w-0 cursor-pointer text-left"
                      title="Cliquer pour voir les détails de cette machine"
                    >
                      <h4 className="type-card-title text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        {laptop.brand} {laptop.model}
                      </h4>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-start gap-2 type-meta text-gray-600 min-w-0">
                          <span className="font-semibold text-gray-800">Processeur:</span>
                          <span className="min-w-0 break-words">{laptop.processor}</span>
                        </div>
                        <div className="flex items-center gap-2 type-meta text-gray-600 min-w-0">
                          <span className="font-semibold text-gray-800">RAM:</span>
                          <span className="min-w-0 break-words">{laptop.ram}</span>
                        </div>
                        <div className="flex items-center gap-2 type-meta text-gray-600 min-w-0">
                          <span className="font-semibold text-gray-800">Stockage:</span>
                          <span className="min-w-0 break-words">{laptop.storage}</span>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="type-price text-gray-900">
                          {formatPrice(laptop.price)}
                        </div>
                        <div className="type-meta text-gray-500 mt-1">
                          TTC - Livraison incluse
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => onAddToCart(laptop)}
                          className={`type-button flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                            isOutOfStock
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          }`}
                          disabled={isOutOfStock}
                          title="Ajouter au panier"
                          id={`add-to-cart-btn-${laptop.id}`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Ajouter
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectLaptopForQuote(laptop)}
                          className={`type-button flex-1 inline-flex items-center justify-center py-3 rounded-xl transition-all border ${
                            isOutOfStock
                              ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                          disabled={isOutOfStock}
                          id={`quote-btn-${laptop.id}`}
                        >
                          {isIncoming ? 'Réserver' : 'Devis'}
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => onSelectLaptopForDetails(laptop)}
                        className="type-meta mt-3 w-full text-blue-600 hover:text-blue-800 transition-colors cursor-pointer select-none py-2.5"
                        id={`details-link-${laptop.id}`}
                      >
                        Voir les détails complets →
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        </div>
      </section>

      {/* WHY CHOOSE HERVE_ESHOP ADVANTAGE */}
      <section className="mt-14 md:mt-24 bg-luxe-dark text-warm-cream rounded-3xl p-5 sm:p-7 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-[0.03] text-[20vw] font-black select-none pointer-events-none tracking-tight">
          Luxe
        </div>
        <div className="max-w-2xl text-left z-10 relative">
          <span className="type-kicker text-luxe-gold">La Charte Confiance d'Hervé</span>
          <h3 className="type-section-title mt-3 mb-6">
            Pourquoi choisir notre catalogue pour équiper vos études & projets ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-luxe-gold" />
              </div>
              <h5 className="text-sm font-semibold text-white">Authenticité Garantie</h5>
              <p className="text-[11px] text-warm-cream-dark/70 mt-1 leading-relaxed">
                Toutes nos machines subissent 40 points de tests rigoureux avant d'entrer au Cameroun.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-luxe-gold" />
              </div>
              <h5 className="text-sm font-semibold text-white">Traçabilité Claire</h5>
              <p className="text-[11px] text-warm-cream-dark/70 mt-1 leading-relaxed">
                Provenance transparente (USA, Europe ou Asie) - aucun reconditionnement de basse qualité.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-luxe-gold" />
              </div>
              <h5 className="text-sm font-semibold text-white">Accompagnement Devis</h5>
              <p className="text-[11px] text-warm-cream-dark/70 mt-1 leading-relaxed">
                Configurations à la carte sur demande (mémoire augmentée, pack housse cuir premium).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
