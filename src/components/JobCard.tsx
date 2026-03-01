'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StatusDropdown from './StatusDropdown';
import { useAuth } from '@/context/AuthContext';
import { updateJobStatus } from '@/services/jobService';
import { toast } from 'react-toastify';
import { motion, Variants } from 'framer-motion';

import { Button } from './Button';

export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
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
        toast.success(`Status updated to ${newStatus}`);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="group relative bg-obsidian-light border border-border p-6 transition-colors hover:border-zinc-500 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-32">
            <StatusDropdown
              currentStatus={status}
              onChange={(e, value) => {
                e.preventDefault();
                handleStatusChange(value);
              }}
            />
          </div>
          <Link 
            href={`/jobs?search=${encodeURIComponent(job.company)}`}
            className="text-xs font-mono text-zinc-500 hover:text-electric transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {job.company.toUpperCase()}
          </Link>
        </div>

        <div className="mb-8">
          <Link href={`/jobs/${job.id}`} className="block focus:outline-none group/title">
            <h3 className="font-heading text-2xl font-bold text-offwhite tracking-tight leading-tight group-hover/title:text-electric transition-colors line-clamp-2">
              {job.position}
            </h3>
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span className="truncate max-w-[120px]">{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="pt-4 mt-6 border-t border-border">
          <Link href={`/jobs/${job.id}`} className="block w-full">
            <Button variant="ghost" className="w-full text-xs text-zinc-400 font-mono tracking-widest border border-transparent hover:border-zinc-800 transition-colors">
              Access Details_
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
