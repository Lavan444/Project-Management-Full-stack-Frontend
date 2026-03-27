import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  className,
  renderOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">{label}</p>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-200 text-sm font-bold",
          isOpen ? "ring-2 ring-indigo-500 bg-white border-transparent shadow-lg shadow-indigo-50" : "hover:bg-slate-100"
        )}
      >
        <div className="flex items-center gap-2.5">
          {selectedOption.icon && <span className={cn(selectedOption.color)}>{selectedOption.icon}</span>}
          {selectedOption.color && !selectedOption.icon && (
            <div className={cn("w-2 h-2 rounded-full", selectedOption.color)} />
          )}
          <span className="text-slate-900">{selectedOption.label}</span>
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full bg-white border border-slate-100 rounded-[24px] shadow-2xl p-2 overflow-hidden overflow-y-auto max-h-[300px] shadow-indigo-100/50"
          >
            <div className="space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                    value === option.value ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {renderOption ? renderOption(option) : (
                      <>
                        {option.icon && <span className={cn(option.color)}>{option.icon}</span>}
                        {option.color && !option.icon && (
                          <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        )}
                        <span className="font-bold text-sm tracking-tight">{option.label}</span>
                      </>
                    )}
                  </div>
                  {value === option.value && <Check size={16} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
