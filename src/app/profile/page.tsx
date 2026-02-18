'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Loading from '@/components/Loading';
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
import { Eye, EyeOff } from 'lucide-react';
import { sendJobSummaryEmail, getJobStats, getJobActivity, fetchJobs } from '@/services/jobService';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const Modal = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="card relative w-full max-w-md p-6">
        <button className="absolute right-3 top-2 text-2xl text-slate-500" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {children}
      </div>
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
  const [recentJobs, setRecentJobs] = useState<any[]>([]); // New state
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
          // Re-using fetchJobs service with limit=5 and sort=updatedAt desc
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
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15,118,110,0.08)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  if (!user) return <div className="p-6 text-center">Please log in.</div>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-title text-3xl">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">Manage account details and track your job performance.</p>
          </div>
          <button className="btn-secondary" onClick={() => setEditMode(true)}>
            Edit Profile
          </button>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
              <p className="mt-1 font-semibold text-slate-900">{profile?.name}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{profile?.email}</p>
            </div>
          </div>
        )}
        {!loading && !user?.emailVerified && !profile?.emailVerified && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Your email is not verified.</p>
            <button className="btn-secondary mt-3" onClick={handleResendVerification} disabled={resendLoading}>
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-2xl">Job Performance</h2>
            <button className="btn-primary" onClick={handleSendWeeklyReport}>
              Send Full Report
            </button>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((item) => (
                <Link
                  href={item.label === 'Total Jobs' ? '/jobs' : `/jobs?status=${item.label.toLowerCase()}`}
                  key={item.label}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-slate-50"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="section-title text-2xl">Trend</h2>
          <p className="mb-3 mt-1 text-sm text-slate-600">Status spread across your applications.</p>
          {loading ? <Loading /> : <Line data={chartData} options={chartOptions} />}
        </div>
      </section>

      <section className="card p-5 sm:p-6 overflow-hidden">
        <h2 className="section-title text-2xl mb-4">Recent Activity</h2>
        {loading ? (
          <Loading />
        ) : recentJobs.length === 0 ? (
          <p className="text-slate-500 text-sm">No recent activity found.</p>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                 <tr>
                   <th className="px-4 py-3 font-semibold">Company</th>
                   <th className="px-4 py-3 font-semibold">Position</th>
                   <th className="px-4 py-3 font-semibold">Status</th>
                   <th className="px-4 py-3 font-semibold">Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {recentJobs.map((job) => (
                   <tr key={job.id} className="group hover:bg-slate-50 transition-colors">
                     <td className="px-4 py-3 font-medium text-slate-900">
                        {job.company}
                     </td>
                     <td className="px-4 py-3">{job.position}</td>
                     <td className="px-4 py-3">
                       <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                         ${job.status === 'offer' ? 'bg-emerald-100 text-emerald-700' : 
                           job.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                           job.status === 'interview' ? 'bg-purple-100 text-purple-700' : 
                           'bg-blue-100 text-blue-700'}`}>
                         {job.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-slate-400">
                       {new Date(job.updatedAt).toLocaleDateString()}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title text-2xl">Activity Heatmap</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">Your application consistency over the last year.</p>
        
        {loading ? (
          <Loading />
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="flex gap-1 text-xs text-slate-400 mb-2">
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
              <div className="grid grid-flow-col gap-[3px] grid-rows-7 h-[100px]">
                {Array.from({ length: 371 }).map((_, i) => {
                   const today = new Date();
                   const dayOfWeek = today.getDay(); 
                   const startDate = new Date(today);
                   startDate.setDate(today.getDate() - 364 - dayOfWeek);
                   
                   const date = new Date(startDate);
                   date.setDate(startDate.getDate() + i);
                   
                   const dateStr = date.toISOString().split('T')[0];
                   const count = activityData[dateStr] || 0;
                   
                   let colorClass = 'bg-slate-100';
                   if (count > 0) colorClass = 'bg-emerald-200';
                   if (count > 1) colorClass = 'bg-emerald-400';
                   if (count > 2) colorClass = 'bg-emerald-600';
                   if (count > 3) colorClass = 'bg-emerald-800';
                   if (date > today) return <div key={i} className="w-[10px] h-[10px]"></div>;

                   return (
                    <div
                      key={i}
                      title={`${dateStr}: ${count} applications`}
                      className={`w-[10px] h-[10px] rounded-sm ${colorClass}`}
                    ></div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 justify-end">
                <span>Less</span>
                <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-emerald-800 rounded-sm"></div>
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <Modal open={editMode} onClose={() => setEditMode(false)}>
        <h2 className="section-title text-2xl">Edit Profile</h2>
        <form onSubmit={handleProfileUpdate} className="mt-4 space-y-3">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Name"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Email"
            required
          />
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10"
              placeholder="New password (optional)"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formData.password && (
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10"
                placeholder="Current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
