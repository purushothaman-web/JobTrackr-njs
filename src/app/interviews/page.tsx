'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { deleteInterview, fetchAllInterviews, updateInterview } from '@/services/jobService';
import { motion, AnimatePresence } from 'framer-motion';

const InterviewsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadInterviews = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchAllInterviews(user.token, statusFilter ? { status: statusFilter } : undefined);
      setInterviews(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => {
    if (user) {
      loadInterviews();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadInterviews]);

  const grouped = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: interviews.filter((i) => {
        const isFuture = new Date(i.scheduledAt).getTime() >= now;
        const isPending = i.status !== 'completed' && i.status !== 'cancelled';
        return isFuture && isPending;
      }),
      past: interviews.filter((i) => {
        const isPast = new Date(i.scheduledAt).getTime() < now;
        const isDone = i.status === 'completed' || i.status === 'cancelled';
        return isPast || isDone;
      }),
    };
  }, [interviews]);

  const quickStatusUpdate = async (id: number, status: string) => {
    if (!user) return;
    try {
      await updateInterview(id, { status }, user.token);
      await loadInterviews();
    } catch (err: any) {
      setError(err.message || 'Failed to update interview');
    }
  };

  const removeInterview = async (id: number) => {
    if (!user) return;
    if (!window.confirm('Initiate interview record deletion?')) return;
    try {
      await deleteInterview(id, user.token);
      await loadInterviews();
    } catch (err: any) {
      setError(err.message || 'Failed to delete interview');
    }
  };

  const renderInterview = (interview: any, index: number) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      key={interview.id} 
      className="group relative border border-border bg-obsidian p-5 hover:border-electric transition-colors overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          className="text-zinc-500 hover:text-red-500 transition-colors bg-obsidian border border-border" 
          onClick={() => removeInterview(interview.id)}
          title="Delete"
        >
          <svg className="w-5 h-5 p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-xl text-offwhite uppercase tracking-tight mb-1 pr-12">
            {interview.job.position}
          </h3>
          <p className="font-mono text-xs uppercase tracking-widest text-electric mb-4">
            {interview.job.company}
          </p>
          
          <div className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            <div className="flex border-b border-border/50 pb-1">
              <span className="w-24">Date/Time</span>
              <span className="text-zinc-300">{new Date(interview.scheduledAt).toLocaleString()}</span>
            </div>
            <div className="flex border-b border-border/50 pb-1">
              <span className="w-24">Type</span>
              <span className="text-zinc-300">{interview.mode || 'N/A'} · {interview.round || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end mt-4 sm:mt-0 sm:items-end w-full sm:w-auto">
          <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1 sm:text-right block">Update Status</label>
          <div className="relative w-full sm:w-40">
             <select
                className="w-full appearance-none bg-obsidian-light border border-border text-xs font-mono text-offwhite py-2 pl-3 pr-8 focus:outline-none focus:border-electric transition-colors uppercase cursor-pointer"
                value={interview.status}
                onChange={(e) => quickStatusUpdate(interview.id, e.target.value)}
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-electric">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
          </div>
        </div>
      </div>
      
      {interview.notes && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Briefing Notes</p>
          <p className="text-sm font-mono text-zinc-300">{interview.notes}</p>
        </div>
      )}
    </motion.div>
  );

  if (authLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-electric animate-pulse tracking-widest uppercase">Checking Auth_</div>
    </div>
  );
  
  if (!user) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-zinc-500 uppercase tracking-widest">Unauthorized Access</div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl py-8 space-y-6">
      <section className="bg-obsidian-light border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            Appointments<span className="text-electric">.</span>
          </h1>
          <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-2">
            Interview Schedule Matrix
          </p>
        </div>
        
        <div className="w-full sm:w-64">
           <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">Global Filter</label>
           <div className="relative">
              <select
                className="w-full appearance-none bg-obsidian border border-border text-sm font-mono text-offwhite py-2.5 pl-4 pr-10 focus:outline-none focus:border-electric transition-colors uppercase cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Appts</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-electric bg-obsidian-light border-l border-border">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
           </div>
        </div>
      </section>

      {error && (
        <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-4">
          <div className="border-b border-border pb-2">
             <h2 className="font-heading text-2xl font-black text-electric uppercase tracking-tight">Active_Queue</h2>
          </div>
          
          {loading ? (
             <div className="p-12 border border-border border-dashed flex items-center justify-center">
               <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Syncing_</div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {grouped.upcoming.length ? (
                  grouped.upcoming.map((i, idx) => renderInterview(i, idx))
                ) : (
                  <div className="p-8 border border-border border-dashed flex justify-center text-center">
                    <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">No active items.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="border-b border-border pb-2">
             <h2 className="font-heading text-2xl font-black text-zinc-500 uppercase tracking-tight">Archive_Log</h2>
          </div>
          
          {loading ? (
             <div className="p-12 border border-border border-dashed flex items-center justify-center">
               <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Syncing_</div>
            </div>
          ) : (
            <div className="space-y-4">
               <AnimatePresence>
                {grouped.past.length ? (
                  grouped.past.map((i, idx) => renderInterview(i, idx))
                ) : (
                  <div className="p-8 border border-border border-dashed flex justify-center text-center">
                    <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">Log is empty.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InterviewsPage;
