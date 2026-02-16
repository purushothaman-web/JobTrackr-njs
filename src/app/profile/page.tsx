'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { sendJobSummaryEmail, getJobStats } from '@/services/jobService';

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
        const [profileRes, statsRes] = await Promise.all([api.get('/auth/me'), getJobStats(user.token)]);
        setProfile(profileRes.data.data);
        setStats(statsRes);
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
              Send Weekly Report
            </button>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
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
