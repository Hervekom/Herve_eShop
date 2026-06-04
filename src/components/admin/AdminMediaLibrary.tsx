import React, { useState, useEffect } from 'react';
import { 
  FolderLock, Image, Upload, Trash2, Copy, File, ExternalLink, 
  RefreshCw, Check, AlertCircle, FileImage, Search
} from 'lucide-react';
import API from '../../lib/api';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

export default function AdminMediaLibrary({ 
  onTriggerToast 
}: { 
  onTriggerToast: (title: string, message: string, type?: string) => void; 
}) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Drag over states
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await API.getMediaFiles();
      setMediaFiles(res);
    } catch (err) {
      onTriggerToast('Erreur ❌', 'Impossible d\'explorer le répertoire de la médiathèque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        await API.uploadMedia(file.name, base64Data);
        onTriggerToast('Upload Validé ✅', `L'image "${file.name}" est disponible pour vos produits ou bannières.`, 'success');
        fetchMedia();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      onTriggerToast('Erreur de chargement ❌', (err as Error).message, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Drag over events handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onTriggerToast('Fichier non supporté ⚠️', 'Veuillez uniquement déposer des fichiers de type image (PNG, JPG, WEBP).', 'warning');
        return;
      }
      handleFileUpload(file);
    }
  };

  const handleCopyLink = (url: string, name: string) => {
    // absolute URL path formatting
    const absoluteUrl = window.location.origin + url;
    navigator.clipboard.writeText(absoluteUrl);
    setCopiedName(name);
    onTriggerToast('Lien Copié 📋', 'Le lien absolu de l\'image est prêt à être collé dans le CMS.');
    setTimeout(() => setCopiedName(null), 3000);
  };

  const handleDeleteFile = async (name: string) => {
    if (!confirm(`Supprimer définitivement le fichier physique "${name}" ? \nAttention : cette action brisera les produits ou bannières y faisant référence.`)) return;

    try {
      await API.deleteMedia(name);
      onTriggerToast('Média Supprimé 👍', 'Le visuel a été retiré du serveur.');
      fetchMedia();
    } catch (err) {
      onTriggerToast('Erreur', (err as Error).message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredMedia = mediaFiles.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <FolderLock className="w-5 h-5 text-luxe-copper" />
          Médiathèque & Fichiers Dépôt
        </h3>
        <p className="text-xs text-luxe-muted mt-1 font-sans">
          Glissez-déposez vos clichés originaux. Copiez d'un clic leurs liens URL absolus pour les insérer directement dans vos fiches de stocks, blogs ou sliders CMS.
        </p>
      </div>

      {/* Drag & Drop Frame combined with Manual Selector */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-3 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3.5 relative ${
          isDragOver ? 'border-luxe-copper bg-warm-cream/30 scale-[1.01]' : 'border-warm-cream-dark bg-white hover:border-luxe-gold/70'
        }`}
      >
        <div className="p-4 bg-warm-cream text-luxe-copper rounded-full border border-warm-cream-dark">
          <Upload className="w-6 h-6 stroke-[2]" />
        </div>
        <div className="space-y-1 block max-w-sm">
          <h4 className="font-serif font-bold text-sm text-luxe-dark">
            Faites glisser votre cliché d'atelier ici
          </h4>
          <p className="text-[11px] text-luxe-muted">
            ou cliquez sur le bouton pour sélectionner un fichier depuis votre poste de travail. Les visuels seront compressés automatiquement.
          </p>
        </div>

        <label className="bg-luxe-copper hover:bg-luxe-dark text-white active:scale-95 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md">
          <span>{uploading ? 'Upload en cours...' : 'Sélectionner des images'}</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Media Search and library listings */}
      <div className="space-y-4">
        
        <div className="relative w-full md:max-w-xs text-left">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-muted" />
          <input
            type="text"
            placeholder="Rechercher un fichier uploadé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-warm-cream-dark focus:border-luxe-copper focus:outline-none bg-white font-sans"
          />
        </div>

        {filteredMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMedia.map((file) => {
              const isCopied = copiedName === file.name;
              return (
                <div key={file.name} className="bg-white border border-warm-cream-dark rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:border-luxe-copper/70 transition-all">
                  
                  {/* Picture Preview */}
                  <div className="relative h-28 bg-warm-cream/10 border-b border-warm-cream overflow-hidden">
                    <img 
                      src={file.url} 
                      alt={file.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Size indicator overlay */}
                    <span className="absolute bottom-1.5 left-1.5 text-[8.5px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded font-bold">
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  {/* Asset info */}
                  <div className="p-3 text-left">
                    <h5 className="font-mono text-[10px] text-luxe-dark truncate font-bold" title={file.name}>
                      {file.name}
                    </h5>
                    <span className="text-[8.5px] text-luxe-muted block mt-0.5 font-mono">
                      Ajouté le {new Date(file.createdAt).toLocaleDateString()}
                    </span>

                    {/* Copy action shortcuts */}
                    <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-warm-cream">
                      
                      <button
                        onClick={() => handleCopyLink(file.url, file.name)}
                        className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 ${
                          isCopied 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                            : 'border-warm-cream hover:border-luxe-copper hover:bg-warm-cream/20 text-luxe-copper bg-white'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copié' : 'Url Link'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteFile(file.name)}
                        className="p-1 px-2 border hover:bg-red-50 text-luxe-muted hover:text-red-600 rounded-lg transition-all border-warm-cream group-hover:border-red-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-warm-cream-dark rounded-2xl bg-white space-y-2">
            <FileImage className="w-8 h-8 text-luxe-muted mx-auto" strokeWidth="1.5" />
            <p className="text-xs text-luxe-muted font-mono uppercase tracking-wider">Médiathèque vide pour l'instant</p>
          </div>
        )}

      </div>
    </div>
  );
}
