'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const [status, setStatus] = useState(() =>
    token
      ? { loading: true, success: false, message: 'Initiating handshake...' }
      : { loading: false, success: false, message: 'ERR_MISSING_TOKEN' }
  );

  const verifyRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    if (verifyRef.current) return;
    verifyRef.current = true;

    const verify = async () => {
      try {
         // Add artificial delay for aesthetic feel
        await new Promise(r => setTimeout(r, 1500));
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus({ loading: false, success: true, message: response.data?.data?.message || 'Handshake Accpeted.' });

        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (err: any) {
        setStatus({
          loading: false,
          success: false,
          message: err.response?.data?.error || 'Verification Failed: Origin Unknown.',
        });
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-obsidian-light border border-border p-8 text-center"
      >
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="font-heading text-3xl font-black text-offwhite uppercase tracking-tighter">
            Comms_Link<span className="text-electric">.</span>
          </h1>
          <p className="mt-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Network Confirmation Protocol
          </p>
        </div>

        {status.loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="w-8 h-8 border-2 border-border border-t-electric rounded-full animate-spin"></div>
            <p className="font-mono text-electric animate-pulse tracking-widest uppercase text-xs">
              {status.message}
            </p>
          </div>
        ) : (
          <div className="py-6">
            <p className={`font-mono text-sm uppercase tracking-widest mb-6 ${status.success ? 'text-electric' : 'text-red-500'}`}>
               {status.success ? 'SYS_OK: ' : 'CRITICAL: '} {status.message}
            </p>
            
            {status.success ? (
               <p className="font-mono text-zinc-500 text-[10px] uppercase tracking-widest animate-pulse">
                 Redirecting to gateway...
               </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                 <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                   Retry Signal
                 </Button>
                 <Link href="/" className="w-full sm:w-auto">
                   <Button variant="ghost" className="w-full border border-border text-zinc-400 hover:text-offwhite">
                     Abort Sequence
                   </Button>
                 </Link>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
