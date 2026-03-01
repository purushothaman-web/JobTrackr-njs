'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { importJobs } from '@/services/jobService';
import { Button } from '@/components/Button';
import { motion, AnimatePresence } from 'framer-motion';

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
      // Wait to clear UI
      setTimeout(() => {
         setResult(null);
         setCsvText('');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Import failed');
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

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_1fr] py-8">
      <section className="bg-obsidian border border-border p-6 sm:p-8 h-fit">
        <div className="mb-6 pb-4 border-b border-border">
          <h1 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            Data_Ingestion<span className="text-electric">.</span>
          </h1>
          <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase mt-2">
            Import CSV Payload: <span className="text-electric">position,company,status,location,notes</span>
          </p>
        </div>

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="min-h-[350px] w-full bg-obsidian-light border border-border p-4 font-mono text-xs text-offwhite focus:border-electric outline-none transition-colors placeholder:text-zinc-700 resize-y"
          placeholder={"position,company,status,location,notes\nFrontend Engineer,Acme,applied,Remote,Reached via referral"}
        />

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <Button 
             className="w-full sm:w-auto"
             onClick={handleImport} 
             disabled={loading || rows.length === 0}
          >
            {loading ? 'Ingesting Data...' : `Execute Import (${rows.length})`}
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto border border-border text-zinc-400 hover:text-offwhite"
            onClick={() => {
              setCsvText('');
              setResult(null);
              setError('');
            }}
          >
            Flush Buffer
          </Button>
        </div>
        
        {error && (
          <div className="mt-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest">
            ERR: {error}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        {result ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-electric/10 border border-electric p-6"
           >
              <h2 className="font-heading text-2xl font-black text-electric uppercase tracking-tight mb-4">Ingestion Complete</h2>
              <div className="flex flex-col gap-2 font-mono text-xs uppercase tracking-widest text-zinc-300">
                <div className="flex justify-between border-b border-electric/20 pb-2">
                  <span>Successfully Imported</span>
                  <span className="text-electric">{result.imported}</span>
                </div>
                <div className="flex justify-between border-b border-electric/20 pb-2">
                  <span>Skipped Duplicates</span>
                  <span className="text-zinc-500">{result.skippedDuplicates}</span>
                </div>
                <div className="flex justify-between border-b border-electric/20 pb-2">
                  <span>Invalid Rows</span>
                  <span className="text-red-400">{result.invalidRows}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span>Total Parsed</span>
                  <span className="text-offwhite">{result.totalRows}</span>
                </div>
              </div>
           </motion.div>
        ) : (
          <div className="bg-obsidian-light border border-border p-6 flex flex-col h-full">
            <div className="mb-4 pb-4 border-b border-border">
              <h2 className="font-heading text-2xl font-black text-zinc-500 uppercase tracking-tight">Buffer_Preview</h2>
              <p className="font-mono text-[10px] text-zinc-600 tracking-widest uppercase mt-1">Displaying head (n=10)</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              <AnimatePresence>
                {rows.slice(0, 10).map((row: any, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={`${row.position}-${idx}`} 
                    className="border border-border/50 bg-obsidian p-3"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-heading font-bold text-sm text-offwhite uppercase tracking-tight mb-0.5">{row.position || 'NULL'}</p>
                        <p className="font-mono text-[10px] uppercase text-electric">{row.company || 'NULL'} <span className="text-zinc-500">· {row.status || 'applied'}</span></p>
                      </div>
                      <span className="font-mono text-[10px] bg-obsidian-light px-1.5 py-0.5 text-zinc-500 uppercase">
                        {row.location || 'NULL'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {!rows.length && (
                 <div className="h-40 flex items-center justify-center border border-border border-dashed">
                    <p className="font-mono text-zinc-600 text-xs uppercase tracking-widest">Buffer Empty</p>
                 </div>
              )}
            </div>
            
            {rows.length > 10 && (
              <div className="mt-4 pt-4 border-t border-border text-center">
                 <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">+ {rows.length - 10} additional rows omitted in preview</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ImportPage;
