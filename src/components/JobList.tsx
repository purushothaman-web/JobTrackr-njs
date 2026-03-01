'use client';

import React from 'react';
import JobCard from './JobCard';
import { motion } from 'framer-motion';

interface JobListProps {
  jobs: any[];
  onStatusUpdated?: () => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const JobList: React.FC<JobListProps> = ({ jobs, onStatusUpdated }) => {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 border border-dashed border-border mt-10">
        <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
          No jobs tracked yet.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onStatusUpdated={onStatusUpdated} />
      ))}
    </motion.div>
  );
};

export default JobList;
