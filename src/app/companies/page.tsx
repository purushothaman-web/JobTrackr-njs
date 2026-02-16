'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import { createCompany, deleteCompany, fetchCompanies, updateCompany } from '@/services/jobService';

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
    if (!window.confirm(`Delete ${company.name}?`)) return;
    try {
      await deleteCompany(company.id, user.token);
      await loadCompanies();
    } catch (err: any) {
      setError(err.message || 'Failed to delete company');
    }
  };

  if (authLoading) return <Loading fullHeight message="Checking authentication..." />;
  if (!user) return <p className="p-6">Please log in to manage companies.</p>;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
      <section className="card p-5">
        <h1 className="section-title text-2xl">{editId ? 'Edit Company' : 'Add Company'}</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your target companies and link them to jobs.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={4} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
            {editId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title text-2xl">Companies</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:w-72"
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <Loading message="Loading companies..." />
        ) : filtered.length === 0 ? (
          <p className="mt-6 text-slate-600">No companies found.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {filtered.map((company) => (
              <div key={company.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{company.name}</p>
                    <p className="text-sm text-slate-600">{company.industry || 'Industry not set'} · {company.location || 'Location not set'}</p>
                    <p className="mt-1 text-xs text-slate-500">{company._count?.jobs || 0} linked jobs</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => handleEdit(company)}>Edit</button>
                    <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => handleDelete(company)}>Delete</button>
                  </div>
                </div>
                {company.notes && <p className="mt-2 text-sm text-slate-600">{company.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CompaniesPage;
