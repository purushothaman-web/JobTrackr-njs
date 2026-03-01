'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createJob, fetchCompanies, createCompany } from '@/services/jobService';
import FormField from '@/components/FormField';
import StatusDropdown from '@/components/StatusDropdown';
import Button from '@/components/Button';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AddJob = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Company Auto-complete state
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    status: 'applied',
    notes: ''
  });

  useEffect(() => {
    const loadCompanies = async () => {
      if (user?.token) {
        try {
          const data = await fetchCompanies(user.token);
          setCompanies(data);
        } catch (err) {
          console.error('Failed to load companies', err);
        }
      }
    };
    loadCompanies();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: '' });

    if (name === 'company') {
      if (value.trim()) {
        const filtered = companies.filter(c => 
          c.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCompanies(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const selectCompany = (companyName: string) => {
    setFormData(prev => ({ ...prev, company: companyName }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    setError('');
    
    try {
      const existingCompany = companies.find(c => c.name.toLowerCase() === formData.company.trim().toLowerCase());
      if (!existingCompany) {
        try {
          await createCompany({ name: formData.company.trim() }, user?.token);
          toast.success(`Company "${formData.company}" added to database.`);
        } catch (companyErr) {
          console.error('Failed to auto-create company', companyErr);
        }
      }

      const sanitizedData = {
        position: sanitize(formData.position),
        company: sanitize(formData.company),
        location: sanitize(formData.location),
        status: formData.status,
        notes: sanitize(formData.notes),
      };
      await createJob(sanitizedData, user?.token);
      toast.success('Job Created Successfully');
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
      toast.error('Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl p-8 bg-obsidian-light border border-border"
      >
        <div className="mb-10 border-b border-border pb-6">
          <h1 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            New Entry<span className="text-electric">.</span>
          </h1>
          <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-4">
            Record Application Data
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
              value={formData.position}
              handleChange={handleChange}
              placeholder="e.g. Frontend Engineer"
            />
            {formErrors.position && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.position}</p>
            )}
          </div>
          
          <div className="relative" ref={wrapperRef}>
            <FormField
              label="Company Name"
              type="text"
              name="company"
              value={formData.company}
              handleChange={handleChange}
              placeholder="e.g. Acme Corp"
            />
            {formErrors.company && (
               <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.company}</p>
            )}
            
            {showSuggestions && filteredCompanies.length > 0 && (
                <div className="absolute z-10 w-full bg-obsidian border border-border mt-1 max-h-60 overflow-y-auto">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            className="px-4 py-3 hover:bg-zinc-800 hover:text-electric transition-colors cursor-pointer text-sm font-mono text-offwhite uppercase tracking-wider border-b border-border last:border-0"
                            onClick={() => selectCompany(company.name)}
                        >
                            {company.name}
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div>
            <FormField
              label="Location"
              type="text"
              name="location"
              value={formData.location}
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
              currentStatus={formData.status}
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
              value={formData.notes}
              onChange={handleChange}
              placeholder="Interview details, salary expectations, etc."
              rows={4}
              className="w-full bg-transparent border-b-2 border-border text-offwhite py-2 font-mono text-sm focus:border-electric focus:ring-0 outline-none transition-colors placeholder:text-zinc-700 resize-y"
            />
            {formErrors.notes && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.notes}</p>
            )}
          </div>

          <div className="pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Submit Entry'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddJob;
