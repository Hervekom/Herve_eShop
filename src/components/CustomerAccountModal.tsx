import React, { useState, useEffect } from 'react';
import { 
  X, Check, Laptop, Sparkles, PhoneCall, Mail, MapPin, Bell,
  User, LogOut, Loader2, Lock, Eye, EyeOff, Edit, ClipboardList, RefreshCw
} from 'lucide-react';
import API, { getCachedGuestUser, getGuestToken } from '../lib/api';
import { QuoteRequest } from '../types';

interface CustomerAccountModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
  triggerToast: (title: string, message: string, type?: string) => void;
}

const CAMEROON_CITIES = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Garoua',
  'Kribi',
  'Bamenda',
  'Buea',
  'Maroua',
  'Ngaoundéré',
  'Ebolowa',
  'Bertoua'
];

export default function CustomerAccountModal({
  onClose,
  onSuccess,
  triggerToast
}: CustomerAccountModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'dashboard'>('login');
  
  // Auth Form parameters
  const [identifier, setIdentifier] = useState(''); // Email or Phone for login
  const [password, setPassword] = useState('');
  
  // Register parameters
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Douala');
  const [regPassword, setRegPassword] = useState('');

  // Edit profile parameters
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // UI state keys
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<QuoteRequest | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const cached = getCachedGuestUser();
    const token = getGuestToken();
    if (cached && token) {
      setCurrentUser(cached);
      setActiveTab('dashboard');
      fetchProfileData();
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = getGuestToken();
      if (!token) {
        setNotifications([]);
        setUnreadNotifications(0);
        return;
      }
      const res = await API.getCustomerNotifications();
      const list = Array.isArray(res?.notifications) ? res.notifications : [];
      setNotifications(list);
      setUnreadNotifications(Number(res?.unreadCount || 0));
    } catch {
      setNotifications([]);
      setUnreadNotifications(0);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await API.markCustomerNotificationsRead();
      await fetchNotifications();
    } catch (err) {
      triggerToast('Erreur', (err as Error).message, 'danger');
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await API.getCustomerProfile();
      if (res.success) {
        setCurrentUser(res.user);
        setQuotes(res.orders || []);
        
        // Populate edit status fields
        setEditName(res.user.name || '');
        setEditEmail(res.user.email || '');
        setEditPhone(res.user.phone || '');
        setEditCity(res.user.city || 'Douala');
      }
    } catch (err) {
      console.error('Failed to load profile details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      triggerToast('Champs requis ⚠️', 'Veuillez saisir votre identifiant et votre mot de passe.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await API.loginCustomer({ identifier: identifier.trim(), password });
      if (res.success) {
        setCurrentUser(res.user);
        setActiveTab('dashboard');
        onSuccess(res.user);
        triggerToast('Connexion réussie ! 👋', `Bienvenue de retour, ${res.user.name}!`, 'success');
        fetchProfileData();
        fetchNotifications();
      }
    } catch (err) {
      triggerToast('Erreur d\'identification ❌', (err as Error).message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPassword.trim() || !regCity) {
      triggerToast('Champs requis ⚠️', 'Le nom complet, la ville et le mot de passe sont obligatoires.', 'warning');
      return;
    }

    if (!regEmail.trim() && !regPhone.trim()) {
      triggerToast('Information requise ⚠️', 'Veuillez renseigner au moins un email ou un numéro de téléphone.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        city: regCity,
        password: regPassword
      };

      const res = await API.registerCustomer(payload);
      if (res.success) {
        if (res.token) {
          setCurrentUser(res.user);
          setActiveTab('dashboard');
          onSuccess(res.user);
          triggerToast('Compte créé avec succès ! 🎉', `Votre espace client Herve_eShop a été configuré, ${res.user.name}.`, 'success');
          fetchProfileData();
        } else {
          try {
            const identifierToUse = regEmail.trim() || regPhone.trim();
            const loginRes = await API.loginCustomer({ identifier: identifierToUse, password: regPassword });
            if (loginRes.success) {
              setCurrentUser(loginRes.user);
              setActiveTab('dashboard');
              onSuccess(loginRes.user);
              triggerToast('Compte créé et connecté ! 🎉', `Bienvenue, ${loginRes.user.name}.`, 'success');
              fetchProfileData();
              fetchNotifications();
            }
          } catch {
            setActiveTab('login');
            triggerToast('Compte créé', 'Votre compte a été créé. Connectez-vous pour publier des avis et suivre vos commandes.', 'info');
          }
        }
      }
    } catch (err) {
      triggerToast('Échec d\'inscription ❌', (err as Error).message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      triggerToast('Champs requis ⚠️', 'Le nom complet ne peut pas être vide.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        city: editCity
      };
      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      const res = await API.updateCustomerProfile(payload);
      if (res.success) {
        setCurrentUser(res.user);
        setIsEditingProfile(false);
        setEditPassword('');
        triggerToast('Profil mis à jour ! 💾', 'Vos modifications ont été enregistrées avec succès.', 'success');
        fetchProfileData();
      }
    } catch (err) {
      triggerToast('Mise à jour échouée ❌', (err as Error).message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    API.logoutCustomer();
    setCurrentUser(null);
    setQuotes([]);
    setNotifications([]);
    setUnreadNotifications(0);
    setActiveTab('login');
    onSuccess(null);
    triggerToast('Déconnexion ! 🚪', 'Vous avez été déconnecté de votre espace client.', 'info');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })
      .format(price)
      .replace('XAF', 'FCFA')
      .replace('FCFA', 'FCFA');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Demande reçue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Devis validé':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'En préparation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Prêt pour livraison':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Livré':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Refusé':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-luxe-dark/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        className="bg-warm-cream w-full max-w-2xl rounded-3xl border border-luxe-gold/30 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        id="customer-account-modal-container"
      >
        {/* Banner header decoration */}
        <div className="bg-gradient-to-r from-luxe-dark via-luxe-copper to-luxe-dark py-4 px-6 md:px-8 text-white flex justify-between items-center relative select-none">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-luxe-gold to-luxe-orange"></div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl">
              <User className="w-5 h-5 text-luxe-gold" />
            </span>
            <div>
              <h4 className="font-serif font-bold text-lg md:text-xl tracking-tight text-warm-cream">
                {activeTab === 'dashboard' ? 'Espace Personnel' : 'Espace Client'}
              </h4>
              <p className="text-[10px] uppercase font-bold tracking-widest text-luxe-gold/80">
                {activeTab === 'dashboard' ? `Herve_eShop • ${currentUser?.name}` : 'Herve_eShop Cameroun'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/25 transition-all outline-none"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="customer-modal-inner-scroll">
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="text-center mb-6">
                <Sparkles className="w-8 h-8 text-luxe-gold mx-auto mb-2 animate-bounce" />
                <h5 className="font-serif font-bold text-lg text-luxe-dark">Accéder à mon espace sécurisé</h5>
                <p className="text-xs text-luxe-muted mt-1 max-w-sm mx-auto">
                  Consultez l'historique complet et suivez en direct l'état de préparation de vos demandes de devis d'ordinateurs d'importation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="login-identity-input" className="block text-xs font-bold uppercase tracking-wider text-luxe-dark mb-1.5">
                    Adresse Email ou Numéro de Téléphone
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="login-identity-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. jean@gmail.com ou 677889900"
                      className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                      disabled={loading}
                    />
                    <div className="absolute left-3.5 top-3.5 text-luxe-muted">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password-input" className="block text-xs font-bold uppercase tracking-wider text-luxe-dark mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Saisissez votre mot de passe"
                      className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                      disabled={loading}
                    />
                    <div className="absolute left-3.5 top-3.5 text-luxe-muted">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-luxe-muted hover:text-luxe-dark cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-luxe-dark hover:bg-luxe-copper text-white font-bold tracking-wide text-xs uppercase transition-all duration-300 mt-6 shadow-md flex items-center justify-center gap-2"
                id="submit-login-customer-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              <div className="text-center pt-4 border-t border-warm-cream-dark/60">
                <span className="text-xs text-luxe-muted">Vous n'avez pas encore de compte utilisateur ?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setShowPassword(false);
                  }}
                  className="block mx-auto mt-1 font-extrabold text-luxe-orange hover:text-luxe-dark text-xs transition-colors underline underline-offset-4"
                >
                  Créer un compte en 1 minute
                </button>
              </div>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-4">
                <h5 className="font-serif font-bold text-lg text-luxe-dark">Créer un compte client gratuit</h5>
                <p className="text-xs text-luxe-muted mt-1">
                  Rejoignez la communauté d'Herve_eShop pour gérer au mieux vos envies d'équipements de qualité certifiée.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-name" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="reg-name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Jean-Pierre Ngué"
                    className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="reg-city" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                    Ville de résidence *
                  </label>
                  <select
                    id="reg-city"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white font-medium"
                    disabled={loading}
                  >
                    {CAMEROON_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                    Adresse Email (Optionnel *)
                  </label>
                  <input
                    type="email"
                    id="reg-email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. jp.ngue@gmail.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                    Numéro de Téléphone (Optionnel *)
                  </label>
                  <input
                    type="tel"
                    id="reg-phone"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. +237 677 88 99 00"
                    className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="reg-pass" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reg-pass"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-luxe-muted"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-luxe-muted italic mt-2 text-center md:text-left">
                * Note : Vous devez renseigner au moins une adresse email ou un numéro de téléphone pour pouvoir vous connecter ultérieurement.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-luxe-orange hover:bg-luxe-dark text-white font-bold tracking-wide text-xs uppercase transition-all duration-300 mt-4 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                id="submit-register-customer-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  'Confirmer mon inscription'
                )}
              </button>

              <div className="text-center pt-3 border-t border-warm-cream-dark/60 mt-4">
                <span className="text-xs text-luxe-muted">Vous avez déjà configuré un compte ?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setShowPassword(false);
                  }}
                  className="block mx-auto mt-1 font-extrabold text-luxe-dark hover:text-luxe-orange text-xs underline underline-offset-4"
                >
                  Retourner à la connexion
                </button>
              </div>
            </form>
          )}

          {activeTab === 'dashboard' && currentUser && (
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="bg-white rounded-2xl border border-warm-cream-dark p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-luxe-copper/10 text-luxe-copper font-serif font-black flex items-center justify-center text-lg shadow-inner select-none uppercase">
                    {currentUser.name ? currentUser.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-lg text-luxe-dark">Bonjour, {currentUser.name} 👋</h5>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-medium text-xs text-luxe-muted items-center">
                      {currentUser.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {currentUser.email}
                        </span>
                      )}
                      {currentUser.phone && (
                        <span className="flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5" />
                          {currentUser.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {currentUser.city}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 self-end md:self-auto w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      // Reset values
                      setEditName(currentUser.name || '');
                      setEditEmail(currentUser.email || '');
                      setEditPhone(currentUser.phone || '');
                      setEditCity(currentUser.city || 'Douala');
                      setEditPassword('');
                    }}
                    className="p-2 text-xs font-bold rounded-xl border border-warm-cream-dark hover:bg-warm-cream-dark/30 text-luxe-dark flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifier Profil
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-xs font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </button>
                </div>
              </div>

              {/* Editing Profile Screen Toggle */}
              {isEditingProfile && (
                <form onSubmit={handleUpdateProfile} className="bg-white/80 border border-luxe-gold/20 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-300">
                  <h6 className="font-serif font-bold text-sm text-luxe-dark border-b pb-2">Modifier mes coordonnées personnelles</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark bg-white"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-city" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                        Ville
                      </label>
                      <select
                        id="edit-city"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark bg-white font-medium"
                        disabled={loading}
                      >
                        {CAMEROON_CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-email" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                        Adresse Email
                      </label>
                      <input
                        type="email"
                        id="edit-email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark bg-white"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-phone" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                        Numéro de téléphone
                      </label>
                      <input
                        type="text"
                        id="edit-phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark bg-white"
                        disabled={loading}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="edit-pass" className="block text-[10px] font-bold uppercase tracking-wider text-luxe-dark mb-1">
                        Nouveau mot de passe (Laisser vide si inchangé)
                      </label>
                      <input
                        type="password"
                        id="edit-pass"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Nouveau mot de passe de sécurisation"
                        className="w-full text-xs p-2.5 rounded-xl border border-warm-cream-dark bg-white"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-luxe-muted border border-warm-cream-dark hover:bg-neutral-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-luxe-gold hover:bg-luxe-dark shadow-sm flex items-center gap-1"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Sauvegarder les modifications
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-warm-cream-dark p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-warm-cream-dark/60 pb-2">
                  <h6 className="font-serif font-bold text-md text-luxe-dark flex items-center gap-2">
                    <Bell className="w-4 h-4 text-luxe-copper" />
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center bg-luxe-orange text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </h6>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchNotifications}
                      className="p-1 px-2.5 rounded-lg border border-warm-cream-dark text-[10px] font-bold uppercase text-luxe-muted hover:text-luxe-dark bg-white hover:bg-neutral-50 flex items-center gap-1"
                      title="Rafraîchir"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Actualiser
                    </button>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="p-1 px-2.5 rounded-lg border border-warm-cream-dark text-[10px] font-bold uppercase text-luxe-muted hover:text-luxe-dark bg-white hover:bg-neutral-50"
                      disabled={unreadNotifications <= 0}
                    >
                      Marquer comme lu
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-xs text-luxe-muted">
                    Aucune notification pour le moment.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 6).map((n: any) => (
                      <div
                        key={String(n.id)}
                        className="p-3 rounded-xl border border-warm-cream-dark/70 bg-warm-cream/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold text-luxe-dark text-xs truncate">
                              {String(n.title || 'Notification')}
                            </div>
                            {n.message && (
                              <div className="text-[10px] text-luxe-muted mt-0.5 break-words">
                                {String(n.message)}
                              </div>
                            )}
                          </div>
                          {n.createdAt && (
                            <div className="text-[9px] text-luxe-muted whitespace-nowrap font-mono">
                              {new Date(String(n.createdAt)).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {notifications.length > 6 && (
                      <div className="text-[10px] text-luxe-muted">
                        + {notifications.length - 6} autre(s)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quotes / Order history section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-warm-cream-dark/60 pb-2">
                  <h6 className="font-serif font-bold text-md text-luxe-dark flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-luxe-copper" />
                    Suivi de mes devis d'ordinateurs
                  </h6>
                  <button
                    type="button"
                    onClick={fetchProfileData}
                    className="p-1 px-2.5 rounded-lg border border-warm-cream-dark text-[10px] font-bold uppercase text-luxe-muted hover:text-luxe-dark bg-white hover:bg-neutral-50 flex items-center gap-1"
                    title="Rafraîchir"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Actualiser
                  </button>
                </div>

                {loading && quotes.length === 0 ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-luxe-gold mx-auto" />
                    <p className="text-xs text-luxe-muted mt-2">Recherche de vos demandes de devis d'atelier en ligne...</p>
                  </div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-warm-cream-dark/80">
                    <Laptop className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-luxe-dark">Aucune demande de devis enregistrée</p>
                    <p className="text-[10px] text-luxe-muted mt-1 max-w-xs mx-auto">
                      Vos devis s'afficheront instantanément ici dès que vous soumettrez une demande de personnalisation sur notre catalogue d'ordinateurs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((q) => (
                      <div 
                        key={q.id}
                        className="p-4 bg-white hover:bg-neutral-50 rounded-2xl border border-warm-cream-dark hover:border-luxe-gold/30 transition-all shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-luxe-copper uppercase tracking-wider select-all">
                              #{q.id}
                            </span>
                            <span className="text-[10px] text-luxe-muted">•</span>
                            <span className="text-xs text-luxe-muted">
                              {new Date(q.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <h6 className="font-serif font-bold text-sm text-luxe-dark mt-1">
                            {q.laptopBrand} {q.laptopModel}
                          </h6>

                          <div className="flex gap-2 items-center flex-wrap mt-1.5 text-[10px] text-luxe-muted">
                            <span className="font-bold text-luxe-dark">{formatPrice(q.finalPrice)}</span>
                            <span>•</span>
                            <span>RAM: {q.customizations.ramUpgrade}</span>
                            <span>•</span>
                            <span>Disque: {q.customizations.storageUpgrade}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(q.status)}`}>
                            {q.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedQuoteDetail(q)}
                            className="px-3 py-1.5 text-[10px] font-bold text-white bg-luxe-dark hover:bg-luxe-copper rounded-xl transition-colors cursor-pointer"
                          >
                            Détail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Quote Detail Panel Modal Slider Overlay */}
        {selectedQuoteDetail && (
          <div className="fixed inset-0 bg-black/40 z-60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-warm-cream max-w-md w-full rounded-3xl border border-luxe-gold p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-2">
                <h6 className="font-serif font-bold text-sm text-luxe-dark flex items-center gap-1">
                  <Laptop className="w-4 h-4 text-luxe-copper" />
                  Détails du Devis #{selectedQuoteDetail.id}
                </h6>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteDetail(null)}
                  className="p-1 text-luxe-muted hover:text-luxe-dark font-black"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-luxe-dark">
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <div>
                    <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">État du Devis</span>
                    <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-black border ${getStatusColor(selectedQuoteDetail.status)}`}>
                      {selectedQuoteDetail.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Prix final estimé</span>
                    <span className="font-extrabold text-luxe-orange text-sm">{formatPrice(selectedQuoteDetail.finalPrice)}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Modèle sélectionné</span>
                  <span className="font-extrabold text-luxe-dark">{selectedQuoteDetail.laptopBrand} {selectedQuoteDetail.laptopModel}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-warm-cream-dark/60 space-y-1.5">
                  <span className="block text-[10px] text-luxe-muted uppercase font-black tracking-wider border-b pb-1">Spécifications personnalisées :</span>
                  <div>
                    <span className="text-luxe-muted font-bold">Mémoire vive (RAM) :</span> {selectedQuoteDetail.customizations.ramUpgrade}
                  </div>
                  <div>
                    <span className="text-luxe-muted font-bold">Autre stockage SSD :</span> {selectedQuoteDetail.customizations.storageUpgrade}
                  </div>
                  <div>
                    <span className="text-luxe-muted font-bold">Plateforme Système OS :</span> {selectedQuoteDetail.customizations.osOption}
                  </div>
                  {selectedQuoteDetail.customizations.accessories && selectedQuoteDetail.customizations.accessories.length > 0 && (
                    <div>
                      <span className="text-luxe-muted font-bold block">Accessoires & extensions :</span>
                      <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[11px]">
                        {selectedQuoteDetail.customizations.accessories.map((acc, idx) => (
                          <li key={idx}>{acc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {selectedQuoteDetail.additionalNotes && (
                  <div>
                    <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Notes transmises à Hervé</span>
                    <p className="bg-white p-2.5 rounded-xl border italic mt-1 text-[11px] leading-relaxed">
                      "{selectedQuoteDetail.additionalNotes}"
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                className="w-full py-2 bg-luxe-dark text-white rounded-xl text-xs uppercase font-extrabold cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
