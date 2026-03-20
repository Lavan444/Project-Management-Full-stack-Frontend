import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import { MemberAvatar } from './MemberAvatar';
import { User } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MultiSelectMembersProps {
  allUsers: User[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  highlightUserIds?: string[];
  placeholder?: string;
  className?: string;
}

export const MultiSelectMembers: React.FC<MultiSelectMembersProps> = ({
  allUsers,
  selectedUserIds,
  onChange,
  highlightUserIds,
  placeholder = "Select team members...",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUsers = allUsers.filter(u => selectedUserIds.includes(u.id));
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "min-h-[50px] w-full px-4 border border-slate-200 rounded-2xl flex flex-wrap gap-2 items-center cursor-pointer hover:border-indigo-300 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20",
          isOpen && "border-indigo-500 ring-2 ring-indigo-500/20"
        )} style={{ minWidth: '250px' }}
      >
        {selectedUsers.length === 0 && (
          <span className="text-slate-400 text-sm ml-1">{placeholder}</span>
        )}
        
        <AnimatePresence>
          {selectedUsers.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 bg-whiste bordesr bordesr-slate-200 rounded-full shadow-sm"
            >
            
              <div className="relative group">
                <MemberAvatar user={user} size="sm" />

                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded 
                opacity-0 group-hover:opacity-100 pointer-events-none transition">
                  {user.name}
                </div>
              </div>

              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeUser(user.id, e);
                }}
                className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="ml-auto w-fit flex items-center justify-end text-slate-400 pointer-events-none pr-1">
          <ChevronDown size={18} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-400">No members found</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isHighlighted = highlightUserIds?.includes(user.id);
                  return (
                    <div 
                      key={user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUser(user.id);
                      }}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors relative",
                        isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      )}
                    >
                      {isHighlighted && !isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200" title="Project Member" />
                      )}
                      <div className="flex items-center gap-3">
                        <MemberAvatar user={user} size="sm" />
                        <div>
                          <p className={cn("text-sm font-bold text-slate-900", isHighlighted && "text-indigo-600")}>
                            {user.name} 
                            {isHighlighted && <span className="ml-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">Project Member</span>}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
