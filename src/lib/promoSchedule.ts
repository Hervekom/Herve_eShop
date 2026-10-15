// Règles de l'espace publicitaire (carrousel de la page d'accueil).
//
// - Une « publicité programmée » (type Advertisement Banner) active et dans ses
//   dates remplace les produits du catalogue dans le carrousel.
// - Elle peut venir de vos propres SaaS (advertiserKind = 'own') ou d'un client
//   qui loue l'espace (advertiserKind = 'client').
// - Si plusieurs publicités sont en cours, seules celles de la meilleure priorité
//   (le plus petit nombre) s'affichent ; à priorité égale, elles défilent ensemble.
// - Sans publicité en cours, le carrousel met en avant les produits du catalogue.
//
// Ce fichier est utilisé à la fois par le site public et par l'admin, pour que
// « ce que l'admin annonce » soit exactement « ce que les clients voient ».

export const ADVERTISEMENT_TYPE = 'Advertisement Banner';

// Les dates saisies (AAAA-MM-JJ) sont interprétées à l'heure du Cameroun (UTC+1,
// sans heure d'été) : une campagne « du 15 au 20 » tourne du 15 à 00:00 au 20 à
// 23:59 à Douala, quel que soit le fuseau de l'appareil qui affiche le site.
const CAMEROON_OFFSET = '+01:00';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type AdvertiserKind = 'own' | 'client';

export type ScheduledBanner = {
  id?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  priority?: number | string;
  advertiserKind?: string;
  advertiserName?: string;
  title?: string;
};

export type BannerScheduleState = 'disabled' | 'scheduled' | 'running' | 'ended';

export function parseBannerDate(value: unknown, edge: 'start' | 'end'): Date | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const iso = DATE_ONLY.test(raw)
    ? `${raw}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}${CAMEROON_OFFSET}`
    : raw;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getBannerPriority(banner: ScheduledBanner) {
  const raw = Number(banner.priority);
  return Number.isFinite(raw) ? raw : 999;
}

export function getAdvertiserKind(banner: ScheduledBanner): AdvertiserKind {
  return String(banner.advertiserKind || '').trim() === 'own' ? 'own' : 'client';
}

export function isAdvertisement(banner: ScheduledBanner) {
  return String(banner.type || '').trim() === ADVERTISEMENT_TYPE;
}

export function getBannerScheduleState(banner: ScheduledBanner, now: Date = new Date()): BannerScheduleState {
  if (String(banner.status || '').trim() !== 'Actif') return 'disabled';
  const start = parseBannerDate(banner.startDate, 'start');
  const end = parseBannerDate(banner.endDate, 'end');
  if (start && now < start) return 'scheduled';
  if (end && now > end) return 'ended';
  return 'running';
}

export function isBannerRunning(banner: ScheduledBanner, now: Date = new Date()) {
  return getBannerScheduleState(banner, now) === 'running';
}

/** Publicités affichées en ce moment dans le carrousel (vide = produits du catalogue). */
export function selectActiveAdvertisements<T extends ScheduledBanner>(banners: T[], now: Date = new Date()): T[] {
  const running = banners
    .filter(isAdvertisement)
    .filter((banner) => isBannerRunning(banner, now))
    .sort((a, b) => {
      const priorityDiff = getBannerPriority(a) - getBannerPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      const aStart = parseBannerDate(a.startDate, 'start')?.getTime() || 0;
      const bStart = parseBannerDate(b.startDate, 'start')?.getTime() || 0;
      return bStart - aStart;
    });
  if (!running.length) return [];
  const best = getBannerPriority(running[0]);
  return running.filter((banner) => getBannerPriority(banner) === best);
}

/** Date affichable « 20 oct. 2026 » (heure du Cameroun). */
export function formatBannerDate(value: unknown, edge: 'start' | 'end') {
  const date = parseBannerDate(value, edge);
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Africa/Douala' }).format(date);
}
