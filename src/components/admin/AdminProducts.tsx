import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Edit, Trash2, Copy, Search, Filter, ArrowUpDown, 
  RefreshCw, Check, X, Upload, Download, Eye, Grid, List, AlertTriangle
} from 'lucide-react';
import API from '../../lib/api';

interface Product {
  id: string;
  brand: string;
  model: string;
  processor: string;
  ram: string;
  storage: string;
  screenSize: string;
  condition: string;
  source: string;
  image: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  status: string;
  category: string;
  description: string;
  shortDescription?: string;
  subCategory?: string;
  skuByAdmin?: string; // custom SKU
  isFeatured?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
}

export default function AdminProducts({ 
  currentRole, 
  onTriggerToast 
}: { 
  currentRole: 'Super Admin' | 'Admin' | 'Editor'; 
  onTriggerToast: (title: string, message: string, type?: string) => void; 
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'stock' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  // Modal / Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    brand: '',
    model: '',
    category: 'Ultrabook',
    processor: '',
    ram: '',
    storage: '',
    screenSize: '',
    condition: 'Comme neuf',
    source: 'USA',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1000',
    price: 500000,
    oldPrice: 600000,
    stockQuantity: 3,
    status: 'Disponible',
    description: '',
    shortDescription: '',
    subCategory: '',
    skuByAdmin: '',
    isFeatured: false,
    isPopular: false,
    isRecommended: false
  });

  const [uploading, setUploading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.getProducts();
      setProducts(res);
      const cms = await API.getClientData();
      setCategories(cms.categories);
    } catch (err) {
      onTriggerToast('Erreur serveur ❌', 'Impossible de récupérer l\'inventaire.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreateForm = () => {
    if (currentRole === 'Editor') {
      onTriggerToast('Refusé ⛔', 'Votre rôle Éditeur ne vous accorde pas le droit de créer des produits.', 'warning');
      return;
    }
    setEditingId(null);
    setFormData({
      brand: '',
      model: '',
      category: categories[0]?.name || 'Ultrabook',
      processor: '',
      ram: '',
      storage: '',
      screenSize: '',
      condition: 'Comme neuf',
      source: 'USA',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1000',
      price: 500000,
      oldPrice: 600000,
      stockQuantity: 3,
      status: 'Disponible',
      description: '',
      shortDescription: '',
      subCategory: '',
      skuByAdmin: '',
      isFeatured: false,
      isPopular: false,
      isRecommended: false
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (item: Product) => {
    if (currentRole === 'Editor') {
      onTriggerToast('Refusé ⛔', 'Le rôle Éditeur ne peut pas modifier l\'inventaire de matériel.', 'warning');
      return;
    }
    setEditingId(item.id);
    setFormData({ ...item });
    setFormOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'Editor') return;

    if (!formData.brand || !formData.model || !formData.price || formData.stockQuantity === undefined) {
      onTriggerToast('Champs requis ⚠️', 'Veuillez saisir la Marque, le Modèle, le Prix et la Quantité.', 'warning');
      return;
    }

    try {
      if (editingId) {
        await API.updateProduct(editingId, formData);
        onTriggerToast('Matériel Édité 👍', `${formData.brand} ${formData.model} mis à jour avec succès.`, 'success');
      } else {
        await API.createProduct({
          ...formData,
          id: `lpt-${Date.now()}`
        });
        onTriggerToast('Produit Enregistré 📥', `${formData.brand} ${formData.model} a rejoint le showroom.`, 'success');
      }
      setFormOpen(false);
      fetchProducts();
    } catch (err) {
      onTriggerToast('Erreur de sauvegarde ❌', (err as Error).message, 'danger');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (currentRole === 'Editor') {
      onTriggerToast('Refusé ⛔', 'Rôle Éditeur interdit pour suppression.', 'warning');
      return;
    }
    if (!confirm(`Supprimer définitivement l'ordinateur portable "${name}" du showroom publique ?`)) return;

    try {
      await API.deleteProduct(id);
      onTriggerToast('Produit Éliminé', `${name} a été retiré des stocks.`, 'success');
      fetchProducts();
    } catch (err) {
      onTriggerToast('Accès Interdit ❌', (err as Error).message, 'danger');
    }
  };

  const handleDuplicate = async (item: Product) => {
    if (currentRole === 'Editor') return;
    try {
      const duplicatedItem = {
        ...item,
        id: `lpt-${Date.now()}`,
        model: `${item.model} - Copie`,
        stockQuantity: Math.max(1, item.stockQuantity),
        skuByAdmin: item.skuByAdmin ? `${item.skuByAdmin}-COPY` : undefined
      };
      await API.createProduct(duplicatedItem);
      onTriggerToast('Produit Dupliqué 📋', `Un modèle miroir de ${item.brand} a été généré.`, 'success');
      fetchProducts();
    } catch (err) {
      onTriggerToast('Erreur de copie', (err as Error).message, 'danger');
    }
  };

  const handleStatusToggle = async (item: Product) => {
    if (currentRole === 'Editor') return;
    const nextStatus = item.status === 'Disponible' ? 'Rupture' : 'Disponible';
    const nextStock = nextStatus === 'Disponible' && item.stockQuantity === 0 ? 1 : item.stockQuantity;
    try {
      await API.updateProduct(item.id, { status: nextStatus, stockQuantity: nextStock });
      onTriggerToast('Visibilité Basculée 📲', `Le statut est maintenant "${nextStatus}".`);
      fetchProducts();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message);
    }
  };

  // Base64 file uploader reader
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const uploadRes = await API.uploadMedia(file.name, base64String);
        if (uploadRes.success) {
          setFormData(prev => ({ ...prev, image: uploadRes.url }));
          onTriggerToast('Média Associé 🎨', `Photo "${file.name}" importée avec succès sur le serveur.`, 'success');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      onTriggerToast('Erreur upload ❌', 'Impossible de charger l\'image physique.', 'danger');
    } finally {
      setUploading(false);
    }
  };

  // Download stock list as CSV Spreadsheet format
  const exportStockCSV = () => {
    try {
      const headers = ['SKU', 'Marque', 'Modele', 'Categorie', 'Processeur', 'RAM', 'Stockage', 'Prix_FCFA', 'Stock', 'Statut', 'Source', 'Condition'];
      const rows = products.map(p => [
        p.skuByAdmin || p.id,
        p.brand,
        p.model,
        p.category,
        p.processor.replace(/,/g, ';'),
        p.ram,
        p.storage,
        p.price,
        p.stockQuantity,
        p.status,
        p.source,
        p.condition
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Herve_eShop_Catalogue_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onTriggerToast('Export Réussi 📊', 'Fichier CSV de stock téléchargé.');
    } catch (err) {
      onTriggerToast('Erreur d\'exportation', (err as Error).message);
    }
  };

  // CSV Import mockup integration
  const importStockCSV = () => {
    onTriggerToast('Import Simulation 🗃️', 'Veuillez utiliser un gestionnaire de restauration ou contacter l\'ingénieur d\'Herve_eShop.', 'warning');
  };

  // Filter & Search processing pipeline
  const processed = products.filter(item => {
    const term = `${item.brand} ${item.model} ${item.processor} ${item.category}`.toLowerCase();
    const matchSearch = term.includes(search.toLowerCase());
    const matchCat = selectedCat ? item.category === selectedCat : true;
    const matchStatus = selectedStatus ? item.status === selectedStatus : true;
    return matchSearch && matchCat && matchStatus;
  }).sort((a, b) => {
    let rawA: any = a.model;
    let rawB: any = b.model;
    if (sortBy === 'price') {
      rawA = a.price;
      rawB = b.price;
    } else if (sortBy === 'stock') {
      rawA = a.stockQuantity;
      rawB = b.stockQuantity;
    }
    if (rawA < rawB) return sortOrder === 'asc' ? -1 : 1;
    if (rawA > rawB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const triggerSort = (field: 'price' | 'stock' | 'name') => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  const formatFCFA = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-8 h-8 text-luxe-copper animate-spin" />
        <span className="text-xs font-mono tracking-widest text-luxe-muted uppercase font-bold">Exploration du stock technique...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-luxe-dark flex items-center gap-2">
            <Package className="w-5 h-5 text-luxe-copper" />
            Gestion des Laptops & Produits
          </h3>
          <p className="text-xs text-luxe-muted mt-1">
            Ajoutez, dupliquez, contrôlez la disponibilité ou chargez les visuels de vos arrivages.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex gap-2.5">
          <button
            onClick={exportStockCSV}
            className="px-3 py-1.5 rounded-xl border border-warm-cream-dark hover:border-luxe-copper text-xs font-bold text-luxe-copper uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handleOpenCreateForm}
            className="bg-luxe-copper hover:bg-luxe-dark text-white active:scale-95 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nouveau Laptop</span>
          </button>
        </div>
      </div>

      {/* Editor Warning Banner if role is Editor */}
      {currentRole === 'Editor' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="text-left">
            <p className="font-bold">Accès Restreint (Éditeur) :</p>
            <p className="mt-0.5 opacity-90">
              En vertu des règles de sécurité sélectives, vous possédez un droit exclusif de modification du contenu rédactionnel (Blogs, CMS). Vous ne pouvez pas insérer, éditer, ou supprimer de matériels, de catégories, ni modifier de prix.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters Section */}
      <div className="bg-white p-4.5 rounded-2xl border border-warm-cream-dark shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-muted" />
          <input
            type="text"
            placeholder="Rechercher par Marque, Modèle, Processeur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full text-xs px-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none bg-white"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs px-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="Arrivage imminent">Arrivage imminent</option>
            <option value="Rupture">Rupture</option>
          </select>
        </div>

        {/* Layout toggle */}
        <div className="md:col-span-1 flex items-center justify-end gap-1">
          <button
            onClick={() => setLayout('list')}
            className={`p-2 rounded-lg border ${layout === 'list' ? 'bg-warm-cream stroke-luxe-copper text-luxe-copper' : 'bg-transparent text-luxe-muted'} transition-all`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLayout('grid')}
            className={`p-2 rounded-lg border ${layout === 'grid' ? 'bg-warm-cream stroke-luxe-copper text-luxe-copper' : 'bg-transparent text-luxe-muted'} transition-all`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid vs List Renderer */}
      {layout === 'list' ? (
        <div className="bg-white rounded-2xl border border-warm-cream-dark shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-warm-cream bg-warm-cream/20 text-luxe-muted font-bold text-[10px] uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 text-left">Visuel</th>
                  <th className="py-3.5 px-4 text-left cursor-pointer" onClick={() => triggerSort('name')}>
                    Produit <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-luxe-muted" />
                  </th>
                  <th className="py-3.5 px-4 text-left">Catégorie</th>
                  <th className="py-3.5 px-4 text-left cursor-pointer" onClick={() => triggerSort('price')}>
                    Prix (FCFA) <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-luxe-muted" />
                  </th>
                  <th className="py-3.5 px-4 text-left cursor-pointer" onClick={() => triggerSort('stock')}>
                    Stock <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-luxe-muted" />
                  </th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-cream">
                {processed.map((item) => (
                  <tr key={item.id} className="hover:bg-warm-cream/15 transition-all text-left">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <img
                        src={item.image}
                        alt={`${item.brand} img`}
                        className="w-11 h-11 object-cover rounded-xl border border-warm-cream shadow-inner bg-warm-cream/50"
                        referrerPolicy="no-referrer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-luxe-dark leading-relaxed">
                        {item.brand} <span className="font-normal font-sans text-[11px] text-luxe-muted">{item.model}</span>
                      </div>
                      <div className="text-[10px] text-luxe-muted font-mono truncate max-w-[200px] mt-0.5">
                        {item.processor}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[8px] uppercase tracking-widest bg-warm-cream text-luxe-copper font-bold px-1.5 py-0.5 rounded-sm">
                          {item.condition}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-sm font-mono">
                          {item.source}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-luxe-dark font-medium">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-luxe-dark">
                      {formatFCFA(item.price)}
                      {item.oldPrice && (
                        <span className="block text-[9px] line-through text-red-400 font-extrabold">
                          {formatFCFA(item.oldPrice)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                      <span className={item.stockQuantity === 0 ? 'text-red-500' : 'text-luxe-dark'}>
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        disabled={currentRole === 'Editor'}
                        onClick={() => handleStatusToggle(item)}
                        className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-sm border cursor-pointer select-none ${
                          item.status === 'Disponible' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : item.status === 'Arrivage imminent'
                            ? 'bg-luxe-gold/20 text-luxe-copper border-luxe-gold/50'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleDuplicate(item)}
                          title="Dupliquer"
                          disabled={currentRole === 'Editor'}
                          className="p-1.5 hover:bg-warm-cream/50 border border-warm-cream rounded-lg text-luxe-muted hover:text-luxe-copper transition-all active:scale-90 disabled:opacity-50"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(item)}
                          title="Modifier"
                          disabled={currentRole === 'Editor'}
                          className="p-1.5 hover:bg-warm-cream/50 border border-warm-cream rounded-lg text-luxe-muted hover:text-blue-600 transition-all active:scale-90 disabled:opacity-50"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, `${item.brand} ${item.model}`)}
                          title="Supprimer"
                          disabled={currentRole === 'Editor'}
                          className="p-1.5 hover:bg-warm-cream/50 border border-warm-cream rounded-lg text-luxe-muted hover:text-red-600 transition-all active:scale-90 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {processed.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-warm-cream-dark overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div className="relative h-44 bg-warm-cream/20">
                <img src={item.image} alt={item.model} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <span className={`absolute top-3 right-3 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border font-extrabold ${
                  item.status === 'Disponible' ? 'bg-emerald-500 border-none text-white' : 'bg-red-500 border-none text-white'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] tracking-widest uppercase font-mono text-luxe-muted">{item.category}</span>
                  <h4 className="font-serif font-bold text-sm text-luxe-dark">{item.brand} {item.model}</h4>
                  <p className="text-[11px] text-luxe-muted truncate font-mono">{item.processor}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-warm-cream-dark">
                  <div>
                    <span className="text-[10px] text-luxe-muted font-mono">Stock • {item.stockQuantity} pcs</span>
                    <span className="block font-mono font-bold text-xs text-luxe-dark">{formatFCFA(item.price)}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEditForm(item)}
                      disabled={currentRole === 'Editor'}
                      className="p-2 hover:bg-warm-cream/40 rounded-lg text-luxe-muted hover:text-blue-600 border border-warm-cream-dark disabled:opacity-50"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, `${item.brand} ${item.model}`)}
                      disabled={currentRole === 'Editor'}
                      className="p-2 hover:bg-warm-cream/40 rounded-lg text-luxe-muted hover:text-red-500 border border-warm-cream-dark disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL EDIT / FORM */}
      {formOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl border-2 border-luxe-gold/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-luxe-dark text-warm-cream p-5 flex justify-between items-center border-b border-luxe-gold/30">
              <h4 className="font-serif font-bold text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-luxe-gold" />
                {editingId ? `Modifier : ${formData.brand} ${formData.model}` : 'Ajouter un nouveau Laptop'}
              </h4>
              <button
                onClick={() => setFormOpen(false)}
                className="text-warm-cream-dark/60 hover:text-white font-serif text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Apple, Dell, Lenovo"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Modèle *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. MacBook Pro M3, ThinkPad T14"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Catégorie *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Processeur *</label>
                  <input
                    type="text"
                    required
                    value={formData.processor}
                    onChange={(e) => setFormData(prev => ({ ...prev, processor: e.target.value }))}
                    placeholder="e.g. Intel i7-13700H, Apple M3 Pro"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Mémoire RAM *</label>
                  <input
                    type="text"
                    required
                    value={formData.ram}
                    onChange={(e) => setFormData(prev => ({ ...prev, ram: e.target.value }))}
                    placeholder="e.g. 16GB unified, 32GB DDR5"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Disque Stockage *</label>
                  <input
                    type="text"
                    required
                    value={formData.storage}
                    onChange={(e) => setFormData(prev => ({ ...prev, storage: e.target.value }))}
                    placeholder="e.g. 512GB SSD SuperFast, 1TB NVMe"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Taille d'Écran *</label>
                  <input
                    type="text"
                    required
                    value={formData.screenSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, screenSize: e.target.value }))}
                    placeholder='e.g. 14.0" WUXGA, 16" Liquid Retina'
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Importation de (Pays) *</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                  >
                    <option value="USA">USA 🇺🇸</option>
                    <option value="Europe">Europe 🇪🇺</option>
                    <option value="Asia">Asia 🇯🇵</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">État & Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                  >
                    <option value="Comme neuf">Comme neuf (10/10)</option>
                    <option value="Excellent">Excellent état</option>
                    <option value="Très bon état">Très bon état</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Prix Courant (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="Prix de vente d'Hervé"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Ancien Prix (FCFA - Facultatif)</label>
                  <input
                    type="number"
                    value={formData.oldPrice || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, oldPrice: Number(e.target.value) }))}
                    placeholder="Prix barré de référence"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Quantité en Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity !== undefined ? formData.stockQuantity : ''}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const computedStat = qty === 0 ? 'Rupture' : formData.status;
                      setFormData(prev => ({ ...prev, stockQuantity: qty, status: computedStat }));
                    }}
                    placeholder="Quantité dispo"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Statut Actuel</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper bg-white"
                  >
                    <option value="Disponible">Disponible (Affiché)</option>
                    <option value="Arrivage imminent">Arrivage imminent (Réservable)</option>
                    <option value="Rupture">Rupture temporaire</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">SKU Unique d'identification</label>
                  <input
                    type="text"
                    value={formData.skuByAdmin || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, skuByAdmin: e.target.value }))}
                    placeholder="e.g. AAPL-M3-14"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper font-mono"
                  />
                </div>

              </div>

              {/* Photo Upload Handler */}
              <div className="space-y-2 border-t border-warm-cream pt-4 text-left">
                <label className="font-bold text-luxe-dark block">Photo du Matériel (Sélectionnez ou transférez une photo)</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-1 h-20 border border-warm-cream bg-warm-cream/25 rounded-2xl overflow-hidden flex items-center justify-center">
                    <img src={formData.image} alt="Visuel" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Lien URL de l'image"
                      className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper text-xs"
                    />
                    
                    <div className="mt-2.5 flex items-center gap-2">
                      <label className="px-3.5 py-2 border border-luxe-copper hover:bg-warm-cream rounded-xl text-[11px] font-bold text-luxe-copper flex items-center gap-1.5 transition-all cursor-pointer bg-white">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? 'Upload en cours...' : 'Charger un fichier image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-luxe-muted italic">Formats acceptés: JPG, PNG, WEBP (Heures auto-compression)</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Descriptions & Badges */}
              <div className="space-y-4 border-t border-warm-cream pt-4 text-left">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Slogan d'Accroche / Description Courte</label>
                  <input
                    type="text"
                    value={formData.shortDescription || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="e.g. Un monstre de puissance autonome dans un écrin aluminium brossé."
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark block">Description Détaillée du Showroom *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez l'étanchéité, l'usure, la vie de batterie et la clarté d'écran."
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper"
                  />
                </div>

                {/* Tags features */}
                <div className="grid grid-cols-3 gap-4 border border-warm-cream-dark rounded-2xl p-4 bg-warm-cream/10">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-luxe-dark select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                    />
                    <span>Produit Vedette (Hero slider)</span>
                  </label>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-luxe-dark select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPopular || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPopular: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                    />
                    <span>Produit Populaire</span>
                  </label>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-luxe-dark select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecommended || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRecommended: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-luxe-copper focus:ring-luxe-copper"
                    />
                    <span>Recommandé Hervé</span>
                  </label>
                </div>

              </div>

              {/* Form Footer */}
              <div className="flex justify-end gap-3.5 border-t border-warm-cream pt-5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-warm-cream-dark hover:bg-warm-cream text-luxe-muted hover:text-luxe-dark text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-luxe-copper hover:bg-luxe-dark text-white text-xs uppercase font-bold tracking-wider cursor-pointer transition-all active:scale-95"
                >
                  Enregistrer et publier
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
