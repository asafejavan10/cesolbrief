import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../utils/cn';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

export function UserAvatar({
  src,
  name,
  size = 'md',
  className,
  showBorder = false,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-2xl',
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const hasValidImage = Boolean(src && !imageError);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-bold select-none transition-all',
        sizeClasses[size],
        showBorder ? 'border-2 border-stone-800' : 'border border-stone-200/80',
        hasValidImage ? 'bg-stone-100' : 'bg-stone-100 text-stone-700',
        className
      )}
    >
      {hasValidImage ? (
        <img
          src={src || ''}
          alt={name}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex items-center justify-center font-bold tracking-tight">
          {name ? getInitials(name) : <User size={size === 'xs' ? 12 : size === 'sm' ? 14 : 18} />}
        </span>
      )}
    </div>
  );
}
