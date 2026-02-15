'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import JobList from '@/components/JobList';
import { useAuth } from '@/context/AuthContext';
import { exportJobsCSV, fetchJobs } from '@/services/jobService';

const JobsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalJobs: 0 });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handler = debounce(() => {
      setSearchDebounced(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 450);
    handler();
    return () => handler.cancel();
  }, [search]);

  const loadJobs = useCallback(
    async (page = 1, append = false) => {
      if (authLoading || !user) return;
      try {
        setLoading(true);
        const data = await fetchJobs({
          token: user.token,
          page,
          status: statusFilter,
          sortBy,
          order,
          search: searchDebounced,
        });
        setJobs((prev) => (append ? [...prev, ...data.jobs] : data.jobs));
        setPagination({ page: data.page, totalPages: data.totalPages, totalJobs: data.totalJobs });
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    },
    [authLoading, user, statusFilter, sortBy, order, searchDebounced]
  );

  useEffect(() => {
    if (user) {
      loadJobs(pagination.page, pagination.page > 1);
    }
  }, [user, pagination.page, loadJobs]);

  const activeFilters = useMemo(() => {
    const tags: string[] = [];
    if (statusFilter) tags.push(`Status: ${statusFilter}`);
    if (searchDebounced) tags.push(`Search: ${searchDebounced}`);
    tags.push(`Sort: ${sortBy} (${order})`);
    return tags;
  }, [statusFilter, searchDebounced, sortBy, order]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSortBy('createdAt');
    setOrder('desc');
    setSearch('');
    setSearchDebounced('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportJobsCSV(user?.token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jobs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  if (authLoading) return <p className="p-6 text-center">Checking authentication...</p>;
  if (!user) return <p className="p-6 text-center">Please log in to view jobs.</p>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title text-3xl">Jobs</h1>
            <p className="mt-1 text-sm text-slate-600">Track applications, status updates, and progress in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary sm:hidden" onClick={() => setShowFilters((prev) => !prev)}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button className="btn-primary" onClick={handleExportCSV}>
              Export CSV
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Jobs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{pagination.totalJobs}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Current Page</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{pagination.page}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Pages</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{pagination.totalPages}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="grid gap-6 sm:grid-cols-[270px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} card p-4 sm:block`}>
          <h2 className="section-title text-xl">Filters</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="statusFilter" className="mb-1 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">All</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="search" className="mb-1 block text-sm font-semibold text-slate-700">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Position or company"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="sortBy" className="mb-1 block text-sm font-semibold text-slate-700">
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="createdAt">Date Created</option>
                <option value="updatedAt">Last Updated</option>
                <option value="position">Position</option>
                <option value="company">Company</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label htmlFor="order" className="mb-1 block text-sm font-semibold text-slate-700">
                Order
              </label>
              <select
                id="order"
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <button className="btn-secondary w-full" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </aside>

        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {activeFilters.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {item}
              </span>
            ))}
          </div>

          <JobList jobs={jobs} onStatusUpdated={() => setPagination((prev) => ({ ...prev }))} />

          {pagination.page < pagination.totalPages && (
            <div className="mt-5 text-center">
              <button className="btn-primary" onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default JobsPage;
