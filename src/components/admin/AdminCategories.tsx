import React, { useState, useEffect } from 'react';
import { 
  FolderTree, Plus, Edit, Trash2, RefreshCw, Layers, Check, X, 
  ArrowUp, ArrowDown, Folder, Briefcase, Gamepad2, Laptop, Monitor, Smartphone
} from 'lucide-react';
import API from '../../lib/api';

const AVAILABLE_ICONS = [
  { name: 'Laptop', component: Laptop },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'Folder', component: Folder },
  { name: 'Monitor', component: Monitor },
  { name: 'Smartphone', component: Smartphone }
];

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  displayOrder: number;
  status: 'Actif' | 'Inactif';
}

export default function AdminCategories({ 
  currentRole, 
  onTriggerToast 
}: { 
  currentRole: 'Super Admin' | 'Admin' | 'Editor';
  onTriggerToast: (title: string, message: string, type?: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: '',
    icon: 'Laptop',
    displayOrder: 1,
    status: 'Actif'
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await API.getClientData();
      // Sort by display order
      const sorted = (res.categories || []).sort((a: any, b: any) => a.displayOrder - b.displayOrder);
      setCategories(sorted);
    } catch (err) {
      onTriggerToast('Erreur ❌', 'Impossible de récupérer les catégories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateForm = () => {
    if (currentRole === 'Editor') {
      onTriggerToast('Refusé ⛔', 'Rôle Éditeur interdit.');
      return;
    }
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      icon: 'Laptop',
      displayOrder: categories.length + 1,
      status: 'Actif'
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (cat: Category) => {
    if (currentRole === 'Editor') return;
    setEditingId(cat.id);
    setFormData({ ...cat });
    setFormOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'Editor') return;

    if (!formData.name) return;

    try {
      if (editingId) {
        await API.updateCategory(editingId, formData);
        onTriggerToast('Catégorie Mise à jour ✅', `La catégorie ${formData.name} a été actualisée.`);
      } else {
        await API.createCategory({ ...formData });
        onTriggerToast('Catégorie Enregistrée 👋', `La catégorie ${formData.name} a été créée.`);
      }
      setFormOpen(false);
      fetchCategories();
    } catch (err) {
      onTriggerToast('Erreur serveur ❌', (err as Error).message, 'danger');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (currentRole === 'Editor') return;
    if (!confirm(`Supprimer à tout jamais la catégorie "${name}" ? Assurez-vous d'avoir déplacé les ordinateurs de ce rayon.`)) return;

    try {
      await API.deleteCategory(id);
      onTriggerToast('Suppression Réglée 👍', `Le rayon ${name} a été retiré.`);
      fetchCategories();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message, 'danger');
    }
  };

  const handleMoveOrder = async (idx: number, direction: 'up' | 'down') => {
    if (currentRole === 'Editor') return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    try {
      const copy = [...categories];
      // Switch display orders
      const tempOrder = copy[idx].displayOrder;
      copy[idx].displayOrder = copy[targetIdx].displayOrder;
      copy[targetIdx].displayOrder = tempOrder;

      // Persist updates
      await API.updateCategory(copy[idx].id, { displayOrder: copy[idx].displayOrder });
      await API.updateCategory(copy[targetIdx].id, { displayOrder: copy[targetIdx].displayOrder });

      onTriggerToast('Ordre Reconfiguré ↕️', 'L\'assemblage des onglets a été permuté.');
      fetchCategories();
    } catch (err) {
      onTriggerToast('Erreur de permutation', (err as Error).message);
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    return found ? found.component : Laptop;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-8 h-8 text-luxe-copper animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-xl font-bold text-luxe-dark flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-luxe-copper" />
            Catégories de Rayonnement
          </h3>
          <p className="text-xs text-luxe-muted mt-1">
            Gérez et ordonnez les sections d'ordinateurs visibles sur le site d'Hervé.
          </p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          disabled={currentRole === 'Editor'}
          className="bg-luxe-copper hover:bg-luxe-dark text-white active:scale-95 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouvelle Catégorie</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-warm-cream-dark shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-warm-cream bg-warm-cream/20 text-luxe-muted font-bold text-[10px] uppercase tracking-wider">
              <th className="py-3.5 px-4 text-center w-16">Ordre</th>
              <th className="py-3.5 px-4 text-center w-14">Icône</th>
              <th className="py-3.5 px-4 text-left">Nom de la Catégorie</th>
              <th className="py-3.5 px-4 text-left">Description du Rayon</th>
              <th className="py-3.5 px-4 text-center w-24">Statut</th>
              <th className="py-3.5 px-4 text-right w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-cream">
            {categories.map((cat, idx) => {
              const IconComp = getIconComponent(cat.icon);
              return (
                <tr key={cat.id} className="hover:bg-warm-cream/15 transition-all text-left">
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-luxe-dark">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0 || currentRole === 'Editor'}
                        className="p-1 text-luxe-muted hover:text-luxe-copper active:scale-90 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <span>{cat.displayOrder}</span>
                      <button
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === categories.length - 1 || currentRole === 'Editor'}
                        className="p-1 text-luxe-muted hover:text-luxe-copper active:scale-90 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-warm-cream/50 flex items-center justify-center text-luxe-copper border border-warm-cream mx-auto">
                      <IconComp className="w-4 h-4" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-luxe-dark">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 text-luxe-muted leading-relaxed">
                    {cat.description || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                      cat.status === 'Actif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(cat)}
                        disabled={currentRole === 'Editor'}
                        className="p-1.5 hover:bg-warm-cream/50 border border-warm-cream rounded-lg text-luxe-muted hover:text-blue-600 transition-all active:scale-90 disabled:opacity-50"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={currentRole === 'Editor'}
                        className="p-1.5 hover:bg-warm-cream/50 border border-warm-cream rounded-lg text-luxe-muted hover:text-red-600 transition-all active:scale-90 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CRUD MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-warm-cream-dark shadow-2xl overflow-hidden text-xs">
            
            <div className="bg-luxe-dark text-warm-cream p-4.5 flex justify-between items-center border-b border-luxe-gold/30">
              <h4 className="font-serif font-bold text-sm flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-luxe-gold" />
                {editingId ? 'Modifier la Catégorie' : 'Créer une Catégorie'}
              </h4>
              <button onClick={() => setFormOpen(false)} className="text-warm-cream-dark/60 hover:text-white font-serif text-lg">&times;</button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4 text-left">
              
              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Intitulé du Rayon *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ultrabook, Gaming, Bureautique"
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark">Résumé court</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Texte de contextualisation"
                  className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark block">Sélectionner un Symbole Graphique (Icône)</label>
                <div className="grid grid-cols-6 gap-2 pt-1 border border-warm-cream-dark p-2 rounded-xl bg-warm-cream/10">
                  {AVAILABLE_ICONS.map(ic => {
                    const Ic = ic.component;
                    const isSel = formData.icon === ic.name;
                    return (
                      <button
                        type="button"
                        key={ic.name}
                        onClick={() => setFormData(prev => ({ ...prev, icon: ic.name }))}
                        className={`p-2 border rounded-xl flex items-center justify-center transition-all ${
                          isSel ? 'border-luxe-copper bg-luxe-copper text-white' : 'border-warm-cream-dark bg-white text-luxe-muted hover:text-luxe-dark'
                        }`}
                      >
                        <Ic className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="font-bold text-luxe-dark">Affichage Ordre</label>
                  <input
                    type="number"
                    value={formData.displayOrder || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="font-bold text-luxe-dark">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                  >
                    <option value="Actif">Actif (Visible)</option>
                    <option value="Inactif">Inactif (Masqué)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-warm-cream pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-warm-cream-dark text-luxe-muted hover:text-luxe-dark font-bold font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-luxe-copper text-white hover:bg-luxe-dark transition-all font-bold"
                >
                  Enregistrer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
