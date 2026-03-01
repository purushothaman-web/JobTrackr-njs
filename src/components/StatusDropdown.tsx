'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Explicitly separate text, border, and background for cleaner class merging
const STATUS_CONFIGS: Record<string, { base: string; activeBg: string; dot: string; label: string }> = {
  applied: { 
    base: 'text-zinc-300 border-zinc-700', 
    activeBg: 'bg-zinc-800',
    dot: 'bg-zinc-400',
    label: 'APPLIED' 
  },
  interview: { 
    base: 'text-offwhite border-electric font-bold', 
    activeBg: 'bg-electric text-obsidian',
    dot: 'bg-electric',
    label: 'INTERVIEW' 
  },
  offer: { 
    base: 'text-obsidian border-emerald-400 font-bold', 
    activeBg: 'bg-emerald-400',
    dot: 'bg-obsidian',
    label: 'OFFER' 
  },
  rejected: { 
    base: 'text-white border-red-500 font-bold', 
    activeBg: 'bg-red-500',
    dot: 'bg-white',
    label: 'REJECTED' 
  },
};

const options = Object.keys(STATUS_CONFIGS);

interface StatusDropdownProps {
  currentStatus: string;
  onChange: (e: any, value: string) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ currentStatus, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (e: React.MouseEvent, status: string) => {
    e.stopPropagation();
    onChange(e as any, status);
    setIsOpen(false);
  };

  const currentConfig = STATUS_CONFIGS[currentStatus.toLowerCase()] || STATUS_CONFIGS['applied'];

  return (
    <div className="relative group w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono tracking-widest uppercase outline-none transition-all duration-300 border",
          currentConfig.base,
          currentConfig.activeBg,
          isOpen ? "ring-2 ring-electric ring-offset-2 ring-offset-obsidian" : "hover:scale-[1.02]"
        )}
      >
        <span className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", currentConfig.dot)}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", currentConfig.dot)}></span>
          </span>
          {currentConfig.label}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }} 
          className="h-3 w-3 opacity-70" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-zinc-950 border border-zinc-700 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]"
          >
            <div className="p-1.5 font-mono text-[9px] text-zinc-400 uppercase tracking-widest border-b border-zinc-800 bg-black text-center font-bold">
              Set Status
            </div>
            <div className="flex flex-col p-1 gap-1">
              {options.map((status) => {
                const config = STATUS_CONFIGS[status];
                const isActive = status === currentStatus;
                return (
                  <button
                    key={status}
                    type="button"
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 font-mono text-[10px] uppercase transition-all border",
                      isActive 
                        ? cn(config.base, config.activeBg, "text-black border-transparent") 
                        : "text-zinc-300 border-transparent hover:border-zinc-600 bg-zinc-900 hover:bg-zinc-800 hover:text-white cursor-pointer"
                    )}
                    onClick={(e) => handleSelect(e, status)}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("inline-block w-2 h-2 rounded-full", isActive ? "bg-black" : "bg-zinc-500")} />
                      {config.label}
                    </span>
                    {isActive && (
                       <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusDropdown;
