'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { sendJobSummaryEmail, getJobStats, getJobActivity, fetchJobs } from '@/services/jobService';
import FormField from '@/components/FormField';
import { Button } from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const EyeSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const Modal = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-obsidian-light border border-border p-8"
      >
        <button 
           className="absolute right-4 top-4 text-zinc-500 hover:text-offwhite transition-colors" 
           onClick={onClose} 
           aria-label="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        {children}
      </motion.div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', currentPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    setFormData({ name: profile.name || '', email: profile.email || '', password: '', currentPassword: '' });
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [profileRes, statsRes, activityRes, recentRes] = await Promise.all([
          api.get('/auth/me'),
          getJobStats(user.token),
          getJobActivity(user.token),
          fetchJobs({ token: user.token, page: 1, limit: 5, sortBy: 'updatedAt', order: 'desc' })
        ]);
        setProfile(profileRes.data.data);
        setStats(statsRes);
        setActivityData(activityRes);
        setRecentJobs(recentRes.jobs);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMessage('');
      await updateProfile(formData);
      setProfile((prev: any) => ({ ...prev, name: formData.name, email: formData.email }));
      setMessage('Profile updated successfully.');
      setEditMode(false);
    } catch {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!profile?.email) return;
    try {
      setResendLoading(true);
      setError('');
      setMessage('');
      const res = await api.post('/auth/resend-verification', { email: profile.email });
      setMessage(res.data.data?.message || 'Verification email sent.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSendWeeklyReport = async () => {
    try {
      const res = await sendJobSummaryEmail(user?.token);
      setMessage(res.message || 'Summary email sent.');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send summary email.');
      setMessage('');
    }
  };

  const statCards = useMemo(
    () => [
      { label: 'Total Jobs', value: stats?.totalJobs || 0 },
      { label: 'Applied', value: stats?.stats?.applied || 0 },
      { label: 'Interview', value: stats?.stats?.interview || 0 },
      { label: 'Offer', value: stats?.stats?.offer || 0 },
      { label: 'Rejected', value: stats?.stats?.rejected || 0 },
    ],
    [stats]
  );

  const chartData = {
    labels: ['Applied', 'Interview', 'Offer', 'Rejected'],
    datasets: [
      {
        label: 'Count',
        data: [stats?.stats?.applied || 0, stats?.stats?.interview || 0, stats?.stats?.offer || 0, stats?.stats?.rejected || 0],
        borderColor: '#a3e635', // Electric lime
        backgroundColor: 'rgba(163, 230, 53, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#a3e635',
        pointBorderColor: '#0a0a0a',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0, // Sharp lines for brutalist feel
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a0a0a',
        titleFont: { family: 'JetBrains Mono', size: 10 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 0,
        displayColors: false,
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1, font: { family: 'JetBrains Mono', size: 10 }, color: '#71717a' },
        grid: { color: '#27272a' },
        border: { dash: [4, 4] }
      },
      x: {
        ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: '#71717a' },
        grid: { display: false }
      }
    },
  };

  if (!user) return (
     <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-zinc-500 uppercase tracking-widest">Unauthorized Access</div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-8">
      {/* Header Section */}
      <section className="bg-obsidian-light border border-border p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
              Operative_Profile<span className="text-electric">.</span>
            </h1>
            <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase mt-2">
              Account telemetry & performance data
            </p>
          </div>
          <Button variant="secondary" onClick={() => setEditMode(true)}>
            Configure
          </Button>
        </div>
        
        {loading ? (
          <div className="mt-8 p-12 border border-border border-dashed flex items-center justify-center">
             <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Fetching Telemetry_</div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border border-border/50 bg-obsidian p-5 flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Designation</p>
              <p className="font-heading font-bold text-xl text-offwhite">{profile?.name}</p>
            </div>
            <div className="border border-border/50 bg-obsidian p-5 flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Comms Link (Email)</p>
              <p className="font-mono text-electric text-sm tracking-wide">{profile?.email}</p>
            </div>
          </div>
        )}
        
        {!loading && !user?.emailVerified && !profile?.emailVerified && (
          <div className="mt-6 border border-amber-500/50 bg-amber-500/10 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-mono text-xs uppercase tracking-widest text-amber-500">Warning: Comms Link Unverified</p>
            <Button variant="ghost" className="border border-amber-500/50 text-amber-500 hover:bg-amber-500/20 text-xs" onClick={handleResendVerification} disabled={resendLoading}>
              {resendLoading ? 'Transmitting...' : 'Resend Ping'}
            </Button>
          </div>
        )}
      </section>

      {error && <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest">ERR: {error}</div>}
      {message && <div className="p-3 border border-electric/50 bg-electric/10 text-electric font-mono text-xs uppercase tracking-widest">MSG: {message}</div>}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="bg-obsidian-light border border-border p-6 sm:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
            <h2 className="font-heading text-2xl font-black text-offwhite uppercase tracking-tight">System_Metrics</h2>
            <Button variant="ghost" className="border border-border text-zinc-400 hover:text-electric text-xs" onClick={handleSendWeeklyReport}>
              Dispatch Report
            </Button>
          </div>
          
          {loading ? (
             <div className="flex-1 min-h-[200px] border border-border border-dashed flex items-center justify-center">
               <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Aggregating_</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {statCards.map((item) => (
                <Link
                  href={item.label === 'Total Jobs' ? '/jobs' : `/jobs?status=${item.label.toLowerCase()}`}
                  key={item.label}
                  className="group block border border-border bg-obsidian p-4 transition-colors hover:border-electric relative overflow-hidden flex flex-col justify-between min-h-[100px]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">{item.label}</p>
                  <p className="font-heading text-3xl font-black text-offwhite group-hover:text-electric transition-colors">{item.value}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-obsidian-light border border-border p-6 sm:p-8 flex flex-col">
          <div className="mb-6 pb-4 border-b border-border">
             <h2 className="font-heading text-2xl font-black text-offwhite uppercase tracking-tight">Status_Vector</h2>
             <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase mt-1">Application flow distribution.</p>
          </div>
          
          <div className="flex-1 flex items-center justify-center w-full min-h-[200px]">
             {loading ? <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-xs">Plotting_</div> : <div className="w-full relative h-[220px]"><Line data={chartData} options={chartOptions} /></div>}
          </div>
        </div>
      </section>

      <section className="bg-obsidian-light border border-border p-6 sm:p-8 overflow-hidden">
        <div className="mb-6 pb-4 border-b border-border">
          <h2 className="font-heading text-2xl font-black text-offwhite uppercase tracking-tight">Recent_Log</h2>
        </div>
        
        {loading ? (
           <div className="p-12 border border-border border-dashed flex items-center justify-center">
               <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Syncing_</div>
            </div>
        ) : recentJobs.length === 0 ? (
          <div className="p-12 border border-border border-dashed flex justify-center text-center">
            <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">Log is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left font-mono text-[10px] sm:text-xs">
               <thead className="border-b border-border text-zinc-500 uppercase tracking-widest">
                 <tr>
                   <th className="px-4 py-3 font-normal">Entity</th>
                   <th className="px-4 py-3 font-normal">Designation</th>
                   <th className="px-4 py-3 font-normal text-right">Status</th>
                   <th className="px-4 py-3 font-normal text-right">Timestamp</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50 uppercase">
                 {recentJobs.map((job) => (
                   <tr key={job.id} className="group hover:bg-obsidian transition-colors text-zinc-300">
                     <td className="px-4 py-4 truncate max-w-[120px] text-offwhite">{job.company}</td>
                     <td className="px-4 py-4 truncate max-w-[150px]">{job.position}</td>
                     <td className="px-4 py-4 text-right">
                       <span className={`inline-flex items-center border px-2 py-0.5
                         ${job.status === 'offer' ? 'border-electric text-electric bg-electric/10' : 
                           job.status === 'rejected' ? 'border-red-500 text-red-500 bg-red-500/10' : 
                           job.status === 'interview' ? 'border-purple-500 text-purple-500 bg-purple-500/10' : 
                           'border-blue-500 text-blue-500 bg-blue-500/10'}`}>
                         {job.status}
                       </span>
                     </td>
                     <td className="px-4 py-4 text-right text-zinc-500">
                       {new Date(job.updatedAt).toLocaleDateString()}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </section>

      <section className="bg-obsidian border border-border p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-border/50">
           <h2 className="font-heading text-2xl font-black text-offwhite uppercase tracking-tight">Activity_Heatmap</h2>
           <p className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase mt-1">Application consistency matrix (T-365d).</p>
        </div>
        
        {loading ? (
          <div className="p-12 border border-border border-dashed flex items-center justify-center">
             <div className="font-mono text-zinc-500 animate-pulse tracking-widest uppercase text-sm">Rendering Matrix_</div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-[700px]">
              <div className="flex gap-1 text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-3 border-b border-border/20 pb-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - (11 - i));
                  return (
                    <div key={i} className="flex-1">
                      {d.toLocaleString('default', { month: 'short' })}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-flow-col gap-1 grid-rows-7 h-auto">
                {Array.from({ length: 371 }).map((_, i) => {
                   const today = new Date();
                   const dayOfWeek = today.getDay(); 
                   const startDate = new Date(today);
                   startDate.setDate(today.getDate() - 364 - dayOfWeek);
                   
                   const date = new Date(startDate);
                   date.setDate(startDate.getDate() + i);
                   
                   const dateStr = date.toISOString().split('T')[0];
                   const count = activityData[dateStr] || 0;
                   
                   let colorClass = 'bg-obsidian-light border border-border/50';
                   if (count > 0) colorClass = 'bg-[#1a3a14] border-[#224f19]';
                   if (count > 1) colorClass = 'bg-[#29781b] border-[#369624]';
                   if (count > 2) colorClass = 'bg-[#50c83a] border-[#5ee445]';
                   if (count > 3) colorClass = 'bg-electric border-[#b8ff4b] shadow-[0_0_8px_rgba(163,230,53,0.5)]';
                   if (date > today) return <div key={i} className="w-3 h-3 bg-transparent"></div>;

                   return (
                    <div
                      key={i}
                      title={`${dateStr}: ${count} op(s)`}
                      className={`w-3 h-3 ${colorClass} transition-colors hover:border-offwhite cursor-crosshair`}
                    ></div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-4 font-mono text-[10px] uppercase text-zinc-500 justify-end">
                <span>Min</span>
                <div className="w-3 h-3 bg-obsidian-light border border-border/50"></div>
                <div className="w-3 h-3 bg-[#1a3a14] border-[#224f19]"></div>
                <div className="w-3 h-3 bg-[#29781b] border-[#369624]"></div>
                <div className="w-3 h-3 bg-[#50c83a] border-[#5ee445]"></div>
                <div className="w-3 h-3 bg-electric border-[#b8ff4b]"></div>
                <span>Max</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {editMode && (
          <Modal open={editMode} onClose={() => setEditMode(false)}>
            <div className="mb-8 border-b border-border pb-4">
               <h2 className="font-heading text-2xl font-black text-offwhite uppercase tracking-tight">Modify_Config<span className="text-electric">.</span></h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <FormField
                label="Designation"
                type="text"
                name="name"
                value={formData.name}
                handleChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name"
              />
              <FormField
                label="Comms Link"
                type="email"
                name="email"
                value={formData.email}
                handleChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
              />
              
              <div className="relative">
                 <FormField
                  label="New Passcode (Opt)"
                  type={showNewPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  handleChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty to maintain"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-8 text-zinc-500 hover:text-electric transition-colors"
                >
                  {showNewPassword ? <EyeOffSVG /> : <EyeSVG />}
                </button>
              </div>
              
              {formData.password && (
                <div className="relative">
                   <FormField
                    label="Current Passcode"
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    handleChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Required for modification"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-8 text-zinc-500 hover:text-electric transition-colors"
                  >
                    {showCurrentPassword ? <EyeOffSVG /> : <EyeSVG />}
                  </button>
                </div>
              )}
              
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Processing...' : 'Commit Changes'}
                </Button>
                <Button type="button" variant="ghost" className="w-full border border-border text-zinc-400 hover:text-offwhite" onClick={() => setEditMode(false)}>
                  Abort
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
