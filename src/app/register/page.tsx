'use client';

import React, { useState } from 'react';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Register = () => {
  const { register, loading, error, user } = useAuth();
  const router = useRouter();

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      errors.name = 'Name is required (min 2 characters)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    const password = formData.password;
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) errors.password = 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) errors.password = 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password)) errors.password = 'Password must contain a number';
    if (!/[^A-Za-z0-9]/.test(password)) errors.password = 'Password must contain a special character';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const { name, email, password } = formData;
    const result = await register({ name, email, password });
    if (result) {
      toast.success('Registration successful! Please verify your email.');
      router.push('/');
    } else {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 bg-obsidian-light border border-border"
      >
        <div className="mb-10 text-center">
          <h2 className="font-heading text-4xl font-black text-offwhite tracking-tighter uppercase">
            Initialize<span className="text-electric">.</span>
          </h2>
          <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase mt-4">
            System Registration
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 font-mono text-xs text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <FormField
              label="Codename / Name"
              name="name"
              value={formData.name}
              handleChange={handleChange}
              placeholder="e.g. Neo"
            />
            {formErrors.name && <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <FormField
              label="Email Transmission"
              type="email"
              name="email"
              value={formData.email}
              handleChange={handleChange}
              placeholder="neo@matrix.dev"
            />
            {formErrors.email && <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <FormField
              label="Security Key"
              type="password"
              name="password"
              value={formData.password}
              handleChange={handleChange}
              placeholder="••••••••"
            />
            {formErrors.password && <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.password}</p>}
          </div>

          <div>
            <FormField
              label="Verify Key"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              handleChange={handleChange}
              placeholder="••••••••"
            />
            {formErrors.confirmPassword && <p className="text-red-500 font-mono text-[10px] uppercase tracking-wider mt-1">{formErrors.confirmPassword}</p>}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Initializing...' : 'Create Record'}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border font-mono text-xs tracking-widest uppercase text-center text-zinc-600">
          Existing Record?{' '}
          <Link href="/" className="text-offwhite hover:text-electric transition-colors underline decoration-border underline-offset-4">
            Authenticate
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
