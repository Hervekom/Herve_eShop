import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, LayoutDashboard, Laptop, FolderTree, ClipboardList, 
  Settings, BookOpen, Image, Database, Menu, Lock, User, RefreshCw, KeyRound
} from 'lucide-react';
import API from '../../lib/api';

// Admin modules
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminOrders from './AdminOrders';
import AdminCMS from './AdminCMS';
import AdminBlog from './AdminBlog';
import AdminMediaLibrary from './AdminMediaLibrary';
import AdminSettings from './AdminSettings';

interface AdminUser {
  id: string;
  username: string;
  role: 'Super Admin' | 'Admin' | 'Editor';
}

export default function AdminPanel({ onBackToPublic }: { onBackToPublic: () => void }) {
  // Authentication & Session
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Password reset visual form state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Sidenav controls
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'cms' | 'blog' | 'media' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // General Toast Notifications
  const [localToast, setLocalToast] = useState<{ title: string; message: string; type: string } | null>(null);

  const checkAuthToken = async () => {
    try {
      setLoadingAuth(true);
      const isOk = await API.checkSession();
      if (isOk) {
        setIsAuthenticated(true);
        // Get active user details
        const info = await API.getCurrentUser();
        setCurrentUser(info);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthToken();
  }, []);

  const triggerToast = (title: string, message: string, type: string = 'info') => {
    setLocalToast({ title, message, type });
    setTimeout(() => {
      setLocalToast(null);
    }, 5000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const res = await API.loginAdmin(username, password);
      setIsAuthenticated(true);
      setCurrentUser(res.user);
      triggerToast('Connexion Reussie 🔐', `Ravi de vous revoir ${res.user.username} (${res.user.role}) !`, 'success');
    } catch (err) {
      setErrorMessage((err as Error).message || 'Identifiants d\'atelier incorrects.');
    }
  };

  const handleLogOut = async () => {
    try {
      await API.logoutAdmin();
      setIsAuthenticated(false);
      setCurrentUser(null);
      triggerToast('Fermeture Session 👋', 'Vous avez été déconnecté en toute sécurité.');
    } catch (err) {
      triggerToast('Erreur déconnexion', 'Une défaillance est survenue.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername || !resetNewPassword) return;

    try {
      await API.resetAdminPassword(resetUsername, resetNewPassword);
      triggerToast('Pass Réinitialisé ✅', 'Le mot de passe de l\'administrateur a été reconfiguré.', 'success');
      setShowPasswordReset(false);
      setResetUsername('');
      setResetNewPassword('');
    } catch (err) {
      triggerToast('Modification refusée ❌', (err as Error).message, 'danger');
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-luxe-dark text-warm-cream flex flex-col justify-center items-center gap-4">
        <RefreshCw className="w-8 h-8 text-luxe-gold animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase text-warm-cream-dark/60">Analyse de la session d'atelier...</span>
      </div>
    );
  }

  // LOGIN CONTAINER SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-luxe-dark flex items-center justify-center p-4 antialiased selection:bg-luxe-gold/30">
        
        {/* Toast Alert */}
        {localToast && (
          <div className="fixed top-6 right-6 z-55 max-w-sm w-full bg-white text-luxe-dark rounded-2xl shadow-2xl p-4 border-l-4 border-luxe-copper font-sans text-xs flex justify-between animate-in slide-in-from-top-5">
            <div className="text-left">
              <span className="font-bold text-luxe-dark">{localToast.title}</span>
              <p className="text-luxe-muted mt-1 leading-relaxed">{localToast.message}</p>
            </div>
            <button onClick={() => setLocalToast(null)} className="font-serif font-bold">&times;</button>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 backdrop-blur-md w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 text-xs text-left relative">
          
          <div className="text-center space-y-2 mb-6.5">
            <div className="w-11 h-11 bg-luxe-copper text-white rounded-2xl flex items-center justify-center mx-auto shadow-md border border-luxe-gold/30">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="font-serif text-lg font-bold text-warm-cream tracking-tight">Espace d'Administration Hervé</h1>
            <p className="text-warm-cream-dark/60">Saisissez vos identifiants d'atelier agréés.</p>
          </div>

          {!showPasswordReset ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 leading-relaxed font-medium">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-warm-cream-dark/80 block uppercase tracking-wider text-[10px]">Identifiant Opérateur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-cream-dark/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. herve_admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 focus:border-luxe-copper focus:outline-none p-2.5 pl-10 rounded-xl text-white font-sans text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-warm-cream-dark/80 block uppercase tracking-wider text-[10px]">Clé Secrète (Mot de passe)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-cream-dark/40" />
                  <input
                    type="password"
                    required
                    placeholder="Saisissez votre clé..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 focus:border-luxe-copper focus:outline-none p-2.5 pl-10 rounded-xl text-white font-sans text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-luxe-copper hover:bg-luxe-gold text-white active:scale-98 py-3 rounded-xl font-bold uppercase tracking-wider mt-2 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <span>Accéder aux Commandes & Stocks</span>
              </button>

              <div className="flex justify-between items-center text-[10px] pt-3 text-warm-cream-dark/45">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="hover:text-luxe-gold transition-colors underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={onBackToPublic}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Retour Accueil Public &rarr;
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 bg-luxe-gold/10 border border-luxe-gold/30 rounded-xl text-luxe-gold leading-relaxed font-sans">
                🔐 <strong>Changement clé d'atelier</strong> : Saisissez l'opérateur concerné et configurez instantanément son mot de passe de secours.
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-warm-cream-dark/80 block uppercase tracking-wider text-[10px]">Nom de l'opérateur à mettre à jour</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. herve_admin"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 focus:border-luxe-copper focus:outline-none p-2.5 rounded-xl text-white font-sans text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-warm-cream-dark/80 block uppercase tracking-wider text-[10px]">Nouveau mot de passe secret</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 5 caractères autorisés"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 focus:border-luxe-copper focus:outline-none p-2.5 rounded-xl text-white font-sans text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-luxe-copper text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs"
              >
                Actualiser Clé Secrète
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordReset(false)}
                className="w-full text-center hover:text-white mt-1 pt-1 text-[10px] text-warm-cream-dark/45 block cursor-pointer"
              >
                Retournez à l'écran de connexion standard
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // INNER LOGGED MASTER VIEW
  return (
    <div className="min-h-screen bg-warm-cream text-luxe-dark flex flex-col md:flex-row antialiased selection:bg-luxe-gold/30">
      
      {/* Toast Alert popup */}
      {localToast && (
        <div className="fixed top-6 right-6 z-55 max-w-sm w-full bg-luxe-dark text-warm-cream rounded-2xl shadow-2xl p-4.5 border-2 border-luxe-gold/60 font-sans text-xs flex justify-between gap-2.5 animate-in slide-in-from-right-5 animate-bounce">
          <div className="text-left">
            <span className="font-serif font-bold text-luxe-gold block text-sm">{localToast.title}</span>
            <p className="text-warm-cream-dark/80 mt-1 leading-relaxed">{localToast.message}</p>
          </div>
          <button onClick={() => setLocalToast(null)} className="font-bold text-white font-serif text-lg">&times;</button>
        </div>
      )}

      {/* MOBILE HEADER NAVIGATION */}
      <div className="md:hidden bg-luxe-dark text-warm-cream px-4 py-3 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-sm tracking-tight text-white uppercase">Hervé Administration</span>
          <span className="text-[7.5px] uppercase bg-luxe-copper font-mono font-bold px-1.5 py-0.5 rounded text-white">{currentUser?.role}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 px-2 border border-white/10 rounded-lg text-white"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* MASTER RETRACTABLE NAVIGATION SIDEBAR */}
      <aside className={`w-64 bg-luxe-dark text-warm-cream shrink-0 flex flex-col justify-between p-5 border-r border-white/5 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-6 flex-1 flex flex-col">
          
          {/* Logo brand */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="text-left">
              <h2 className="font-serif text-base font-bold tracking-tight text-white leading-tight">Herve_eShop</h2>
              <p className="text-[10px] text-warm-cream-dark/50 mt-0.5 uppercase tracking-widest font-mono">Panel Atelier Pro</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white/60 hover:text-white"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* User badge */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5 text-left text-xs text-warm-cream">
            <div className="w-8 h-8 rounded-full bg-luxe-copper flex items-center justify-center text-white font-serif font-bold shrink-0">
              {currentUser?.username.slice(0,2).toUpperCase()}
            </div>
            <div className="block truncate">
              <h4 className="font-bold truncate">{currentUser?.username}</h4>
              <span className="text-[9px] text-luxe-gold font-mono uppercase font-extrabold">{currentUser?.role}</span>
            </div>
          </div>

          {/* Menu Link tabs */}
          <nav className="space-y-1 text-xs">
            
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Rapport d'activité & Métriques</span>
            </button>

            <button
              onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'products' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Laptop className="w-4.5 h-4.5" />
              <span>Ordinateurs & Stocks</span>
            </button>

            <button
              onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'categories' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <FolderTree className="w-4.5 h-4.5" />
              <span>Rayons & Catégories</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'orders' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5" />
              <span>Commandes & Expéditions</span>
            </button>

            <button
              onClick={() => { setActiveTab('cms'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'cms' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>CMS Paramètres du Site</span>
            </button>

            <button
              onClick={() => { setActiveTab('blog'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'blog' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>Guides d'Achat & Blog</span>
            </button>

            <button
              onClick={() => { setActiveTab('media'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'media' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Image className="w-4.5 h-4.5" />
              <span>Médiathèque & Dépôts</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-colors text-left cursor-pointer ${
                activeTab === 'settings' ? 'bg-luxe-copper text-white font-bold' : 'text-warm-cream-dark/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Database className="w-4.5 h-4.5" />
              <span>Sécurité & Clés d'Accès</span>
            </button>

          </nav>
        </div>

        {/* Footer actions inside sidenav */}
        <div className="pt-4 border-t border-white/5 space-y-2.5 text-xs text-left">
          <button
            onClick={onBackToPublic}
            className="w-full py-2 px-3 text-left hover:text-white font-bold flex items-center gap-3- text-xs text-warm-cream-dark/70 hover:bg-white/5 rounded-xl cursor-pointer"
          >
            &larr; Revenir à l'Accueil Public
          </button>
          
          <button
            onClick={handleLogOut}
            className="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl flex items-center gap-3 transition-all cursor-pointer text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold">Déconnexion Atelier</span>
          </button>
        </div>

      </aside>

      {/* PRIMARY CONTROLLER LAYER FOR SUB-COMPONENTS VIEWPORTS */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto max-h-screen">
        
        {activeTab === 'dashboard' && currentUser && (
          <AdminDashboard onSelectTab={setActiveTab} />
        )}

        {activeTab === 'products' && currentUser && (
          <AdminProducts 
            currentRole={currentUser.role} 
            onTriggerToast={triggerToast} 
          />
        )}

        {activeTab === 'categories' && currentUser && (
          <AdminCategories 
            currentRole={currentUser.role} 
            onTriggerToast={triggerToast} 
          />
        )}

        {activeTab === 'orders' && currentUser && (
          <AdminOrders 
            currentRole={currentUser.role} 
            onTriggerToast={triggerToast} 
          />
        )}

        {activeTab === 'cms' && currentUser && (
          <AdminCMS 
            currentRole={currentUser.role} 
            onTriggerToast={triggerToast} 
          />
        )}

        {activeTab === 'blog' && currentUser && (
          <AdminBlog 
            currentRole={currentUser.role} 
            onTriggerToast={triggerToast} 
          />
        )}

        {activeTab === 'media' && (
          <AdminMediaLibrary onTriggerToast={triggerToast} />
        )}

        {activeTab === 'settings' && currentUser && (
          <AdminSettings 
            currentRole={currentUser.role} 
            currentUser={currentUser.username}
            onTriggerToast={triggerToast} 
          />
        )}

      </main>

    </div>
  );
}
