'use client';

import React, { useState } from 'react';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Login = () => {
  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="font-mono text-electric animate-pulse tracking-widest uppercase">Checking Auth_</div>
      </div>
    );
  }

  if (user) {
    router.replace('/jobs');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(formData);
    if (result) {
      toast.success('Login successful!');
      router.push('/jobs');
    } else {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8 bg-obsidian-light border border-border"
      >
        <div className="mb-10 text-center">
          <h2 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            Access<span className="text-electric">.</span>
          </h2>
          <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-4">
            Authorized Personnel Only
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Username / Email"
            type="text"
            name="login"
            value={formData.login}
            handleChange={handleChange}
            placeholder="system@trackr.dev"
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            handleChange={handleChange}
            placeholder="••••••••"
          />
          
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Authenticating...' : 'Enter System'}
            </Button>
          </div>

          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-border font-mono text-xs tracking-widest uppercase text-center">
            <Link
              href="/forgot-password"
              className="text-zinc-500 hover:text-electric transition-colors"
            >
              Reset Protocol?
            </Link>
            <div className="text-zinc-600">
              No access?{' '}
              <Link href="/register" className="text-offwhite hover:text-electric transition-colors underline decoration-border underline-offset-4">
                Request Entry
              </Link>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
