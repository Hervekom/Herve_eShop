import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Edit,
  Eye,
  EyeOff,
  Heart,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  PhoneCall,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import API, { getCachedGuestUser, getGuestToken } from '../lib/api';
import { Laptop as LaptopProduct, QuoteRequest } from '../types';

interface CustomerAccountModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
  triggerToast: (title: string, message: string, type?: string) => void;
  initialSection?: 'overview' | 'orders' | 'favorites' | 'settings';
  favouriteProducts?: LaptopProduct[];
  onOpenFavourite?: (laptop: LaptopProduct) => void;
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
  triggerToast,
  initialSection = 'overview',
  favouriteProducts = [],
  onOpenFavourite,
}: CustomerAccountModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'dashboard'>('login');
  const [dashboardSection, setDashboardSection] = useState<'overview' | 'orders' | 'favorites' | 'settings'>(initialSection);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Douala');
  const [regPassword, setRegPassword] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<QuoteRequest | null>(null);

  useEffect(() => {
    const cached = getCachedGuestUser();
    const token = getGuestToken();
    if (cached && token) {
      setCurrentUser(cached);
      setActiveTab('dashboard');
      setDashboardSection(initialSection);
      fetchProfileData();
    }
  }, [initialSection]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setDashboardSection(initialSection);
    }
  }, [initialSection, activeTab]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await API.getCustomerProfile();
      if (res.success) {
        setCurrentUser(res.user);
        setQuotes(res.orders || []);
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
        setDashboardSection(initialSection);
        onSuccess(res.user);
        triggerToast('Connexion réussie', `Bienvenue de retour, ${res.user.name}.`, 'success');
        fetchProfileData();
      }
    } catch (err) {
      triggerToast('Erreur d\'identification', (err as Error).message, 'danger');
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
          setDashboardSection(initialSection);
          onSuccess(res.user);
          triggerToast('Compte créé avec succès', `Votre espace client Herve_eShop a été configuré pour ${res.user.name}.`, 'success');
          fetchProfileData();
        } else {
          try {
            const identifierToUse = regEmail.trim() || regPhone.trim();
            const loginRes = await API.loginCustomer({ identifier: identifierToUse, password: regPassword });
            if (loginRes.success) {
              setCurrentUser(loginRes.user);
              setActiveTab('dashboard');
              setDashboardSection(initialSection);
              onSuccess(loginRes.user);
              triggerToast('Compte créé et connecté', `Bienvenue, ${loginRes.user.name}.`, 'success');
              fetchProfileData();
            }
          } catch {
            setActiveTab('login');
            triggerToast('Compte créé', 'Votre compte a été créé. Connectez-vous pour publier des avis et suivre vos commandes.', 'info');
          }
        }
      }
    } catch (err) {
      triggerToast('Échec d\'inscription', (err as Error).message, 'danger');
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
        onSuccess(res.user);
        triggerToast('Profil mis à jour', 'Vos modifications ont été enregistrées avec succès.', 'success');
        fetchProfileData();
      }
    } catch (err) {
      triggerToast('Mise à jour échouée', (err as Error).message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    API.logoutCustomer();
    setCurrentUser(null);
    setQuotes([]);
    setActiveTab('login');
    onSuccess(null);
    triggerToast('Déconnexion', 'Vous avez été déconnecté de votre espace client.', 'info');
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

  const stats = useMemo(() => {
    const totalOrders = quotes.length;
    const pendingOrders = quotes.filter((quote) => quote.status !== 'Livré' && quote.status !== 'Refusé').length;
    const deliveredOrders = quotes.filter((quote) => quote.status === 'Livré').length;
    return { totalOrders, pendingOrders, deliveredOrders };
  }, [quotes]);

  const openProfileEditor = () => {
    setIsEditingProfile(true);
    setDashboardSection('settings');
    setEditName(currentUser?.name || '');
    setEditEmail(currentUser?.email || '');
    setEditPhone(currentUser?.phone || '');
    setEditCity(currentUser?.city || 'Douala');
    setEditPassword('');
  };

  const renderProfileForm = () => (
    <form onSubmit={handleUpdateProfile} className="bg-white border border-luxe-gold/20 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-warm-cream-dark/60 pb-3">
        <div>
          <h6 className="type-card-title !text-[1.05rem] text-luxe-dark">Account Settings</h6>
          <p className="type-meta text-luxe-muted mt-1">
            Update your personal details and security information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditingProfile(false)}
          className="type-button px-3 py-2 rounded-xl border border-warm-cream-dark text-luxe-muted hover:text-luxe-dark hover:bg-warm-cream"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-name" className="field-label block text-luxe-dark mb-1.5">
            Full name
          </label>
          <input
            type="text"
            id="edit-name"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="edit-city" className="field-label block text-luxe-dark mb-1.5">
            City
          </label>
          <select
            id="edit-city"
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
            className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white"
            disabled={loading}
          >
            {CAMEROON_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-email" className="field-label block text-luxe-dark mb-1.5">
            Email address
          </label>
          <input
            type="email"
            id="edit-email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="edit-phone" className="field-label block text-luxe-dark mb-1.5">
            Phone number
          </label>
          <input
            type="text"
            id="edit-phone"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white"
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="edit-pass" className="field-label block text-luxe-dark mb-1.5">
            New password
          </label>
          <input
            type="password"
            id="edit-pass"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Leave blank to keep your current password"
            className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="type-button inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-luxe-dark text-white hover:bg-luxe-copper"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-luxe-dark/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        className="bg-warm-cream w-full max-w-5xl rounded-3xl border border-luxe-gold/30 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        id="customer-account-modal-container"
      >
        <div className="bg-gradient-to-r from-luxe-dark via-luxe-copper to-luxe-dark py-4 px-6 md:px-8 text-white flex justify-between items-center relative select-none">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-luxe-gold to-luxe-orange"></div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl">
              <User className="w-5 h-5 text-luxe-gold" />
            </span>
            <div>
              <h4 className="type-section-title !text-[clamp(1.45rem,2vw,1.85rem)] text-warm-cream">
                {activeTab === 'dashboard' ? 'Personal Area' : 'Customer Account'}
              </h4>
              <p className="field-label text-luxe-gold/80">
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

        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="customer-modal-inner-scroll">
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="text-center mb-6">
                <Sparkles className="w-8 h-8 text-luxe-gold mx-auto mb-2 animate-bounce" />
                <h5 className="type-card-title !text-xl text-luxe-dark">Access your personal dashboard</h5>
                <p className="type-meta text-luxe-muted mt-1 max-w-sm mx-auto">
                  Manage your profile, review your order history, save favorites, and keep your account information up to date.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="login-identity-input" className="field-label block text-luxe-dark mb-1.5">
                    Email address or phone number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="login-identity-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. jean@gmail.com or 677889900"
                      className="field-input w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                      disabled={loading}
                    />
                    <div className="absolute left-3.5 top-3.5 text-luxe-muted">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password-input" className="field-label block text-luxe-dark mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="field-input w-full pl-10 pr-10 py-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
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
                className="type-button w-full py-3 rounded-xl bg-luxe-dark hover:bg-luxe-copper text-white transition-all duration-300 mt-6 shadow-md flex items-center justify-center gap-2"
                id="submit-login-customer-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking your account...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="text-center pt-4 border-t border-warm-cream-dark/60">
                <span className="type-meta text-luxe-muted">Do you need a customer account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setShowPassword(false);
                  }}
                  className="type-button block mx-auto mt-1 text-luxe-orange hover:text-luxe-dark transition-colors underline underline-offset-4"
                >
                  Create one in a minute
                </button>
              </div>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-4">
                <h5 className="type-card-title !text-xl text-luxe-dark">Create your customer account</h5>
                <p className="type-meta text-luxe-muted mt-1">
                  Set up your personal area to manage orders, favorites, and account information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-name" className="field-label block text-luxe-dark mb-1">
                    Full name *
                  </label>
                  <input
                    type="text"
                    id="reg-name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Jean-Pierre Ngue"
                    className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="reg-city" className="field-label block text-luxe-dark mb-1">
                    City *
                  </label>
                  <select
                    id="reg-city"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  >
                    {CAMEROON_CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-email" className="field-label block text-luxe-dark mb-1">
                    Email address (Optional)
                  </label>
                  <input
                    type="email"
                    id="reg-email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. jp.ngue@gmail.com"
                    className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="reg-phone" className="field-label block text-luxe-dark mb-1">
                    Phone number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="reg-phone"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. +237 677 88 99 00"
                    className="field-input w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="reg-pass" className="field-label block text-luxe-dark mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reg-pass"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="field-input w-full px-2.5 py-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
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

              <p className="type-meta text-luxe-muted italic mt-2 text-center md:text-left">
                Add at least one email address or phone number so you can sign in later.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="type-button w-full py-3 rounded-xl bg-luxe-orange hover:bg-luxe-dark text-white transition-all duration-300 mt-4 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                id="submit-register-customer-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>

              <div className="text-center pt-3 border-t border-warm-cream-dark/60 mt-4">
                <span className="type-meta text-luxe-muted">Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setShowPassword(false);
                  }}
                  className="type-button block mx-auto mt-1 text-luxe-dark hover:text-luxe-orange underline underline-offset-4"
                >
                  Go back to sign in
                </button>
              </div>
            </form>
          )}

          {activeTab === 'dashboard' && currentUser && (
            <div className="grid grid-cols-1 xl:grid-cols-[260px,minmax(0,1fr)] gap-6">
              <aside className="space-y-4">
                <div className="bg-white rounded-2xl border border-warm-cream-dark p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-luxe-copper/10 text-luxe-copper font-black flex items-center justify-center text-lg uppercase">
                      {currentUser.name ? currentUser.name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h5 className="type-card-title !text-[1.05rem] text-luxe-dark">
                        {currentUser.name}
                      </h5>
                      <p className="type-meta text-luxe-muted mt-1">
                        Personal dashboard
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-warm-cream px-3 py-3 border border-warm-cream-dark/70">
                      <div className="type-card-title !text-[1rem] text-luxe-dark">{stats.totalOrders}</div>
                      <div className="type-meta text-luxe-muted mt-1">Orders</div>
                    </div>
                    <div className="rounded-2xl bg-warm-cream px-3 py-3 border border-warm-cream-dark/70">
                      <div className="type-card-title !text-[1rem] text-luxe-dark">{favouriteProducts.length}</div>
                      <div className="type-meta text-luxe-muted mt-1">Favorites</div>
                    </div>
                    <div className="rounded-2xl bg-warm-cream px-3 py-3 border border-warm-cream-dark/70">
                      <div className="type-card-title !text-[1rem] text-luxe-dark">{stats.pendingOrders}</div>
                      <div className="type-meta text-luxe-muted mt-1">Open</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-warm-cream-dark p-3 shadow-sm space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'orders', label: 'Orders', icon: ClipboardList },
                    { id: 'favorites', label: 'Favorites', icon: Heart },
                    { id: 'settings', label: 'Settings', icon: Settings },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = dashboardSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDashboardSection(item.id as 'overview' | 'orders' | 'favorites' | 'settings')}
                        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                          active
                            ? 'bg-luxe-dark text-white shadow-sm'
                            : 'text-luxe-dark hover:bg-warm-cream'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-luxe-gold' : 'text-luxe-copper'}`} />
                        <span className="type-button">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl border border-warm-cream-dark p-3 shadow-sm space-y-2">
                  <button
                    type="button"
                    onClick={openProfileEditor}
                    className="w-full type-button flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-warm-cream-dark hover:bg-warm-cream text-luxe-dark"
                  >
                    <Edit className="w-4 h-4" />
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full type-button flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </aside>

              <div className="space-y-6">
                {dashboardSection === 'overview' && (
                  <>
                    <div className="bg-white rounded-2xl border border-warm-cream-dark p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <span className="type-kicker text-luxe-copper">Personal Profile</span>
                          <h5 className="type-section-title !text-[clamp(1.5rem,2vw,2rem)] mt-2 text-luxe-dark">
                            Manage your account details in one place
                          </h5>
                          <p className="type-meta text-luxe-muted mt-3 max-w-2xl">
                            Your Personal Area focuses only on your account, orders, favorites, and settings. Notifications are available separately from the bell icon in the header.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openProfileEditor}
                          className="type-button inline-flex items-center gap-2 rounded-full bg-luxe-dark px-4 py-2.5 text-white hover:bg-luxe-copper"
                        >
                          <Edit className="w-4 h-4 text-luxe-gold" />
                          Update profile
                        </button>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-warm-cream-dark bg-warm-cream/50 p-4">
                          <div className="type-badge text-luxe-muted">Contact</div>
                          <div className="mt-3 space-y-2 type-meta text-luxe-dark">
                            {currentUser.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-luxe-copper" /> {currentUser.email}</div>}
                            {currentUser.phone && <div className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-luxe-copper" /> {currentUser.phone}</div>}
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-luxe-copper" /> {currentUser.city || 'Not provided'}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-warm-cream-dark bg-warm-cream/50 p-4">
                          <div className="type-badge text-luxe-muted">Activity</div>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="type-meta text-luxe-muted">Total orders</span>
                              <span className="type-card-title !text-[1rem] text-luxe-dark">{stats.totalOrders}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="type-meta text-luxe-muted">Pending orders</span>
                              <span className="type-card-title !text-[1rem] text-luxe-dark">{stats.pendingOrders}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="type-meta text-luxe-muted">Saved favorites</span>
                              <span className="type-card-title !text-[1rem] text-luxe-dark">{favouriteProducts.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isEditingProfile && renderProfileForm()}
                  </>
                )}

                {dashboardSection === 'orders' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-warm-cream-dark/60 pb-3">
                      <div>
                        <h6 className="type-card-title !text-[1.1rem] text-luxe-dark flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-luxe-copper" />
                          Order Tracking
                        </h6>
                        <p className="type-meta text-luxe-muted mt-1">
                          Review your quotes and follow each request status.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchProfileData}
                        className="type-button inline-flex items-center gap-2 rounded-xl border border-warm-cream-dark bg-white px-3 py-2 hover:bg-warm-cream"
                        title="Refresh"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                    </div>

                    {loading && quotes.length === 0 ? (
                      <div className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-luxe-gold mx-auto" />
                        <p className="type-meta text-luxe-muted mt-2">Loading your order history...</p>
                      </div>
                    ) : quotes.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-warm-cream-dark/80">
                        <Laptop className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="type-card-title !text-[1rem] text-luxe-dark">No orders yet</p>
                        <p className="type-meta text-luxe-muted mt-2 max-w-xs mx-auto">
                          Your submitted quotes and laptop requests will appear here automatically.
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
                                  {new Date(q.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <h6 className="type-card-title !text-[1rem] text-luxe-dark mt-2">
                                {q.laptopBrand} {q.laptopModel}
                              </h6>

                              <div className="flex gap-2 items-center flex-wrap mt-1.5 text-[10px] text-luxe-muted">
                                <span className="font-bold text-luxe-dark">{formatPrice(q.finalPrice)}</span>
                                <span>•</span>
                                <span>RAM: {q.customizations.ramUpgrade}</span>
                                <span>•</span>
                                <span>Storage: {q.customizations.storageUpgrade}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(q.status)}`}>
                                {q.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedQuoteDetail(q)}
                                className="type-button px-3 py-2 text-white bg-luxe-dark hover:bg-luxe-copper rounded-xl transition-colors cursor-pointer"
                              >
                                View details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {dashboardSection === 'favorites' && (
                  <div className="space-y-4">
                    <div className="border-b border-warm-cream-dark/60 pb-3">
                      <h6 className="type-card-title !text-[1.1rem] text-luxe-dark flex items-center gap-2">
                        <Heart className="w-4 h-4 text-luxe-copper" />
                        Favorites
                      </h6>
                      <p className="type-meta text-luxe-muted mt-1">
                        Reopen the products you saved for later.
                      </p>
                    </div>

                    {favouriteProducts.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-warm-cream-dark/80">
                        <Heart className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="type-card-title !text-[1rem] text-luxe-dark">No saved favorites yet</p>
                        <p className="type-meta text-luxe-muted mt-2 max-w-xs mx-auto">
                          Save products from the catalog and they will appear here in your Personal Area.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favouriteProducts.map((product) => (
                          <div key={product.id} className="bg-white rounded-2xl border border-warm-cream-dark p-4 shadow-sm flex gap-4">
                            <img
                              src={product.image}
                              alt={`${product.brand} ${product.model}`}
                              className="w-20 h-20 rounded-2xl object-cover bg-warm-cream border border-warm-cream-dark/70"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="type-badge text-luxe-muted">{product.category}</p>
                              <h6 className="type-card-title !text-[1rem] text-luxe-dark mt-1 truncate">
                                {product.brand} {product.model}
                              </h6>
                              <p className="type-meta text-luxe-muted mt-1 line-clamp-2">
                                {product.shortDescription || product.processor || product.description}
                              </p>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <span className="type-card-title !text-[1rem] text-luxe-copper">
                                  {formatPrice(product.price)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onOpenFavourite?.(product)}
                                  className="type-button px-3 py-2 rounded-xl bg-luxe-dark text-white hover:bg-luxe-copper"
                                >
                                  Open product
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {dashboardSection === 'settings' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-warm-cream-dark p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="type-kicker text-luxe-copper">Security & Preferences</span>
                          <h6 className="type-section-title !text-[clamp(1.45rem,2vw,1.9rem)] mt-2 text-luxe-dark">
                            Keep your account secure and current
                          </h6>
                          <p className="type-meta text-luxe-muted mt-3 max-w-2xl">
                            Use this section to update your identity details, contact information, city, and password.
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-luxe-dark text-luxe-gold flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {renderProfileForm()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedQuoteDetail && (
          <div className="fixed inset-0 bg-black/40 z-60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-warm-cream max-w-md w-full rounded-3xl border border-luxe-gold p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-2">
                <h6 className="font-serif font-bold text-sm text-luxe-dark flex items-center gap-1">
                  <Laptop className="w-4 h-4 text-luxe-copper" />
                  Order details #{selectedQuoteDetail.id}
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
                    <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Order status</span>
                    <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-black border ${getStatusColor(selectedQuoteDetail.status)}`}>
                      {selectedQuoteDetail.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Estimated total</span>
                    <span className="font-extrabold text-luxe-orange text-sm">{formatPrice(selectedQuoteDetail.finalPrice)}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Selected model</span>
                  <span className="font-extrabold text-luxe-dark">{selectedQuoteDetail.laptopBrand} {selectedQuoteDetail.laptopModel}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-warm-cream-dark/60 space-y-1.5">
                  <span className="block text-[10px] text-luxe-muted uppercase font-black tracking-wider border-b pb-1">Custom specifications</span>
                  <div>
                    <span className="text-luxe-muted font-bold">RAM:</span> {selectedQuoteDetail.customizations.ramUpgrade}
                  </div>
                  <div>
                    <span className="text-luxe-muted font-bold">Storage:</span> {selectedQuoteDetail.customizations.storageUpgrade}
                  </div>
                  <div>
                    <span className="text-luxe-muted font-bold">Operating system:</span> {selectedQuoteDetail.customizations.osOption}
                  </div>
                  {selectedQuoteDetail.customizations.accessories && selectedQuoteDetail.customizations.accessories.length > 0 && (
                    <div>
                      <span className="text-luxe-muted font-bold block">Accessories:</span>
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
                    <span className="block text-[10px] text-luxe-muted uppercase font-bold tracking-wider">Customer notes</span>
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
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
