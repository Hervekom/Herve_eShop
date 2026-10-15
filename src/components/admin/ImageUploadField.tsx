import React, { useRef, useState } from 'react';
import { Upload, Link2, X, Loader2 } from 'lucide-react';
import API from '../../lib/api';

/**
 * Champ image de l'admin : téléverser une photo depuis la galerie du téléphone
 * (ou un fichier de l'ordinateur), ou coller un lien. La photo est allégée avant
 * l'envoi (1920 px max, JPEG) : envoi plus rapide sur réseau mobile, site plus léger.
 */

const MAX_SIDE = 1920;
const JPEG_QUALITY = 0.85;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible.'));
    img.src = src;
  });
}

/** Réduit les grandes photos ; garde tel quel les PNG/GIF/SVG (transparence, logos). */
export async function prepareImage(file: File): Promise<{ name: string; dataUrl: string }> {
  const original = await readFileAsDataUrl(file);
  const keepAsIs = /image\/(png|gif|svg\+xml)/.test(file.type);
  if (keepAsIs) return { name: file.name, dataUrl: original };
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { name: file.name, dataUrl: original };
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    // On garde la version la plus légère
    if (compressed.length >= original.length) return { name: file.name, dataUrl: original };
    return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', dataUrl: compressed };
  } catch {
    return { name: file.name, dataUrl: original };
  }
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  required = false,
  hint,
  onError,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  hint?: string;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const hasImage = Boolean(String(value || '').trim());

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Ce fichier n\'est pas une image.');
      return;
    }
    try {
      setUploading(true);
      const { name, dataUrl } = await prepareImage(file);
      const res = await API.uploadMedia(name, dataUrl, 'products');
      if (!res?.url) throw new Error('Le serveur n\'a pas renvoyé de lien.');
      onChange(res.url);
    } catch (err) {
      onError?.((err as Error).message || 'Impossible de téléverser l\'image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="font-bold text-luxe-dark block">
        {label} {required && <span className="text-luxe-copper">*</span>}
      </label>

      <div className="flex items-stretch gap-3">
        {/* Aperçu */}
        <div className="relative w-24 h-20 shrink-0 rounded-xl border border-warm-cream-dark bg-warm-cream/30 overflow-hidden flex items-center justify-center">
          {hasImage ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Retirer l'image"
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 text-luxe-dark flex items-center justify-center shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <span className="text-[11px] text-luxe-muted text-center px-1">Aucune image</span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="min-h-11 px-3.5 rounded-xl border border-luxe-copper bg-white hover:bg-warm-cream text-luxe-copper font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Envoi en cours…' : hasImage ? 'Changer l\'image' : 'Choisir depuis la galerie'}
          </button>
          <button
            type="button"
            onClick={() => setShowUrl((v) => !v)}
            className="self-start text-[11px] text-luxe-muted underline underline-offset-2 flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" />
            {showUrl ? 'Masquer le lien' : 'ou coller un lien'}
          </button>
        </div>
      </div>

      {showUrl && (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full p-2 rounded-xl border border-warm-cream font-mono text-[11px]"
        />
      )}
      {hint && <p className="text-[11px] text-luxe-muted">{hint}</p>}

      {/* Sur téléphone, ouvre la galerie (ou l'appareil photo) */}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
