import React, { useState, useEffect } from 'react';
import { 
  Database, ShieldAlert, KeyRound, Key, Plus, Trash2, Edit, RefreshCw, 
  Download, Upload, ShieldCheck, Clock, UserCheck, Eye, Search
} from 'lucide-react';
import API from '../../lib/api';

interface AdminUser {
  id: string;
  username: string;
  role: 'Super Admin' | 'Admin' | 'Editor';
  createdAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export default function AdminSettings({ 
  currentRole, 
  currentUser,
  onTriggerToast 
}: { 
  currentRole: 'Super Admin' | 'Admin' | 'Editor';
  currentUser: string;
  onTriggerToast: (title: string, message: string, type?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'users' | 'backup' | 'logs'>('users');
  const [loading, setLoading] = useState(true);

  // Users State
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [logsList, setLogsList] = useState<AuditLog[]>([]);

  // Add User Form State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Super Admin' | 'Admin' | 'Editor'>('Editor');

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const res = await API.getAdmins();
      setAdminsList(res);

      const logs = await API.getAuditLogs();
      // latest first
      setLogsList(logs.reverse());
    } catch (err) {
      onTriggerToast('Erreur ❌', 'Impossible de rapatrier les paramètres de sécurité.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'Super Admin') {
      onTriggerToast('Accès Interdit ⛔', 'Seul le Super Admin gère les droits administratifs.', 'warning');
      return;
    }

    if (!newUsername || !newPassword) return;

    try {
      await API.createAdmin({
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      onTriggerToast('Administrateur Ajouté 🎉', `Le compte de "${newUsername}" (${newRole}) est désormais actif.`, 'success');
      setUserModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      fetchSettingsData();
    } catch (err) {
      onTriggerToast('Erreur ❌', (err as Error).message, 'danger');
    }
  };

  const handleDeleteAdmin = async (adminId: string, username: string) => {
    if (currentRole !== 'Super Admin') return;
    if (username === currentUser) {
      onTriggerToast('Oups ⛔', 'Vous ne pouvez pas dissoudre votre propre compte actif !', 'warning');
      return;
    }

    if (!confirm(`Supprimer à tout jamais l'administrateur "${username}" ? Des logs d'audit seront raccordés.`)) return;

    try {
      await API.deleteAdmin(adminId);
      onTriggerToast('Compte Dissous 🔒', `L'éditeur ou admin ${username} a été radié du système.`, 'success');
      fetchSettingsData();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message);
    }
  };

  // BACKUP EXPORTER
  const downloadDatabaseBackup = async () => {
    try {
      const res = await API.getDatabaseBackupFile();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Herve_eShop_SAUVEGARDE_DURABLE_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onTriggerToast('Sauvegarde Téléchargée 📁', 'Copie complète de la table Hervé exportée en JSON local.');
    } catch (err) {
      onTriggerToast('Erreur de backup', (err as Error).message, 'danger');
    }
  };

  // RESTORE IMPORTER via JSON file upload drop
  const handleRestoreDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentRole !== 'Super Admin') {
      onTriggerToast('Refusé ⛔', 'Privilège Super Admin nécessaire pour les restaurations globales.', 'danger');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATTENTION ⚠️: Restaurer cette sauvegarde écrasera TOUTES les données actuelles de la boutique (Produits, Commandes, Paramètres). Confirmer la synchronisation d\'atelier ?')) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          await API.restoreDatabaseBackupFile(parsed);
          onTriggerToast('RESTAURATION SUCCÈS 🎉', 'Le système d\'atelier a été réinitialisé à partir de votre sauvegarde.', 'success');
          fetchSettingsData();
        } catch (jErr) {
          onTriggerToast('Fichier Incorrect ❌', 'Structure JSON invalide ou corrompue.', 'danger');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      onTriggerToast('Erreur interne', (err as Error).message);
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
          <Database className="w-5 h-5 text-luxe-copper" />
          Sécurité RLS & Gestion du Serveur
        </h3>
        <p className="text-xs text-luxe-muted mt-1 font-sans">
          Gérez l'administration, téléchargez des sauvegardes complètes en un clic, ou examinez les traces d'audit de sécurité de la boutique.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-cream gap-2 cursor-pointer pb-px scrollbar-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'users' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1.5" />
          <span>Console Rôles (Admins)</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'backup' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <Database className="w-4 h-4 inline mr-1.5" />
          <span>Sauvegardes & Restauration</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'logs' ? 'border-luxe-copper text-luxe-copper font-serif font-extrabold' : 'border-transparent text-luxe-muted hover:text-luxe-dark'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1.5" />
          <span>Audit Logs ({logsList.length})</span>
        </button>
      </div>

      {/* T1: OPERATORS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-warm-cream-dark shadow-sm">
            <div>
              <h4 className="font-serif text-sm font-bold text-luxe-dark">Équipe Éditrice Actuelle ({adminsList.length})</h4>
              <p className="text-[10px] text-luxe-muted mt-0.5">Comptes d'accès raccordés aux transactions de votre entrepôt.</p>
            </div>
            {currentRole === 'Super Admin' && (
              <button
                onClick={() => setUserModalOpen(true)}
                className="px-3.5 py-1.5 bg-luxe-copper text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inviter Équipier</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {adminsList.map((adm) => (
              <div key={adm.id} className="bg-white border border-warm-cream-dark p-4 rounded-3xl relative shadow-xs text-left">
                <span className={`absolute top-3 right-3 text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-sm border ${
                  adm.role === 'Super Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  adm.role === 'Admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {adm.role}
                </span>

                <div className="space-y-1 mt-1 block">
                  <span className="text-[9px] text-luxe-muted uppercase tracking-wider block font-bold">Identifiant Unique</span>
                  <h4 className="font-extrabold text-luxe-dark text-sm">{adm.username}</h4>
                  <span className="text-[9px] text-luxe-muted block pt-1">Créé le : {new Date(adm.createdAt).toLocaleDateString()}</span>
                </div>

                {currentRole === 'Super Admin' && adm.username !== currentUser && (
                  <div className="pt-3 border-t border-warm-cream mt-4 flex justify-between items-center text-[10px]">
                    <span className="text-luxe-muted italic font-mono text-[9px]">ID: {adm.id}</span>
                    <button
                      onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                      className="px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded"
                    >
                      Bannir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* T2: BACKUP & RESTORATION */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-warm-cream-dark p-6 space-y-6 text-left max-w-xl text-xs leading-relaxed">
          
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-warm-cream text-luxe-copper rounded-2xl border border-warm-cream-dark">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-luxe-dark">Archivage Complet du Système Hervé_eShop</h4>
              <p className="text-luxe-muted text-xs mt-1">
                La sauvegarde capture l'entièreté des catalogues, configurateurs d'options, articles de blogs, bons de commandes clients d'importation et identifiants administrateurs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-warm-cream">
            
            {/* Download section */}
            <div className="border border-warm-cream rounded-2xl p-4 flex flex-col justify-between items-center gap-4 bg-warm-cream/5 lg:text-center">
              <div>
                <span className="font-bold text-luxe-dark text-xs block">Exporter une Sauvegarde</span>
                <p className="text-[10px] text-luxe-muted mt-1">Générez un fichier .json sécurisé et téléchargez-le sur votre ordinateur.</p>
              </div>
              <button
                onClick={downloadDatabaseBackup}
                className="w-full py-2 bg-luxe-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-luxe-copper transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Sauvegarder</span>
              </button>
            </div>

            {/* Restore section */}
            <div className="border border-warm-cream rounded-2xl p-4 flex flex-col justify-between items-center gap-4 bg-warm-cream/5 lg:text-center">
              <div>
                <span className="font-bold text-luxe-dark text-xs block">Restaurer une Sauvegarde</span>
                <p className="text-[10px] text-luxe-muted mt-1">Sélectionnez ou glissez un fichier JSON valide pour écraser et réinstaller la base.</p>
              </div>
              <label className="w-full py-2 bg-luxe-copper text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-luxe-dark transition-all text-center">
                <Upload className="w-4 h-4" />
                <span>Restaurer JSON</span>
                <input
                  type="file"
                  accept=".json"
                  disabled={currentRole !== 'Super Admin'}
                  onChange={handleRestoreDatabase}
                  className="hidden"
                />
              </label>
            </div>

          </div>

          {currentRole !== 'Super Admin' && (
            <div className="p-3 border border-amber-250 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Privilèges limités : seul le Super Admin détient les droits de d'importation globale.</span>
            </div>
          )}

        </div>
      )}

