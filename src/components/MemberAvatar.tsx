import React from 'react';
import { cn } from '../lib/utils';
import { User } from '../types';
import { BACKEND_URL } from '../services/api';

interface MemberAvatarProps {
  user?: User;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showName?: boolean;
  hasTooltip?: boolean;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ 
  user, 
  size = 'md', 
  className,
  showName = false,
  hasTooltip = false
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) {
    return (
      <div className={cn(
        "rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border-2 border-white shadow-sm",
        sizeClasses[size],
        className
      )}>
        ?
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("relative group/avatar shrink-0", className)}>
        <div 
          className={cn(
            "rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm overflow-hidden",
            sizeClasses[size],
            !user.avatar && "bg-indigo-100 text-indigo-600"
          )}
        >
          {user.avatar ? (
            <img 
              src={user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`} 
              alt={user.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{getInitials(user.name)}</span>
          )}
        </div>

        {hasTooltip && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
            whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded 
            opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-all z-[100] shadow-xl border border-slate-800 font-bold">
            {user.name}
          </div>
        )}
      </div>
      {showName && (
        <span className="text-sm font-medium text-slate-700">{user.name}</span>
      )}
    </div>
  );
};
