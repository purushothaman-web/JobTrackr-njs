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
import Loading from '@/components/Loading';

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
    if (!window.confirm('Delete this interview?')) return;
    try {
      await deleteInterview(interviewId, user.token);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete interview');
    }
  };

  const removeJob = async () => {
    if (!user || !id) return;
    if (!window.confirm('Delete this job and all related interviews/timeline entries?')) return;
    try {
      await deleteJob(id as string, user.token);
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
    }
  };

  if (authLoading) return <Loading fullHeight message="Checking authentication..." />;
  if (!user) return <p className="p-6">Please log in.</p>;
  if (loading) return <Loading fullHeight message="Loading job details..." />;
  if (!job) return <p className="p-6">Job not found.</p>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-title text-3xl">{job.position}</h1>
            <p className="mt-1 text-slate-600">{job.company} · {job.location || 'Location not set'}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Current status: {job.status}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => router.push(`/edit-job/${job.id}`)}>Edit</button>
            <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" onClick={removeJob}>Delete</button>
          </div>
        </div>
        {job.notes && <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{job.notes}</p>}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="card p-5">
          <h2 className="section-title text-xl">Interviews</h2>
          <form onSubmit={addInterview} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="datetime-local" className="rounded-lg border border-slate-300 px-3 py-2" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
            <input placeholder="Mode (online/on-site)" className="rounded-lg border border-slate-300 px-3 py-2" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} />
            <input placeholder="Round (HR/Tech)" className="rounded-lg border border-slate-300 px-3 py-2" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} />
            <select className="rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <textarea className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" rows={3} placeholder="Interview notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button className="btn-primary sm:col-span-2" disabled={savingInterview}>{savingInterview ? 'Saving...' : 'Add Interview'}</button>
          </form>

          <div className="mt-5 space-y-3">
            {interviews.length ? (
              interviews.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {new Date(item.scheduledAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                      </p>
                      <p className="text-sm text-slate-600">{item.mode || 'Mode N/A'} · {item.round || 'Round N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="rounded-lg border border-slate-300 px-2 py-1 text-sm" value={item.status} onChange={(e) => setInterviewStatus(item.id, e.target.value)}>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button className="rounded-lg border border-red-200 px-3 py-1 text-sm font-semibold text-red-700" onClick={() => removeInterview(item.id)}>Delete</button>
                    </div>
                  </div>
                  {item.notes && <p className="mt-2 text-sm text-slate-700">{item.notes}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No interviews added yet.</p>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title text-xl">Activity Timeline</h2>
          <div className="mt-4 space-y-3">
            {timeline.length ? (
              timeline.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{event.description}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{event.type.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(event.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No timeline events yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default JobDetailsPage;
