'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createJob } from '@/services/jobService';
import FormField from '@/components/FormField';
import StatusDropdown from '@/components/StatusDropdown';
import Button from '@/components/Button';
import { toast } from 'react-toastify';

const AddJob = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    status: 'applied',
    notes: ''
  });

  const allowedStatuses = ['applied', 'interview', 'offer', 'rejected'];
  const sanitize = (text: string) => text.replace(/<[^>]*>?/gm, '').trim();
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.company.trim()) errors.company = 'Company is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!allowedStatuses.includes(formData.status)) errors.status = 'Invalid status';
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: '' }); // clear individual field error
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    setError('');
    try {
      const sanitizedData = {
        position: sanitize(formData.position),
        company: sanitize(formData.company),
        location: sanitize(formData.location),
        status: formData.status,
        notes: sanitize(formData.notes),
      };
      await createJob(sanitizedData, user?.token);
      toast.success('Job created successfully!');
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
      toast.error('Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto mb-6 sm:mb-8 mt-8 sm:mt-12 p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Add Job Posting</h1>
      {error && (
        <p className="mb-4 text-center text-red-500 font-semibold">{error}</p>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6">
        <FormField
          label="Position"
          type="text"
          name="position"
          value={formData.position}
          handleChange={handleChange}
          placeholder="Enter position title"
        />
        {formErrors.position && (
          <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.position}</p>
        )}
        <FormField
          label="Company"
          type="text"
          name="company"
          value={formData.company}
          handleChange={handleChange}
          placeholder="Enter company name"
        />
        {formErrors.company && (
          <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.company}</p>
        )}
        <FormField
          label="Location"
          type="text"
          name="location"
          value={formData.location}
          handleChange={handleChange}
          placeholder="Enter job location"
        />
        {formErrors.location && (
          <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.location}</p>
        )}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="status" className="block text-gray-700 font-semibold mb-2">
            Status
          </label>
          <StatusDropdown
            currentStatus={formData.status}
            onChange={(e, value) => setFormData({ ...formData, status: value })}
          />
          {formErrors.status && <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.status}</p>}
        </div>
        <div className="mb-4 sm:mb-6">
          <label htmlFor="notes" className="block text-gray-700 font-semibold mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional notes"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formErrors.notes && (
            <p className="text-red-500 text-sm mt-1">{formErrors.notes}</p>
          )}
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            text={loading ? 'Creating...' : 'Create Job'}
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default AddJob;