      {/* T3: AUDIT HISTORY TRACKING */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-luxe-muted block">
              Traces de sécurité enregistrées en live (Logs système)
            </span>
            <button
              onClick={fetchSettingsData}
              className="text-xs text-luxe-copper font-serif font-bold hover:underline"
            >
              Rafraîchir
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-warm-cream-dark shadow-sm overflow-hidden text-xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-warm-cream bg-warm-cream/20 text-luxe-muted font-bold text-[9px] uppercase tracking-wider text-left">
                    <th className="py-2.5 px-4 w-36">Horodateur</th>
                    <th className="py-2.5 px-4 w-28">Opérateur</th>
                    <th className="py-2.5 px-4 w-40">Action</th>
                    <th className="py-2.5 px-4">Paramètres / Détails de modification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-cream text-left font-mono text-[10.5px]">
                  {logsList.map((log) => (
                    <tr key={log.id} className="hover:bg-warm-cream/10">
                      <td className="py-2.5 px-4 whitespace-nowrap text-luxe-muted">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-extrabold text-luxe-dark">
                        {log.operator}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-luxe-copper uppercase tracking-wider text-[9.5px]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 text-luxe-muted truncate max-w-sm" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INVITE OPERATOR MODAL */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-warm-cream-dark shadow-2xl p-5 text-left text-xs">
            <div className="flex justify-between items-center border-b border-warm-cream pb-3 mb-4">
              <h4 className="font-serif font-bold text-sm text-luxe-dark flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-luxe-gold" />
                Inviter un Nouvel Équipier
              </h4>
              <button onClick={() => setUserModalOpen(false)} className="text-luxe-muted hover:text-black font-bold font-serif text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              
              <div className="space-y-1">
                <label className="font-bold text-luxe-dark">Identifiant de connexion *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. herve_editor"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 border border-warm-cream rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-luxe-dark">Mot de passe temporaire *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 5 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-warm-cream rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-luxe-dark">Niveau d'Autorisation (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2.5 border border-warm-cream rounded-xl focus:outline-none bg-white text-xs font-bold"
                >
                  <option value="Super Admin">Super Admin (Accès total)</option>
                  <option value="Admin">Admin (Gestion stocks & commandes)</option>
                  <option value="Editor">Editor (Modifications CMS & Blog uniquement)</option>
                </select>
              </div>

              <div className="p-3 bg-warm-cream/20 rounded-xl text-[9px] text-luxe-muted leading-relaxed">
                📢 Rappel de sécurité : l'action d'ajout est consignée pour des raisons d'audit d'intégrité de la base.
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-cream pt-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-3.5 py-1.5 border border-grey rounded-xl font-bold font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-luxe-copper text-white rounded-xl hover:bg-luxe-dark font-sans font-bold"
                >
                  Valider
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
