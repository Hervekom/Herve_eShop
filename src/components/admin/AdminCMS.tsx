import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Phone, Share2, HelpCircle, FileText, 
  RefreshCw, CheckCircle, Image, Smartphone, Sparkles, MapPin, Map
} from 'lucide-react';
import API from '../../lib/api';

export default function AdminCMS({ 
  currentRole, 
  onTriggerToast 
}: { 
  currentRole: 'Super Admin' | 'Admin' | 'Editor';
  onTriggerToast: (title: string, message: string, type?: string) => void;
}) {
  const [subTab, setSubTab] = useState<'site' | 'contact' | 'social' | 'banners' | 'reviews'>('site');
  const [loading, setLoading] = useState(true);

  // CMS forms states
  const [siteData, setSiteData] = useState<any>({});
  const [contactData, setContactData] = useState<any>({});
  const [socialData, setSocialData] = useState<any>({});
  
  // Announcement banner lists
  const [banners, setBanners] = useState<any[]>([]);
  const [serviceReviews, setServiceReviews] = useState<any[]>([]);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>({
    title: '', subtitle: '', image: '', link: '', type: 'Homepage Banner', status: 'Actif'
  });

  const fetchCMSData = async () => {
    try {
      setLoading(true);
      const res = await API.getClientData();
      setSiteData(res.siteCMS || {});
      setContactData(res.contactCMS || {});
      setSocialData(res.socialCMS || {});
      
      const bannersList = await API.getBanners();
      setBanners(bannersList);

      try {
        const reviews = await API.getAdminServiceReviews();
        setServiceReviews(Array.isArray(reviews) ? reviews : []);
      } catch {
        setServiceReviews([]);
      }
    } catch (err) {
      onTriggerToast('Erreur ❌', 'Impossible de charger les données du CMS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSData();
  }, []);

  const handleUpdateSiteCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.updateSiteCMS(siteData);
      onTriggerToast('CMS Mis à jour 🎉', 'Les métadonnées publiques du site ont été re-synchronisées.', 'success');
      fetchCMSData();
    } catch (err) {
      onTriggerToast('Erreur CMS ❌', (err as Error).message, 'danger');
    }
  };

  const handleUpdateContactCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.updateContactCMS(contactData);
      onTriggerToast('Contacts Actualisés 📲', 'Coordonnées de l\'atelier d\'Hervé mises à jour.', 'success');
      fetchCMSData();
    } catch (err) {
      onTriggerToast('Erreur CMS ❌', (err as Error).message, 'danger');
    }
  };

  const handleUpdateSocialCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.updateSocialCMS(socialData);
      onTriggerToast('Réseaux Sociaux Enregistrés 🌐', 'Les redirections Facebbook/Instagram ont été validées.', 'success');
      fetchCMSData();
    } catch (err) {
      onTriggerToast('Erreur CMS ❌', (err as Error).message, 'danger');
    }
  };

  // Banner operators
  const handleBannerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBanner.id) {
        await API.updateBanner(currentBanner.id, currentBanner);
        onTriggerToast('Bannière Mise à jour 👍', `L'affiche "${currentBanner.title}" a été recalculée.`, 'success');
      } else {
        await API.createBanner(currentBanner);
        onTriggerToast('Bannière Programmée 🖼️', `Le slider "${currentBanner.title}" est maintenant actif.`, 'success');
      }
      setBannerFormOpen(false);
      fetchCMSData();
    } catch (err) {
      onTriggerToast('Erreur Bannière', (err as Error).message);
    }
  };

  const handleBannerDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce slider / cette bannière publicitaire ?')) return;
    try {
      await API.deleteBanner(id);
      onTriggerToast('Bannière Éliminée', 'Le slider a été purgé.');
      fetchCMSData();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message);
    }
  };

  const handleServiceReviewDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cet avis client ?')) return;
    try {
      await API.deleteAdminServiceReview(id);
      onTriggerToast('Avis supprimé', 'L’avis client a été supprimé.', 'success');
      fetchCMSData();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message, 'danger');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 text-luxe-copper animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div>
        <h3 className="font-serif text-xl font-bold text-luxe-dark flex items-center gap-2">
          <Settings className="w-5 h-5 text-luxe-copper" />
          CMS & Éditeur du Contenu du Site
        </h3>
        <p className="text-xs text-luxe-muted mt-1">
          Modifiez en direct le nom du site, la bannière d'accroche, les biographies, l'histoire, l'adresse de l'atelier, ou gérez vos carrousels.
        </p>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex border-b border-warm-cream gap-2.5 scrollbar-none overflow-x-auto pb-px">
        <button
          onClick={() => setSubTab('site')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            subTab === 'site' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-1.5" />
          <span>Informations Générales</span>
        </button>

        <button
          onClick={() => setSubTab('contact')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            subTab === 'contact' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-1.5" />
          <span>Coordonnées & Coordonnées GPS</span>
        </button>

        <button
          onClick={() => setSubTab('social')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            subTab === 'social' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <Share2 className="w-4 h-4 inline mr-1.5" />
          <span>Réseaux Sociaux</span>
        </button>

        <button
          onClick={() => setSubTab('banners')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            subTab === 'banners' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <Image className="w-4 h-4 inline mr-1.5" />
          <span>Bannières & Sliders</span>
        </button>

        <button
          onClick={() => setSubTab('reviews')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            subTab === 'reviews' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          <span>Avis Clients</span>
        </button>
      </div>

      {/* CMS 1: GENERAL WEBSITE CMS */}
      {subTab === 'site' && siteData.siteName !== undefined && (
        <form onSubmit={handleUpdateSiteCMS} className="bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm space-y-6 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Nom officiel du site</label>
              <input
                type="text"
                value={siteData.siteName}
                onChange={(e) => setSiteData((p: any) => ({ ...p, siteName: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Texte Logo En-Tête</label>
              <input
                type="text"
                value={siteData.logoText}
                onChange={(e) => setSiteData((p: any) => ({ ...p, logoText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper font-serif font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="font-bold text-luxe-dark">Bandeau d'Alerte / Message d'Annonce Principal</label>
            <input
              type="text"
              value={siteData.announcementText}
              onChange={(e) => setSiteData((p: any) => ({ ...p, announcementText: e.target.value }))}
              placeholder="S'affiche tout en haut de la page publique..."
              className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper text-emerald-700 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Hero Section - Titre Accroche Majeur</label>
              <input
                type="text"
                value={siteData.heroTitle}
                onChange={(e) => setSiteData((p: any) => ({ ...p, heroTitle: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Hero Section - Sous-Titre</label>
              <input
                type="text"
                value={siteData.heroSubtitle}
                onChange={(e) => setSiteData((p: any) => ({ ...p, heroSubtitle: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Texte d'Accueil de la Boutique</label>
              <textarea
                rows={3}
                value={siteData.welcomeText}
                onChange={(e) => setSiteData((p: any) => ({ ...p, welcomeText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper focus:ring-0 leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Qui est Hervé ? / Histoire à Propos</label>
              <textarea
                rows={3}
                value={siteData.aboutText}
                onChange={(e) => setSiteData((p: any) => ({ ...p, aboutText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper focus:ring-0 leading-relaxed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Mission d'Atelier d'Hervé</label>
              <textarea
                rows={2}
                value={siteData.mission}
                onChange={(e) => setSiteData((p: any) => ({ ...p, mission: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Vision d'Expansion</label>
              <textarea
                rows={2}
                value={siteData.vision}
                onChange={(e) => setSiteData((p: any) => ({ ...p, vision: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Valeurs Essentielles d'eShop</label>
              <textarea
                rows={2}
                value={siteData.values}
                onChange={(e) => setSiteData((p: any) => ({ ...p, values: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="font-bold text-luxe-dark">Footer - Descriptif de signature</label>
            <input
              type="text"
              value={siteData.footerText}
              onChange={(e) => setSiteData((p: any) => ({ ...p, footerText: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
            />
          </div>

          {/* Dynamic Policies section */}
          <div className="border-t border-warm-cream pt-5 space-y-4 text-left">
            <h4 className="font-serif text-sm font-bold text-luxe-copper flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5" />
              Politiques Légales & CGU d'Herve_eShop
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Conditions d'Utilisation (CGU / CGV)</label>
                <textarea
                  rows={3}
                  value={siteData.termsOfUse}
                  onChange={(e) => setSiteData((p: any) => ({ ...p, termsOfUse: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-sans leading-relaxed text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Mentions Légales & RCCM de la Sarl</label>
                <textarea
                  rows={3}
                  value={siteData.legalMentions}
                  onChange={(e) => setSiteData((p: any) => ({ ...p, legalMentions: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-sans leading-relaxed text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Politique de Confidentialité et RLS</label>
                <textarea
                  rows={3}
                  value={siteData.privacyPolicy}
                  onChange={(e) => setSiteData((p: any) => ({ ...p, privacyPolicy: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-sans leading-relaxed text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Politique technique de garantie & retours</label>
                <textarea
                  rows={3}
                  value={siteData.returnPolicy}
                  onChange={(e) => setSiteData((p: any) => ({ ...p, returnPolicy: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-sans leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-warm-cream">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-luxe-copper hover:bg-luxe-dark text-white font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le CMS Général</span>
            </button>
          </div>

        </form>
      )}

      {/* CMS 2: CONTACT & GPS INFORMATION */}
      {subTab === 'contact' && contactData.primaryPhone !== undefined && (
        <form onSubmit={handleUpdateContactCMS} className="bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm space-y-5 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Téléphone Primaire</label>
              <input
                type="text"
                value={contactData.primaryPhone}
                onChange={(e) => setContactData((p: any) => ({ ...p, primaryPhone: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Téléphone Secondaire</label>
              <input
                type="text"
                value={contactData.secondaryPhone}
                onChange={(e) => setContactData((p: any) => ({ ...p, secondaryPhone: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Identifiant WhatsApp (Format : 237xxxxxxxxx)</label>
              <input
                type="text"
                value={contactData.whatsAppPhone}
                onChange={(e) => setContactData((p: any) => ({ ...p, whatsAppPhone: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Adresse Email Officielle d'Hervé</label>
              <input
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData((p: any) => ({ ...p, email: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-luxe-dark">Coordonnées GPS Actuelles de l'Atelier</label>
              <input
                type="text"
                value={contactData.gpsCoordinates}
                onChange={(e) => setContactData((p: any) => ({ ...p, gpsCoordinates: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="font-bold text-luxe-dark">Adresse Physique de la Boutique Principale (Douala)</label>
            <input
              type="text"
              value={contactData.address}
              onChange={(e) => setContactData((p: any) => ({ ...p, address: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-warm-cream-dark"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="font-bold text-luxe-dark">Horaires d'Ouverture d'Atelier d'Hervé</label>
            <input
              type="text"
              value={contactData.openingHours}
              onChange={(e) => setContactData((p: any) => ({ ...p, openingHours: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-warm-cream-dark text-luxe-copper font-bold"
            />
          </div>

          {/* Google Map iframe component */}
          <div className="space-y-2 text-left border-t border-warm-cream pt-4">
            <label className="font-bold text-luxe-dark flex items-center gap-1">
              <Map className="w-4 h-4 text-luxe-copper" />
              Lien Iframe Intégré Google Maps 📍
            </label>
            <input
              type="text"
              value={contactData.googleMapsIframe}
              onChange={(e) => setContactData((p: any) => ({ ...p, googleMapsIframe: e.target.value }))}
              placeholder="Indiquez le lien https://www.google.com/maps/embed... provenant d'exporter carte"
              className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-mono text-[10px]"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-warm-cream">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-luxe-copper hover:bg-luxe-dark text-white font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer Coordonnées</span>
            </button>
          </div>

        </form>
      )}

      {/* CMS 3: SOCIAL MEDIA LINKS */}
      {subTab === 'social' && socialData.facebook !== undefined && (
        <form onSubmit={handleUpdateSocialCMS} className="bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm space-y-6 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Facebook */}
            <div className="border border-warm-cream-dark rounded-2xl p-4 space-y-3 bg-warm-cream/5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-luxe-dark uppercase tracking-wider text-[10px]">Facebook Link</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px] text-luxe-muted">
                  <input
                    type="checkbox"
                    checked={socialData.facebook.active}
                    onChange={(e) => setSocialData((p: any) => ({
                      ...p,
                      facebook: { ...p.facebook, active: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                  />
                  <span>Actif sur le site</span>
                </label>
              </div>
              <input
                type="text"
                value={socialData.facebook.url}
                onChange={(e) => setSocialData((p: any) => ({
                  ...p,
                  facebook: { ...p.facebook, url: e.target.value }
                }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream"
              />
            </div>

            {/* Instagram */}
            <div className="border border-warm-cream-dark rounded-2xl p-4 space-y-3 bg-warm-cream/5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-luxe-dark uppercase tracking-wider text-[10px]">Instagram Link</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px] text-luxe-muted">
                  <input
                    type="checkbox"
                    checked={socialData.instagram.active}
                    onChange={(e) => setSocialData((p: any) => ({
                      ...p,
                      instagram: { ...p.instagram, active: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                  />
                  <span>Actif sur le site</span>
                </label>
              </div>
              <input
                type="text"
                value={socialData.instagram.url}
                onChange={(e) => setSocialData((p: any) => ({
                  ...p,
                  instagram: { ...p.instagram, url: e.target.value }
                }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream"
              />
            </div>

            {/* TikTok */}
            <div className="border border-warm-cream-dark rounded-2xl p-4 space-y-3 bg-warm-cream/5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-luxe-dark uppercase tracking-wider text-[10px]">TikTok Link</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px] text-luxe-muted">
                  <input
                    type="checkbox"
                    checked={socialData.tiktok.active}
                    onChange={(e) => setSocialData((p: any) => ({
                      ...p,
                      tiktok: { ...p.tiktok, active: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                  />
                  <span>Actif sur le site</span>
                </label>
              </div>
              <input
                type="text"
                value={socialData.tiktok.url}
                onChange={(e) => setSocialData((p: any) => ({
                  ...p,
                  tiktok: { ...p.tiktok, url: e.target.value }
                }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream"
              />
            </div>

            {/* LinkedIn */}
            <div className="border border-warm-cream-dark rounded-2xl p-4 space-y-3 bg-warm-cream/5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-luxe-dark uppercase tracking-wider text-[10px]">LinkedIn Link</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px] text-luxe-muted">
                  <input
                    type="checkbox"
                    checked={socialData.linkedin.active}
                    onChange={(e) => setSocialData((p: any) => ({
                      ...p,
                      linkedin: { ...p.linkedin, active: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                  />
                  <span>Actif sur le site</span>
                </label>
              </div>
              <input
                type="text"
                value={socialData.linkedin.url}
                onChange={(e) => setSocialData((p: any) => ({
                  ...p,
                  linkedin: { ...p.linkedin, url: e.target.value }
                }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream"
              />
            </div>

            {/* YouTube */}
            <div className="border border-warm-cream-dark rounded-2xl p-4 space-y-3 bg-warm-cream/5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-luxe-dark uppercase tracking-wider text-[10px]">YouTube Link</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px] text-luxe-muted">
                  <input
                    type="checkbox"
                    checked={socialData.youtube.active}
                    onChange={(e) => setSocialData((p: any) => ({
                      ...p,
                      youtube: { ...p.youtube, active: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                  />
                  <span>Actif sur le site</span>
                </label>
              </div>
              <input
                type="text"
                value={socialData.youtube.url}
                onChange={(e) => setSocialData((p: any) => ({
                  ...p,
                  youtube: { ...p.youtube, url: e.target.value }
                }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream"
              />
            </div>

            {/* X Twitter */}
            <div className="border border-warm-cream-dark rounded-2xl p-4 space-y-3 bg-warm-cream/5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-luxe-dark uppercase tracking-wider text-[10px]">X (Twitter) Link</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px] text-luxe-muted">
                  <input
                    type="checkbox"
                    checked={socialData.twitter.active}
                    onChange={(e) => setSocialData((p: any) => ({
                      ...p,
                      twitter: { ...p.twitter, active: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                  />
                  <span>Actif sur le site</span>
                </label>
              </div>
              <input
                type="text"
                value={socialData.twitter.url}
                onChange={(e) => setSocialData((p: any) => ({
                  ...p,
                  twitter: { ...p.twitter, url: e.target.value }
                }))}
                className="w-full p-2.5 rounded-xl border border-warm-cream"
              />
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-warm-cream">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-luxe-copper hover:bg-luxe-dark text-white font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder les Réseaux</span>
            </button>
          </div>

        </form>
      )}

      {/* CMS 4: CAROUSELS BANNERS SCHEDULER */}
      {subTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-extrabold text-luxe-muted block">Affiches, Annonces et Offres temporaires programmées</span>
            <button
              onClick={() => {
                setCurrentBanner({
                  title: '', subtitle: '', image: '', link: '#catalogue', type: 'Homepage Banner', status: 'Actif'
                });
                setBannerFormOpen(true);
              }}
              className="px-3.5 py-1.5 bg-luxe-copper hover:bg-luxe-dark text-white rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer"
            >
              Ajouter une affiche Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {banners.map((ban) => (
              <div key={ban.id} className="bg-white border border-warm-cream-dark rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="relative h-28 bg-warm-cream/20">
                  <img src={ban.image} alt={ban.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 right-2 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-extrabold border bg-white ${
                    ban.status === 'Actif' ? 'text-emerald-700 border-emerald-300' : 'text-gray-500 border-gray-300'
                  }`}>
                    {ban.status}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider bg-luxe-gold/25 text-luxe-copper font-bold px-1.5 py-0.5 rounded font-mono block w-fit">
                      {ban.type}
                    </span>
                    <h5 className="font-serif font-bold text-sm text-luxe-dark mt-1">{ban.title}</h5>
                    <p className="text-[11px] text-luxe-muted leading-relaxed mt-0.5">{ban.subtitle}</p>
                  </div>
                  <div className="pt-2 border-t border-warm-cream flex justify-between items-center">
                    <span className="text-[9px] text-luxe-muted font-mono">Action : {ban.link}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setCurrentBanner(ban);
                          setBannerFormOpen(true);
                        }}
                        className="p-1 px-2 border hover:bg-warm-cream rounded text-[10px]"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleBannerDelete(ban.id)}
                        className="p-1 px-2 border border-red-150 hover:bg-red-50 text-red-600 rounded text-[10px]"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner creation slide */}
          {bannerFormOpen && (
            <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl border border-warm-cream-dark shadow-2xl p-5 text-left">
                <div className="flex justify-between items-center border-b border-warm-cream pb-3 mb-4">
                  <h4 className="font-serif font-bold text-sm text-luxe-dark">Éditer/Ajouter une Bannière</h4>
                  <button onClick={() => setBannerFormOpen(false)} className="text-luxe-muted hover:text-black font-serif text-lg font-bold">&times;</button>
                </div>

                <form onSubmit={handleBannerSave} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-bold text-luxe-dark">Titre de l'Affiche *</label>
                    <input
                      type="text"
                      required
                      value={currentBanner.title}
                      onChange={(e) => setCurrentBanner((p: any) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Soldes Exceptionnels d'USA 🇺🇸"
                      className="w-full p-2 rounded-xl border border-warm-cream"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-luxe-dark">Texte de Description *</label>
                    <textarea
                      required
                      rows={2}
                      value={currentBanner.subtitle}
                      onChange={(e) => setCurrentBanner((p: any) => ({ ...p, subtitle: e.target.value }))}
                      placeholder="e.g. 15% de reise sur tous les ThinkPads"
                      className="w-full p-2 rounded-xl border border-warm-cream"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-luxe-dark">URL Image de fond *</label>
                    <input
                      type="text"
                      required
                      value={currentBanner.image}
                      onChange={(e) => setCurrentBanner((p: any) => ({ ...p, image: e.target.value }))}
                      placeholder="Lien d'image de fond"
                      className="w-full p-2 rounded-xl border border-warm-cream font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-luxe-dark">Type de Bannière</label>
                    <select
                      value={currentBanner.type}
                      onChange={(e) => setCurrentBanner((p: any) => ({ ...p, type: e.target.value }))}
                      className="w-full p-2 rounded-xl border border-warm-cream bg-white text-xs"
                    >
                      <option value="Homepage Banner">Homepage Banner (Slider principal)</option>
                      <option value="Promo Banner">Promo Banner (Encadré promotionnel)</option>
                      <option value="Announcement Banner">Announcement Banner (Ruban haut de page)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-luxe-dark">Lien d'Action (URL)</label>
                      <input
                        type="text"
                        value={currentBanner.link}
                        onChange={(e) => setCurrentBanner((p: any) => ({ ...p, link: e.target.value }))}
                        className="w-full p-2 rounded-xl border border-warm-cream font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-luxe-dark">Statut</label>
                      <select
                        value={currentBanner.status}
                        onChange={(e) => setCurrentBanner((p: any) => ({ ...p, status: e.target.value }))}
                        className="w-full p-2 rounded-xl border border-warm-cream bg-white text-xs"
                      >
                        <option value="Actif">Actif (En diffusion)</option>
                        <option value="Inactif">Inactif (Désactivé)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-warm-cream pt-3.5">
                    <button
                      type="button"
                      onClick={() => setBannerFormOpen(false)}
                      className="px-3.5 py-1.5 border border-grey rounded-xl font-bold font-sans"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4.5 py-1.5 bg-luxe-copper hover:bg-luxe-dark text-white rounded-xl font-bold font-sans"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      )}

      {subTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-extrabold text-luxe-muted block">Avis sur le service (page d’accueil)</span>
            <button
              onClick={fetchCMSData}
              className="px-3.5 py-1.5 bg-warm-cream hover:bg-white text-luxe-dark rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer border border-warm-cream-dark flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualiser
            </button>
          </div>

          {serviceReviews.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl border border-warm-cream-dark shadow-sm text-xs text-luxe-muted">
              Aucun avis pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {serviceReviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-warm-cream-dark rounded-2xl overflow-hidden shadow-xs p-5 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h5 className="font-serif font-bold text-sm text-luxe-dark truncate">
                        {String(rev.author || 'Client')}
                      </h5>
                      <div className="text-[10px] text-luxe-muted font-mono mt-0.5">
                        {String(rev.city || '—')} • {new Date(String(rev.createdAt || '')).toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleServiceReviewDelete(String(rev.id))}
                      disabled={currentRole === 'Editor'}
                      className="px-3 py-1.5 border border-red-150 hover:bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Sparkles
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Number(rev.rating || 5) ? 'text-luxe-orange' : 'text-warm-cream-dark/60'}`}
                      />
                    ))}
                    <span className="text-[10px] text-luxe-muted font-mono ml-2">
                      {Number(rev.rating || 5)}/5
                    </span>
                  </div>

                  <div className="text-xs text-luxe-dark/90 leading-relaxed whitespace-pre-wrap">
                    {String(rev.comment || '').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
