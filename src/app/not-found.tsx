'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-4">
      <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-lg bg-obsidian border border-red-500/50 p-8 sm:p-12 text-center"
      >
        <div className="mb-8">
          <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 font-mono text-[10px] uppercase tracking-widest mb-4">
            Error 404
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-offwhite uppercase tracking-tighter">
            Void_Sector<span className="animate-pulse text-red-500">_</span>
          </h1>
        </div>
        
        <p className="font-mono text-zinc-400 text-sm uppercase tracking-widest mb-10 border-y border-border py-6">
          The referenced coordinate does not exist within the system architecture.
        </p>
        
        <Link href="/jobs" className="inline-block w-full sm:w-auto">
          <Button className="w-full border-red-500 hover:bg-red-500/20 text-red-500">
            Return to Core
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
