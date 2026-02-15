'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { importJobs } from '@/services/jobService';

const parseCsv = (raw: string) => {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const [headerLine, ...rest] = lines;
  const header = headerLine.split(',').map((h) => h.trim().toLowerCase());
  const hasHeader = ['position', 'company'].every((h) => header.includes(h));
  const dataLines = hasHeader ? rest : lines;
  const keys = hasHeader ? header : ['position', 'company', 'status', 'location', 'notes'];

  return dataLines.map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    keys.forEach((key, idx) => {
      row[key] = values[idx] || '';
    });
    return row;
  });
};

const ImportPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => parseCsv(csvText), [csvText]);

  const handleImport = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const data = await importJobs(rows, user.token);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p className="p-6">Checking authentication...</p>;
  if (!user) return <p className="p-6">Please log in to import jobs.</p>;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="card p-5">
        <h1 className="section-title text-2xl">Import Jobs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste CSV with columns: <code>position,company,status,location,notes</code>
        </p>

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="mt-4 min-h-[300px] w-full rounded-xl border border-slate-300 p-3 font-mono text-sm"
          placeholder={'position,company,status,location,notes\nFrontend Engineer,Acme,applied,Remote,Reached via referral'}
        />

        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={handleImport} disabled={loading || rows.length === 0}>
            {loading ? 'Importing...' : `Import ${rows.length} Rows`}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setCsvText('');
              setResult(null);
              setError('');
            }}
          >
            Clear
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section className="card p-5">
        <h2 className="section-title text-xl">Preview</h2>
        <p className="mt-1 text-sm text-slate-600">First 10 parsed rows before dedupe/import.</p>
        <div className="mt-4 space-y-2">
          {rows.slice(0, 10).map((row: any, idx) => (
            <div key={`${row.position}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{row.position || 'Missing position'}</p>
              <p className="text-slate-600">{row.company || 'Missing company'} · {row.status || 'applied'}</p>
              <p className="text-xs text-slate-500">{row.location || 'No location'}</p>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-slate-600">No rows parsed yet.</p>}
        </div>

        {result && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-900">Import completed</p>
            <p className="mt-1 text-emerald-800">Imported: {result.imported}</p>
            <p className="text-emerald-800">Skipped duplicates: {result.skippedDuplicates}</p>
            <p className="text-emerald-800">Invalid rows: {result.invalidRows}</p>
            <p className="text-emerald-800">Total rows: {result.totalRows}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ImportPage;
