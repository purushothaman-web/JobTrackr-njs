'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StatusDropdown from './StatusDropdown';
import { useAuth } from '@/context/AuthContext';
import { updateJobStatus } from '@/services/jobService';
import { toast } from 'react-toastify';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    applied: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10',
    interview: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    offer: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  };

  const styleClass = styles[status.toLowerCase().trim()] || 'bg-gray-50 text-gray-600 ring-gray-500/10';

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styleClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const JobCard = ({ job, onStatusUpdated }: { job: any, onStatusUpdated?: () => void }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(job.status);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      if (user?.token) {
        await updateJobStatus({ token: user.token, id: job.id, status: newStatus });
        setStatus(newStatus);
        toast.success(`Status updated to "${newStatus}"`);

        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-xl hover:bg-white hover:-translate-y-1">
      <div className="absolute top-6 right-6">
        <StatusBadge status={status} />
      </div>

      <div className="mb-4">
        <Link href={`/jobs/${job.id}`} className="block focus:outline-none">
          <span className="absolute inset-0" aria-hidden="true" />
          <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-violet-600 transition-colors">
            {job.position}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{job.company}</p>
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-x-4 text-xs text-slate-500">
        <div className="flex items-center gap-x-1">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </div>
        <div className="flex items-center gap-x-1">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(job.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center relative z-10">
        {/* Status Dropdown - kept separate from card link */}
        <div className="w-full">
          <StatusDropdown
            currentStatus={status}
            onChange={(e, value) => {
              e.stopPropagation(); // Prevent card click
              handleStatusChange(value);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default JobCard;
