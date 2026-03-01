'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import { createCompany, deleteCompany, fetchCompanies, updateCompany } from '@/services/jobService';
import FormField from '@/components/FormField';
import { Button } from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';

type CompanyForm = {
  name: string;
  website: string;
  industry: string;
  location: string;
  notes: string;
};

const emptyForm: CompanyForm = {
  name: '',
  website: '',
  industry: '',
  location: '',
  notes: '',
};

const CompaniesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const term = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(term));
  }, [companies, search]);

  const loadCompanies = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchCompanies(user.token);
      setCompanies(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCompanies();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      if (editId) {
        await updateCompany(editId, form, user.token);
      } else {
        await createCompany(form, user.token);
      }
      setForm(emptyForm);
      setEditId(null);
      await loadCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (company: any) => {
    setEditId(company.id);
    setForm({
      name: company.name || '',
      website: company.website || '',
      industry: company.industry || '',
      location: company.location || '',
      notes: company.notes || '',
    });
  };

  const handleDelete = async (company: any) => {
    if (!user) return;
    if (!window.confirm(`Initiate deletion protocol for ${company.name}?`)) return;
    try {
      await deleteCompany(company.id, user.token);
      await loadCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to execute deletion');
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

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[360px_1fr] py-8">
      {/* Sidebar Form */}
      <section className="bg-obsidian-light border border-border p-6 h-fit sticky top-24">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="font-heading text-2xl font-black text-offwhite tracking-tighter uppercase">
            {editId ? 'Edit Entity' : 'New Entity'}<span className="text-electric">.</span>
          </h1>
          <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase mt-2">
            Company Registry Node
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Company Name"
            name="name"
            type="text"
            value={form.name}
            handleChange={handleChange}
            placeholder="e.g. Acme Corp"
          />
          <FormField
            label="Website URL"
            name="website"
            type="text"
            value={form.website}
            handleChange={handleChange}
            placeholder="e.g. acme.com"
          />
          <FormField
            label="Industry Sector"
            name="industry"
            type="text"
            value={form.industry}
            handleChange={handleChange}
            placeholder="e.g. Technology"
          />
          <FormField
            label="Location Coordinates"
            name="location"
            type="text"
            value={form.location}
            handleChange={handleChange}
            placeholder="e.g. Remote, NY"
          />
          
          <div>
             <label htmlFor="notes" className="font-mono text-[10px] text-zinc-500 block uppercase tracking-widest mb-2">
              Entity Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Internal directives..."
              rows={3}
              className="w-full bg-transparent border-b border-border text-offwhite py-2 font-mono text-sm focus:border-electric focus:ring-0 outline-none transition-colors placeholder:text-zinc-700 resize-y"
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Processing...' : editId ? 'Commit Changes' : 'Register Entity'}
            </Button>
            {editId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm);
                }}
                className="w-full text-zinc-400 hover:text-offwhite border border-border"
              >
                Abort
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Main Content Area */}
      <section className="flex flex-col gap-6">
        <div className="bg-obsidian-light border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-black text-offwhite tracking-tighter uppercase">
              Directory<span className="text-electric">.</span>
            </h2>
          </div>
          <div className="w-full sm:w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query parameters..."
              className="w-full bg-transparent border-b border-border text-offwhite py-2 font-mono text-sm focus:border-electric focus:ring-0 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 border border-border border-dashed flex items-center justify-center">
             <div className="font-mono text-electric animate-pulse tracking-widest uppercase text-sm">Loading Directory_</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 border border-border border-dashed flex justify-center text-center">
            <p className="font-mono text-zinc-500 text-sm uppercase tracking-widest">No matching entities found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {filtered.map((company, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={company.id} 
                  className="group relative border border-border bg-obsidian p-5 hover:border-electric transition-colors overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="text-zinc-500 hover:text-offwhite transition-colors" 
                      onClick={() => handleEdit(company)}
                      title="Edit"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button 
                      className="text-zinc-500 hover:text-red-500 transition-colors" 
                      onClick={() => handleDelete(company)}
                      title="Delete"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-xl text-offwhite uppercase tracking-tight mb-2 pr-12">{company.name}</h3>
                    
                    <div className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      <div className="flex justify-between border-b border-border/50 pb-1">
                        <span>Sector</span>
                        <span className="text-zinc-300">{company.industry || 'Undefined'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-1">
                        <span>Location</span>
                        <span className="text-zinc-300">{company.location || 'Undefined'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-1">
                        <span>Web</span>
                        <span className="truncate max-w-[120px] text-electric">{company.website || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="font-mono text-[10px] bg-obsidian-light px-2 py-1 text-zinc-500">
                      ID: {(company.id).toString().padStart(4, '0')}
                    </span>
                    <span className="font-mono text-[10px] text-electric">
                      {company._count?.jobs || 0} LINKED DATA
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
};

export default CompaniesPage;
