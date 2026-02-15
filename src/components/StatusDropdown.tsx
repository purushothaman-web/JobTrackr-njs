'use client';

import React from 'react';

const options = ['applied', 'interview', 'offer', 'rejected'];

interface StatusDropdownProps {
  currentStatus: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ currentStatus, onChange }) => {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(e, e.target.value)}
      className="
        w-full
        bg-slate-50
        border-0
        ring-1
        ring-slate-200
        rounded-lg
        px-3
        py-2
        text-sm
        font-medium
        text-slate-600
        focus:outline-none
        focus:ring-2
        focus:ring-violet-500/20
        cursor-pointer
        hover:bg-slate-100
        transition-colors
      "
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((status) => (
        <option key={status} value={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </option>
      ))}
    </select>
  );
};

export default StatusDropdown;
