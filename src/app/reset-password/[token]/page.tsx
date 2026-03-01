'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import FormField from '@/components/FormField';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Invalid or missing token.');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });
      setMessage(response.data?.data?.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-obsidian border border-border p-8"
      >
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="font-heading text-3xl font-black text-offwhite uppercase tracking-tighter">
            System_Override<span className="text-electric">.</span>
          </h1>
          <p className="mt-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Authentication Module / Reset Cipher
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 border border-electric/50 bg-electric/10 text-electric font-mono text-xs uppercase tracking-widest">
            MSG: {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs uppercase tracking-widest">
            ERR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="New Passcode"
            name="password"
            type="password"
            placeholder="Enter new cipher"
            value={password}
            handleChange={(e) => setPassword(e.target.value)}
          />

          <FormField
            label="Confirm Passcode"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter cipher"
            value={confirmPassword}
            handleChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Reconfiguring...' : 'Execute Override'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
