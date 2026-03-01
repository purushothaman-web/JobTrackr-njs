'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  createInterview,
  deleteInterview,
  fetchInterviews,
  fetchJob,
  getJobTimeline,
  updateInterview,
  deleteJob,
} from '@/services/jobService';
import Button from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const JobDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingInterview, setSavingInterview] = useState(false);
  const [form, setForm] = useState({
    scheduledAt: '',
    mode: '',
    round: '',
    status: 'scheduled',
    notes: '',
  });

  const loadAll = useCallback(async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const [jobData, interviewData, timelineData] = await Promise.all([
        fetchJob({ id: id as string, token: user.token }),
        fetchInterviews(id as string, user.token),
        getJobTimeline(id as string, user.token),
      ]);
      setJob(jobData);
      setInterviews(interviewData);
      setTimeline(timelineData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (user && id) {
      loadAll();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, id, authLoading, loadAll]);

  const addInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    try {
      setSavingInterview(true);
      await createInterview(id as string, form, user.token);
      setForm({ scheduledAt: '', mode: '', round: '', status: 'scheduled', notes: '' });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to create interview');
    } finally {
      setSavingInterview(false);
    }
  };

  const setInterviewStatus = async (interviewId: number, status: string) => {
    if (!user) return;
    try {
      await updateInterview(interviewId, { status }, user.token);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to update interview status');
    }
  };

  const removeInterview = async (interviewId: number) => {
    if (!user) return;
    if (!window.confirm('Initiate interview record deletion?')) return;
    try {
      await deleteInterview(interviewId, user.token);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete interview');
    }
  };

  const removeJob = async () => {
    if (!user || !id) return;
    if (!window.confirm('Delete this job and all related activity logs?')) return;
    try {
      await deleteJob(id as string, user.token);
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
    }
  };

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

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Loading Data_</div>
    </div>
  );

  if (!job) return (
    <div className="flex h-[60vh] items-center justify-center border border-dashed border-border p-12">
      <div className="font-mono text-zinc-500 uppercase tracking-widest">Job Record Missing</div>
    </div>
  );

  const inputClasses = "bg-obsidian border border-border text-offwhite px-4 py-3 text-sm font-mono focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-all placeholder:text-zinc-600";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      
      {/* Header Section */}
      <section className="bg-obsidian-light border border-border p-6 sm:p-8 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1 text-[10px] font-mono tracking-widest uppercase border text-electric border-electric bg-electric/10">
                {job.status}
              </span>
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                {job.company}
              </p>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl font-black text-offwhite tracking-tighter uppercase leading-none">
              {job.position}
            </h1>
            
            <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-4 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {job.location || 'Location Unspecified'}
            </p>
          </div>
          
          <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.push(`/edit-job/${job.id}`)}>
              Modify Matrix
            </Button>
            <Button variant="danger" className="w-full sm:w-auto" onClick={removeJob}>
              Erase Entry
            </Button>
          </div>
        </div>
        
        {job.notes && (
          <div className="mt-8 pt-6 border-t border-border relative z-10">
             <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Attached Briefing</p>
             <p className="text-sm font-mono text-zinc-300 leading-relaxed max-w-3xl">{job.notes}</p>
          </div>
        )}
      </section>

      {error && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
        
        {/* Interviews Column */}
        <div className="space-y-6">
          <section className="bg-obsidian border border-border p-6 relative">
            <h2 className="font-heading text-2xl font-black text-electric uppercase tracking-tight mb-6">Schedule Interview</h2>
            
            <form onSubmit={addInterview} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                 <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Time Sync</label>
                 <input 
                  type="datetime-local" 
                  className={cn(inputClasses, "w-full")}
                  value={form.scheduledAt} 
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} 
                  required 
                 />
              </div>
              
              <div className="space-y-1">
                 <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Protocol</label>
                 <input 
                  placeholder="e.g. Video / On-Site" 
                  className={cn(inputClasses, "w-full")} 
                  value={form.mode} 
                  onChange={(e) => setForm({ ...form, mode: e.target.value })} 
                 />
              </div>

              <div className="space-y-1">
                 <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Phase</label>
                 <input 
                  placeholder="e.g. Technical UI" 
                  className={cn(inputClasses, "w-full")} 
                  value={form.round} 
                  onChange={(e) => setForm({ ...form, round: e.target.value })} 
                 />
              </div>

              <div className="space-y-1">
                 <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Initial Set</label>
                 <div className="relative">
                    <select 
                      className={cn(inputClasses, "w-full appearance-none cursor-pointer")} 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="scheduled" className="bg-obsidian text-offwhite">SCHEDULED</option>
                      <option value="completed" className="bg-obsidian text-offwhite">COMPLETED</option>
                      <option value="cancelled" className="bg-obsidian text-offwhite">CANCELLED</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-electric">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                 </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                 <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Preparation Notes</label>
                 <textarea 
                  className={cn(inputClasses, "w-full resize-none")} 
                  rows={3} 
                  placeholder="Inject data..." 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                 />
              </div>

              <Button type="submit" variant="primary" className="sm:col-span-2 mt-2" disabled={savingInterview}>
                {savingInterview ? 'Uplinking...' : 'Commit Intel'}
              </Button>
            </form>
          </section>

          <section className="space-y-4">
             <h2 className="font-heading text-xl font-black text-offwhite uppercase tracking-tight py-2 border-b border-border">Interviews Array</h2>
             <AnimatePresence>
              {interviews.length ? (
                interviews.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.id} 
                    className="group relative border border-border bg-obsidian-light p-5 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <div className="h-2 w-2 bg-electric shrink-0" />
                           <p className="font-mono text-sm tracking-widest text-offwhite uppercase">
                            {new Date(item.scheduledAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                          </p>
                        </div>
                        <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest ml-5">
                          {item.mode || 'N/A'} // {item.round || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col justify-end mt-4 sm:mt-0 sm:items-end w-full sm:w-auto gap-3">
                        <div className="relative w-full sm:w-40">
                           <select
                              className="w-full appearance-none bg-obsidian border border-border text-[10px] font-mono text-offwhite py-2 pl-3 pr-8 focus:outline-none focus:border-electric transition-colors uppercase cursor-pointer"
                              value={item.status}
                              onChange={(e) => setInterviewStatus(item.id, e.target.value)}
                            >
                              <option value="scheduled" className="bg-obsidian text-offwhite">SCHEDULED</option>
                              <option value="completed" className="bg-obsidian text-offwhite">COMPLETED</option>
                              <option value="cancelled" className="bg-obsidian text-offwhite">CANCELLED</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        <button 
                          onClick={() => removeInterview(item.id)}
                          className="font-mono text-[10px] text-zinc-500 hover:text-red-500 uppercase tracking-widest transition-colors text-right"
                        >
                          [ DELETE ]
                        </button>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="mt-4 pt-4 border-t border-border/50 ml-5">
                        <p className="text-xs font-mono text-zinc-400">{item.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="p-8 border border-border border-dashed flex justify-center text-center">
                  <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">No array data.</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Timeline Column */}
        <section className="bg-obsidian border border-border p-6 h-fit sticky top-28">
          <h2 className="font-heading text-xl font-black text-offwhite uppercase tracking-tight mb-6 pb-2 border-b border-border">System Log</h2>
          <div className="space-y-6">
            {timeline.length ? (
              timeline.map((event, idx) => (
                <div key={event.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] last:before:hidden before:w-[1px] before:bg-border">
                  <div className="absolute left-[8px] top-1.5 w-2 h-2 rounded-full bg-zinc-600 ring-4 ring-obsidian z-10" />
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-300 leading-relaxed">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-mono text-electric bg-electric/10 px-1.5 py-0.5 uppercase tracking-widest">
                      {event.type.replaceAll('_', ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                      {new Date(event.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Log is empty.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default JobDetailsPage;
