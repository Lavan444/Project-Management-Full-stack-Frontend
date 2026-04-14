import React, { useRef, useState } from 'react';
import { Plus, X, FileText, Trash2, UploadCloud } from 'lucide-react';
import { Attachment } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  attachments,
  onChange,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'csv', 'mp4', 'mp3', 'svg'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = (Array.from(files) as File[]).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext && ALLOWED_EXTENSIONS.includes(ext);
      });
      
      if (validFiles.length < files.length) {
        alert('Some files were skipped because their format is not supported.');
      }
      
      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    }
  };

  const addFiles = (files: File[]) => {
    const newAttachments: Attachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file), // Simulate URL
      type: file.type.split('/')[1] || 'file',
      size: formatFileSize(file.size),
      uploadedAt: new Date().toISOString(),
      file: file // Store the original file for upload
    }));
    onChange([...attachments, ...newAttachments]);
  };

  const removeFile = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      const validFiles = (Array.from(files) as File[]).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext && ALLOWED_EXTENSIONS.includes(ext);
      });
      
      if (validFiles.length < files.length) {
        alert('Some files were skipped because their format is not supported.');
      }
      
      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed border-slate-200 rounded-[20px] p-3 flex items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group",
          isDragging && "border-indigo-500 bg-indigo-50/50 text-indigo-600 scale-[0.99]"
        )}
      >
        <input
          type="file"
          multiple
          accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv,.mp4,.mp3,.svg"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="p-0 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
            <UploadCloud size={20} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">Click or drag files to upload</p>
            {/* <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">PDF, PNG, JPG, ZIP (Max 3MB)</p> */}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {attachments.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-indigo-200 transition-all" style={{ width: "max-content" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{file.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{file.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
