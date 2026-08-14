import { useState } from 'react';
import { BRAND_IMAGE_KEYS } from '../lib/brandImages';

/**
 * TEMPORARY owner tool: add the QR and clothing-guide images from inside the
 * app, stored in this browser, until the real files are committed to
 * public/brand/. Remove this component (and its use on the Dashboard) once the
 * files ship.
 */

function fileToDataUrl(
  file: File,
  maxSize: number,
  mime: 'image/png' | 'image/jpeg',
  quality = 0.92,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      // Flatten onto white so a transparent QR stays scannable.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(mime, quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function Slot({
  label,
  storageKey,
  hint,
  square,
}: {
  label: string;
  storageKey: string;
  hint: string;
  square?: boolean;
}) {
  const [value, setValue] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });
  const [err, setErr] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr('');
    try {
      const data = square
        ? await fileToDataUrl(f, 700, 'image/png')
        : await fileToDataUrl(f, 1200, 'image/jpeg', 0.85);
      localStorage.setItem(storageKey, data);
      setValue(data);
    } catch {
      setErr('Could not read that image — try a PNG or JPG.');
    }
  }

  function clear() {
    localStorage.removeItem(storageKey);
    setValue(null);
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {value && (
          <button className="text-xs text-red-600 hover:underline" onClick={clear}>
            Remove
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>
      {value ? (
        <img
          src={value}
          alt={label}
          className="mb-2 max-h-32 w-auto rounded-lg border border-slate-100 object-contain"
        />
      ) : null}
      <label className="btn-ghost cursor-pointer text-sm">
        {value ? 'Replace image' : 'Choose image'}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function BrandUploader() {
  return (
    <div className="card border-dashed p-4">
      <div className="mb-2">
        <h2 className="font-semibold">Add brand images (temporary)</h2>
        <p className="text-sm text-slate-500">
          Saved in this browser so they show up right away. The QR is stamped onto
          shared images; the clothing guide shows in the dot guide.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slot
          label="QR code"
          storageKey={BRAND_IMAGE_KEYS.qr}
          hint="Your QR (blue on white). Goes in the corner of shared images."
          square
        />
        <Slot
          label="Clothing guide"
          storageKey={BRAND_IMAGE_KEYS.clothing}
          hint="The fitted-vs-baggy graphic shown in the dot guide."
        />
      </div>
    </div>
  );
}
