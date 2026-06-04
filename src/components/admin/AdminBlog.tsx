import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Edit, Trash2, Search, RefreshCw, Eye, BookOpen, 
  Settings, CheckCircle, Save, Globe, AlertCircle, Sparkles
} from 'lucide-react';
import API from '../../lib/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string;
  category: string;
  status: 'Brouillon' | 'Publié' | 'Planifié';
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  createdAt: string;
  publishedAt?: string;
}

export default function AdminBlog({ 
  currentRole, 
  onTriggerToast 
}: { 
  currentRole: 'Super Admin' | 'Admin' | 'Editor';
  onTriggerToast: (title: string, message: string, type?: string) => void;
}) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Form states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    category: 'Conseils',
    content: '',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1000',
    status: 'Brouillon',
    seoTitle: '',
    seoDesc: '',
    seoKeywords: ''
  });

  const [seoSectionOpen, setSeoSectionOpen] = useState(false);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await API.getBlogPosts();
      setBlogs(res);
    } catch (err) {
      onTriggerToast('Erreur ❌', 'Impossible de récupérer les articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Conseils',
      content: '',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1000',
      status: 'Brouillon',
      seoTitle: '',
      seoDesc: '',
      seoKeywords: ''
    });
    setSeoSectionOpen(false);
    setEditorOpen(true);
  };

  const handleOpenEditForm = (post: BlogPost) => {
    setEditingId(post.id);
    setFormData({ ...post });
    setSeoSectionOpen(false);
    setEditorOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      onTriggerToast('Champs obligatoires ⚠️', 'Titre et Corps d\'article sont requis pour enregistrement.', 'warning');
      return;
    }

    try {
      // Auto-prefill SEO properties if empty
      const updatedForm = {
        ...formData,
        seoTitle: formData.seoTitle || `${formData.title} | Herve_eShop Conseils`,
        seoDesc: formData.seoDesc || formData.content?.slice(0, 150).replace(/[^a-zA-Z0-9\s]/g, '') || '',
        seoKeywords: formData.seoKeywords || `pc d'occasion, cameroun, herve eshop, ${formData.category.toLowerCase()}`
      };

      if (editingId) {
        await API.updateBlogPost(editingId, updatedForm);
        onTriggerToast('Article Actualisé 📝', `L'article "${formData.title}" a été mis à jour d'atelier.`, 'success');
      } else {
        await API.createBlogPost(updatedForm);
        onTriggerToast('Article Publié / Mis en Brouillon 📰', `L'article "${formData.title}" a été inséré dans le fil.`, 'success');
      }
      setEditorOpen(false);
      fetchBlogs();
    } catch (err) {
      onTriggerToast('Erreur de plume', (err as Error).message, 'danger');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (currentRole === 'Editor') {
      onTriggerToast('Sécurité RLS 🔒', 'Interdiction aux rédacteurs simples de de-publier ou d\'effacer définitivement des articles.', 'warning');
      return;
    }
    if (!confirm(`Supprimer à tout jamais l'article "${name}" ?`)) return;

    try {
      await API.deleteBlogPost(id);
      onTriggerToast('Fichier Purge 👋', 'L\'article a été rayé de la médiathèque publique.', 'success');
      fetchBlogs();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message);
    }
  };

  const filteredBlogs = blogs.filter(b => {
    const term = `${b.title} ${b.category} ${b.content}`.toLowerCase();
    const matchSearch = term.includes(search.toLowerCase());
    const matchCat = selectedCat ? b.category === selectedCat : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-xl font-bold text-luxe-dark flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-luxe-copper" />
            Consoles d'Articles d'Expert (Blog)
          </h3>
          <p className="text-xs text-luxe-muted mt-1">
            Publiez des astuces d'entretien, des analyses techniques de processeurs, et optimisez votre visibilité Google Cameroun.
          </p>
        </div>

        <button
          onClick={handleOpenCreateForm}
          className="bg-luxe-copper hover:bg-luxe-dark text-white active:scale-95 px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Créer un Article</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-warm-cream-dark shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-muted" />
          <input
            type="text"
            placeholder="Rechercher par Titre, Thème ou paragraphe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full text-xs px-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none bg-white"
          >
            <option value="">Toutes les thématiques</option>
            <option value="Conseils">Conseils & Entretien</option>
            <option value="Promotions">Promotions & Annonces</option>
            <option value="Informations">Informations Pratiques</option>
            <option value="Actualités">Actualités Hightech</option>
          </select>
        </div>
      </div>

      {/* Blogs list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {filteredBlogs.map((b) => (
          <div key={b.id} className="bg-white border border-warm-cream-dark rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="relative h-40 bg-warm-cream/15">
              <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="text-[8px] tracking-widest uppercase font-mono bg-luxe-dark text-white font-bold px-2 py-0.5 rounded">
                  {b.category}
                </span>
                <span className={`text-[8px] tracking-widest uppercase font-mono font-bold px-2 py-0.5 rounded border border-white ${
                  b.status === 'Publié' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {b.status}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-luxe-muted font-mono">{new Date(b.createdAt).toLocaleDateString()}</span>
                <h4 className="font-serif font-bold text-sm text-luxe-dark line-clamp-2 leading-relaxed">{b.title}</h4>
                <p className="text-[11px] text-luxe-muted line-clamp-3 leading-relaxed">{b.content.replace(/[#*`_]/g, '')}</p>
              </div>

              <div className="pt-3 border-t border-warm-cream flex justify-between items-center text-[10px] text-luxe-muted">
                <span className="truncate max-w-[155px] font-mono">Slug: {b.slug}</span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditForm(b)}
                    className="px-2 py-1 border hover:bg-warm-cream text-luxe-dark rounded-lg font-bold transition-all"
                  >
                    Édite
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    className="px-2 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-all"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RICH CMS TEXT EDITOR MODAL */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-luxe-dark/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-warm-cream-dark shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
            
            {/* Header */}
            <div className="bg-luxe-dark text-warm-cream p-4 flex justify-between items-center border-b border-luxe-gold/30">
              <h4 className="font-serif font-bold text-sm flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-luxe-gold" />
                {editingId ? `Éditeur : ${formData.title?.slice(0, 40)}...` : 'Rédiger une Note d\'Expert'}
              </h4>
              <button onClick={() => setEditorOpen(false)} className="text-white text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveBlog} className="p-5 overflow-y-auto space-y-5 flex-1 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="font-bold text-luxe-dark">Titre de l'Article *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Pourquoi de-cloner un MacBook en de-lestages ?"
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper font-serif font-extrabold text-sm"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="font-bold text-luxe-dark">Thématique</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white text-xs"
                  >
                    <option value="Conseils">Conseils & Entretien</option>
                    <option value="Promotions font">Offres & Promos</option>
                    <option value="Informations">Informations Pratiques</option>
                    <option value="Actualités">Actualités Hightech</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark">Lien Photo d'En-Tête</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData(p => ({ ...p, image: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-luxe-dark">État de Visualisation</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full p-2.5 rounded-xl border border-warm-cream-dark bg-white text-xs font-bold"
                  >
                    <option value="Brouillon">Brouillon (Non visible)</option>
                    <option value="Publié">Publié immédiatement</option>
                    <option value="Planifié">Planifier publication</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-luxe-dark block">Paragraphes Rédactionnels * (Prend en charge le Markdown)</label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="Écrivez le corps de l'article ici..."
                  className="w-full p-3 rounded-xl border border-warm-cream-dark focus:outline-none focus:border-luxe-copper leading-relaxed text-xs font-sans font-medium"
                />
              </div>

              {/* Collapsed Search engine tags config */}
              <div className="border border-warm-cream bg-warm-cream/15 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSeoSectionOpen(!seoSectionOpen)}
                  className="w-full p-3 font-bold text-luxe-dark flex justify-between items-center text-xs select-none hover:bg-warm-cream/35 transition-all text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-luxe-copper animate-pulse" />
                    Optimisation Référencement Google (SEO Meta Tags)
                  </span>
                  <span>{seoSectionOpen ? 'Masquer' : 'Ajuster'}</span>
                </button>
                
                {seoSectionOpen && (
                  <div className="p-4.5 border-t border-warm-cream space-y-3 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-1">
                      <label className="font-bold text-luxe-dark">Meta Title Google</label>
                      <input
                        type="text"
                        value={formData.seoTitle || ''}
                        onChange={(e) => setFormData(p => ({ ...p, seoTitle: e.target.value }))}
                        placeholder="Google Title (Max 60 chars)"
                        className="w-full p-2 rounded-xl border border-warm-cream"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-luxe-dark">Meta Description</label>
                      <textarea
                        rows={2}
                        value={formData.seoDesc || ''}
                        onChange={(e) => setFormData(p => ({ ...p, seoDesc: e.target.value }))}
                        placeholder="Résume d'index Google (Max 160 chars)"
                        className="w-full p-2 rounded-xl border border-warm-cream"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-luxe-dark">Keywords (Mots Clés virgules séparatrices)</label>
                      <input
                        type="text"
                        value={formData.seoKeywords || ''}
                        onChange={(e) => setFormData(p => ({ ...p, seoKeywords: e.target.value }))}
                        placeholder="e.g. ordi occasion cameroun, asus, rog, dual-core, douala"
                        className="w-full p-2 rounded-xl border border-warm-cream"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save footer action */}
              <div className="flex justify-end gap-2.5 border-t border-warm-cream pt-4">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 border border-warm-cream-dark rounded-xl text-luxe-muted hover:text-luxe-dark font-bold hover:bg-warm-cream"
                >
                  Abandonner
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-2 bg-luxe-copper text-white rounded-xl hover:bg-luxe-dark transition-all font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer l'Article</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
