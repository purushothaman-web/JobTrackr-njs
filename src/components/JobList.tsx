'use client';

import React from 'react';
import JobCard from './JobCard';

interface JobListProps {
  jobs: any[];
  onStatusUpdated?: () => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onStatusUpdated }) => {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <p className="text-center text-[#64748B] mt-10">
        No jobs found. Please add some jobs to get started.
      </p>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onStatusUpdated={onStatusUpdated} />
        ))}
      </div>
    </div>
  );
};

export default JobList;
