'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchJob, updateJob } from '@/services/jobService';
import FormField from '@/components/FormField';
import StatusDropdown from '@/components/StatusDropdown';
import Button from '@/components/Button';
import { toast } from 'react-toastify';

const EditJob = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    status: 'applied',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      if (user && user.token && id) {
        try {
          setLoading(true);
          const job = await fetchJob({ token: user.token, id: id as string });
          setFormData(job);
        } catch (err: any) {
          setError(err.message || 'Failed to load job');
        } finally {
          setLoading(false);
        }
      } else if (!authLoading && !user) {
          setLoading(false);
      }
    };

    loadJob();
  }, [id, user, authLoading]);

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
    setFormErrors({ ...formErrors, [e.target.name]: '' }); 
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
      await updateJob(id as string, sanitizedData, user?.token);
      toast.success('Job updated successfully!');
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to update job');
      toast.error('Failed to update job.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p className="text-center mt-10">Loading authentication...</p>;
  if (!user) return <p className="text-center mt-10">Please log in.</p>;
  if (loading && !formData.position) return <p className="text-center mt-10">Loading job details...</p>; // Check formData to allow optimistic UI or ensure data loaded

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-2">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-xl p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B] mb-4 sm:mb-6 text-center">Edit Job Posting</h1>

        {error && (
          <p className="mb-4 text-center text-red-500 font-semibold">{error}</p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3 sm:space-y-4">
            <FormField
              label="Position"
              type="text"
              name="position"
              value={formData.position || ''}
              handleChange={handleChange}
              placeholder="Enter position title"
            />
            {formErrors.position && (
              <p className="text-red-500 text-sm -mt-2 mb-2">{formErrors.position}</p>
            )}

            <FormField
              label="Company"
              type="text"
              name="company"
              value={formData.company || ''}
              handleChange={handleChange}
              placeholder="Enter company name"
            />
            {formErrors.company && (
              <p className="text-red-500 text-sm -mt-2 mb-2">{formErrors.company}</p>
            )}

            <FormField
              label="Location"
              type="text"
              name="location"
              value={formData.location || ''}
              handleChange={handleChange}
              placeholder="Enter job location"
            />
            {formErrors.location && (
              <p className="text-red-500 text-sm -mt-2 mb-2">{formErrors.location}</p>
            )}

            <div>
              <label
                htmlFor="status"
                className="block text-[#1E293B] font-semibold mb-2"
              >
                Status
              </label>
              <StatusDropdown
                currentStatus={formData.status || 'applied'}
                onChange={(e, value) => setFormData({ ...formData, status: value })}
              />
              {formErrors.status && <p className="text-red-500 text-sm -mt-2 mb-2">{formErrors.status}</p>}
            </div>

            <FormField
              label="Notes"
              type="textarea"
              name="notes"
              value={formData.notes || ''}
              handleChange={handleChange} // FormField handles textarea appropriately
              placeholder="Additional notes (optional)"
            />
          </div>

          <Button
            type="submit"
            text={loading ? 'Updating...' : 'Update Job'}
            disabled={loading}
            // className="w-full mt-6 sm:mt-8" // Button component doesn't accept className prop in my definition. I should add it or wrap it.
            // My Button component implementation has fixed classes. I should wrap it in div or update Button.tsx.
            // I'll wrap it in a div.
          />
           {/* Button doesn't accept className, so I'll wrap it */}
        </form>
      </div>
    </div>
  );
};

export default EditJob;
