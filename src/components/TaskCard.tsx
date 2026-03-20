import React from 'react';
import {
  MoreHorizontal,
  Clock,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { Task, User } from '../types';
import { cn } from '../lib/utils';
import { MemberAvatar } from './MemberAvatar';
import { AvatarGroup } from './AvatarGroup';

interface TaskCardProps {
  task: Task;
  assignees?: User[];
  onClick?: () => void;
  onEditClick?: (e: React.MouseEvent) => void;
  onMenuClick?: (e: React.MouseEvent) => void;
  onDeleteClick?: (e: React.MouseEvent) => void;
  showProjectName?: boolean;
  canManage?: boolean;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignees = [],
  onClick,
  onEditClick,
  onMenuClick,
  onDeleteClick,
  showProjectName = true,
  canManage = false,
  className
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in-progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'review': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
            getPriorityColor(task.priority)
          )}>
            {task.priority}
          </span>
          <span className={cn(
            "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
            getStatusColor(task.status)
          )}>
            {task.status}
          </span>
        </div>
        {canManage && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {onEditClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditClick(e); }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Edit task"
              >
                <Edit2 size={16} />
              </button>
            )}
            {onDeleteClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteClick(e); }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Delete task"
              >
                <Trash2 size={16} />
              </button>
            )}
            {onMenuClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onMenuClick(e); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <h4 className="text-sm font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h4>

      {showProjectName && task.project && (
        <p className="text-xs font-medium text-slate-400 mb-4 line-clamp-1 flex items-center gap-1.5">
          <AlertCircle size={12} className="text-slate-300" />
          {task.project}
        </p>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.labels.map(label => (
            <span key={label} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-bold uppercase tracking-wider border border-slate-100">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar size={12} />
            <span className="text-[10px] font-bold uppercase">
              {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : "No date"}
            </span>
          </div>
          {(task.comments?.length || 0) > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <MessageSquare size={12} />
              <span className="text-[10px] font-bold">{task.comments?.length}</span>
            </div>
          )}
          {(task.attachments?.length || 0) > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <Paperclip size={12} />
              <span className="text-[10px] font-bold">{task.attachments?.length}</span>
            </div>
          )}
        </div>
        <AvatarGroup users={assignees} size="xs" limit={3} />
      </div>
    </div>
  );
};
