'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { deleteInterview, fetchAllInterviews, updateInterview } from '@/services/jobService';

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
      upcoming: interviews.filter((i) => new Date(i.scheduledAt).getTime() >= now),
      past: interviews.filter((i) => new Date(i.scheduledAt).getTime() < now),
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
    if (!window.confirm('Delete this interview?')) return;
    try {
      await deleteInterview(id, user.token);
      await loadInterviews();
    } catch (err: any) {
      setError(err.message || 'Failed to delete interview');
    }
  };

  const renderInterview = (interview: any) => (
    <div key={interview.id} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{interview.job.position}</p>
          <p className="text-sm text-slate-600">{interview.job.company}</p>
          <p className="mt-1 text-sm text-slate-700">
            {new Date(interview.scheduledAt).toLocaleString('en-US', { timeZone: 'UTC' })}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            {interview.mode || 'Mode N/A'} · {interview.round || 'Round N/A'} · {interview.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            value={interview.status}
            onChange={(e) => quickStatusUpdate(interview.id, e.target.value)}
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            className="rounded-lg border border-red-200 px-3 py-1 text-sm font-semibold text-red-700"
            onClick={() => removeInterview(interview.id)}
          >
            Delete
          </button>
        </div>
      </div>
      {interview.notes && <p className="mt-2 text-sm text-slate-600">{interview.notes}</p>}
    </div>
  );

  if (authLoading) return <p className="p-6">Checking authentication...</p>;
  if (!user) return <p className="p-6">Please log in to view interviews.</p>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-title text-2xl">Interviews</h1>
            <p className="text-sm text-slate-600">Track all your interviews in one place.</p>
          </div>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {loading ? (
        <p className="text-slate-600">Loading interviews...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="section-title text-xl">Upcoming</h2>
            <div className="mt-4 space-y-3">
              {grouped.upcoming.length ? grouped.upcoming.map(renderInterview) : <p className="text-slate-600">No upcoming interviews.</p>}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="section-title text-xl">Past</h2>
            <div className="mt-4 space-y-3">
              {grouped.past.length ? grouped.past.map(renderInterview) : <p className="text-slate-600">No past interviews.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;
