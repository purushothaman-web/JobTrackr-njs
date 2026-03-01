'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchJob, updateJob } from '@/services/jobService';
import FormField from '@/components/FormField';
import StatusDropdown from '@/components/StatusDropdown';
import Button from '@/components/Button';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

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
    if (!formData.position.trim()) errors.position = 'Position required';
    if (!formData.company.trim()) errors.company = 'Company required';
    if (!formData.location.trim()) errors.location = 'Location required';
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
      toast.success('Job Record Updated');
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to update job');
      toast.error('Failed to update job.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-electric animate-pulse tracking-widest uppercase">Checking Auth_</div>
    </div>
  );
  
  if (!user) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-zinc-500 uppercase tracking-widest">Unauthorized Access</div>
    </div>
  );

  if (loading && !formData.position) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="font-mono text-electric animate-pulse tracking-widest uppercase">Loading Record_</div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl p-8 bg-obsidian-light border border-border"
      >
        <div className="mb-10 border-b border-border pb-6">
          <h1 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            Edit Entry<span className="text-electric">.</span>
          </h1>
          <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-4">
            Modify Application Data
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <div>
            <FormField
              label="Position Title"
              type="text"
              name="position"
              value={formData.position || ''}
              handleChange={handleChange}
              placeholder="e.g. Frontend Engineer"
            />
            {formErrors.position && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.position}</p>
            )}
          </div>

          <div>
            <FormField
              label="Company Name"
              type="text"
              name="company"
              value={formData.company || ''}
              handleChange={handleChange}
              placeholder="e.g. Acme Corp"
            />
            {formErrors.company && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.company}</p>
            )}
          </div>

          <div>
            <FormField
              label="Location"
              type="text"
              name="location"
              value={formData.location || ''}
              handleChange={handleChange}
              placeholder="e.g. Remote, NY"
            />
            {formErrors.location && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="font-mono text-xs text-zinc-500 block uppercase tracking-widest mb-3">
              Application Status
            </label>
            <StatusDropdown
              currentStatus={formData.status || 'applied'}
              onChange={(e, value) => setFormData({ ...formData, status: value })}
            />
            {formErrors.status && <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.status}</p>}
          </div>

          <div>
             <label htmlFor="notes" className="font-mono text-xs text-zinc-500 block uppercase tracking-widest mb-3">
              Additional Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Interview details, salary expectations, etc."
              rows={4}
              className="w-full bg-transparent border-b-2 border-border text-offwhite py-2 font-mono text-sm focus:border-electric focus:ring-0 outline-none transition-colors placeholder:text-zinc-700 resize-y"
            />
          </div>

          <div className="pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Update Record'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditJob;
