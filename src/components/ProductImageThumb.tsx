import { useEffect, useState } from 'react';
import { Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import { getProductImage, ProductImageInfo } from '../utils/productThumbnail';

interface ProductImageThumbProps {
  url: string;
  fileName: string;
  className?: string;
  onClick?: () => void;
}

export function ProductImageThumb({ url, fileName, className = '', onClick }: ProductImageThumbProps) {
  const [loading, setLoading] = useState(true);
  const [imageInfo, setImageInfo] = useState<ProductImageInfo | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProductImage(url, fileName)
      .then((info) => {
        if (active) {
          setImageInfo(info);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [url, fileName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 ${className}`}>
        <Loader2 className="animate-spin text-stone-400" size={24} />
      </div>
    );
  }

  if (imageInfo?.dataUrl) {
    return (
      <img
        src={imageInfo.dataUrl}
        alt={fileName}
        className={`object-contain transition-transform duration-200 hover:scale-105 cursor-pointer ${className}`}
        onClick={onClick}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 bg-stone-100 text-stone-400 ${className}`}>
      {fileName.toLowerCase().endsWith('.pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
      <span className="text-[10px] font-bold uppercase truncate max-w-[90%] px-1">{fileName}</span>
    </div>
  );
}
