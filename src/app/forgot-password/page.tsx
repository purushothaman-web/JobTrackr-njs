'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import FormField from '@/components/FormField';
import { Button } from '@/components/Button';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(
        response.data?.data?.message ||
          'If an account exists, a link will be sent.'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-obsidian-light border border-border"
      >
        <div className="mb-10 border-b border-border pb-6">
          <h1 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            Recover<span className="text-electric">.</span>
          </h1>
          <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-4">
            Reset Access Credentials
          </p>
        </div>

        {message && (
          <div className="mb-6 p-3 border border-electric/50 bg-electric/10 text-electric font-mono text-xs text-center uppercase tracking-widest">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <FormField
              label="Account Email"
              type="email"
              name="email"
              value={email}
              handleChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
            />
          </div>

          <div className="pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Transmitting...' : 'Link Request'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
