import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ProductImageInfo {
  dataUrl: string;
  width: number;
  height: number;
}

const thumbnailCache = new Map<string, ProductImageInfo>();

async function loadViaBlob(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function getProductImage(url: string, fileName: string): Promise<ProductImageInfo | null> {
  if (thumbnailCache.has(url)) {
    return thumbnailCache.get(url)!;
  }

  const ext = fileName.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'pdf') {
      const loadingTask = pdfjsLib.getDocument({ url });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      // @ts-expect-error canvasContext type in pdfjs-dist
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const result = { dataUrl, width: canvas.width, height: canvas.height };
      thumbnailCache.set(url, result);
      return result;
    }

    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext || '')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });

      if (loaded) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const result = { dataUrl, width: canvas.width, height: canvas.height };
            thumbnailCache.set(url, result);
            return result;
          }
        } catch {
          // Canvas tainted, fallback to blob
        }
      }

      const blobDataUrl = await loadViaBlob(url);
      if (blobDataUrl) {
        const result = { dataUrl: blobDataUrl, width: 600, height: 600 };
        thumbnailCache.set(url, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Erro ao processar imagem do produto:', err);
  }

  // Fallback to direct blob if possible
  const blobDataUrl = await loadViaBlob(url);
  if (blobDataUrl) {
    const result = { dataUrl: blobDataUrl, width: 600, height: 600 };
    thumbnailCache.set(url, result);
    return result;
  }

  return null;
}
