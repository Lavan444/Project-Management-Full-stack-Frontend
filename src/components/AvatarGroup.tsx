import React from 'react';
import { MemberAvatar } from './MemberAvatar';
import { User } from '../types';
import { cn } from '../lib/utils';

interface AvatarGroupProps {
  users: User[];
  limit?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  users, 
  limit = 4, 
  size = 'sm',
  className 
}) => {
  const visibleUsers = users.slice(0, limit);
  const remainingUsers = users.slice(limit);
  const remainingCount = remainingUsers.length;
  const remainingNames = remainingUsers.map(u => u.name).join(', ');

  const sizeClasses = {
    xs: 'w-6 h-6 -ml-2',
    sm: 'w-8 h-8 -ml-3',
    md: 'w-10 h-10 -ml-4',
  };

  return (
    <div className={cn("flex items-center pl-3", className)}>
      {visibleUsers.map((user) => (
        <MemberAvatar 
          key={user.id} 
          user={user} 
          size={size} 
          hasTooltip={true}
          className={cn("first:ml-0", sizeClasses[size])} 
        />
      ))}
      {remainingCount > 0 && (
        <div 
          className={cn(
            "rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm z-10 relative group/remaining",
            sizeClasses[size].split(' ')[0], // Get width
            sizeClasses[size].split(' ')[1], // Get height
            sizeClasses[size].split(' ')[2]  // Get margin
          )}
        >
          +{remainingCount}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
            whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded 
            opacity-0 group-hover/remaining:opacity-100 pointer-events-none transition-all z-[100] shadow-xl border border-slate-800 font-bold">
            {remainingNames}
          </div>
        </div>
      )}
    </div>
  );
};
