'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import JobList from '@/components/JobList';
import { useAuth } from '@/context/AuthContext';
import { exportJobsCSV, fetchJobs } from '@/services/jobService';
import { Button } from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';

const JobsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
          limit: 9,
        });
        setJobs(data.jobs); // Set rather than append
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
      loadJobs(pagination.page, false);
    }
  }, [user, pagination.page, loadJobs]);

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const activeFiltersCount = [statusFilter, searchDebounced].filter(Boolean).length;

  const handleExportCSV = async () => {
    try {
      const blob = await exportJobsCSV(user?.token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jobtrackr_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  if (authLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-electric animate-pulse tracking-widest uppercase">Connecting to Database_</div>
    </div>
  );
  
  if (!user) return (
     <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-zinc-500 uppercase tracking-widest">Unauthorized Access</div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-12 border-b border-border pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-6xl md:text-8xl font-black text-offwhite tracking-tighter uppercase leading-[0.8]">
            Log<span className="text-electric">.</span>
          </h1>
          <div className="flex gap-8 mt-6">
            <div>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Total Entries</p>
              <p className="font-heading text-3xl font-bold text-offwhite">{pagination.totalJobs}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Page</p>
              <p className="font-heading text-3xl font-bold text-offwhite">{pagination.page} <span className="text-zinc-600 text-lg">/ {pagination.totalPages}</span></p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={showFilters || activeFiltersCount > 0 ? "primary" : "secondary"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} className="gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-sm uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Filter Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside 
              initial={{ opacity: 0, width: 0, scale: 0.9 }}
              animate={{ opacity: 1, width: 'auto', scale: 1 }}
              exit={{ opacity: 0, width: 0, scale: 0.9 }}
              className="w-full xl:w-80 shrink-0 border border-border bg-obsidian-light p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                <h2 className="font-heading text-xl font-bold uppercase tracking-tight">Parameters</h2>
                <button onClick={() => setShowFilters(false)} className="text-zinc-500 hover:text-offwhite transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="font-mono text-xs text-zinc-500 mb-2 block uppercase tracking-widest">Search</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Company or Position"
                    className="w-full bg-transparent border-b border-border text-offwhite py-2 font-mono text-sm focus:border-electric outline-none transition-colors placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-zinc-500 mb-2 block uppercase tracking-widest">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full bg-obsidian border border-border text-offwhite p-3 font-mono text-sm uppercase focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-obsidian-light text-offwhite font-mono uppercase">ALL STATUSES</option>
                    <option value="applied" className="bg-obsidian-light text-offwhite font-mono uppercase">APPLIED</option>
                    <option value="interview" className="bg-obsidian-light text-offwhite font-mono uppercase">INTERVIEW</option>
                    <option value="offer" className="bg-obsidian-light text-offwhite font-mono uppercase">OFFER</option>
                    <option value="rejected" className="bg-obsidian-light text-offwhite font-mono uppercase">REJECTED</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs text-zinc-500 mb-2 block uppercase tracking-widest">Sort</label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="w-full bg-obsidian border border-border text-offwhite p-3 font-mono text-sm uppercase focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="createdAt" className="bg-obsidian-light text-offwhite font-mono uppercase">DATE</option>
                      <option value="updatedAt" className="bg-obsidian-light text-offwhite font-mono uppercase">UPDATE</option>
                      <option value="company" className="bg-obsidian-light text-offwhite font-mono uppercase">CORP</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-zinc-500 mb-2 block uppercase tracking-widest">Order</label>
                    <select
                      value={order}
                      onChange={(e) => {
                        setOrder(e.target.value);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="w-full bg-obsidian border border-border text-offwhite p-3 font-mono text-sm uppercase focus:border-electric focus:ring-1 focus:ring-electric outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="desc" className="bg-obsidian-light text-offwhite font-mono uppercase">DESC</option>
                      <option value="asc" className="bg-obsidian-light text-offwhite font-mono uppercase">ASC</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border">
                  <Button variant="danger" className="w-full" onClick={clearFilters}>
                    Clear Parameters
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Job List Component */}
        <div className="flex-1 w-full min-w-0">
          {loading && jobs.length === 0 ? (
             <div className="flex h-40 items-center justify-center border border-dashed border-border">
              <div className="font-mono text-electric animate-pulse tracking-widest uppercase text-sm">Querying Records_</div>
            </div>
          ) : (
            <>
              <JobList jobs={jobs} onStatusUpdated={() => setPagination((prev) => ({ ...prev }))} />

              {pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-between items-center bg-obsidian border border-border p-4">
                  <Button 
                    variant="secondary" 
                    onClick={handlePreviousPage} 
                    disabled={loading || pagination.page === 1}
                  >
                    PREV
                  </Button>
                  
                  <span className="font-mono text-zinc-500 text-xs tracking-widest uppercase">
                    SECTOR {pagination.page} OF {pagination.totalPages}
                  </span>

                  <Button 
                    variant="secondary" 
                    onClick={handleNextPage} 
                    disabled={loading || pagination.page === pagination.totalPages}
                  >
                    NEXT
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
