'use client';

import React, { useState } from 'react';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const Login = () => {
  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });

  if (loading) {
    return <Loading fullHeight message="Checking session..." />;
  }

  if (user) {
    router.replace('/jobs');
    return null; // Don't render login form if already logged in
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
    <div className="w-full max-w-sm sm:max-w-md mx-auto mt-8 sm:mt-12 p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-800">Login</h2>
      {error && <p className="text-red-500 mb-4 text-center font-semibold">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <FormField
          label="Username / Email"
          type="text"
          name="login"
          value={formData.login}
          handleChange={handleChange}
          placeholder="Username or Email"
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          handleChange={handleChange}
          placeholder="Enter your password"
        />
        <div className="flex justify-center">
          <Button
            type="submit"
            text={loading ? 'Logging in...' : 'Login'}
            disabled={loading}
          />
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:underline text-sm"
          >
            Forgot Password?
          </Link>
        </div>
      </form>
      <div className="mt-4 sm:mt-6 text-center">
        <span className="text-gray-500">If you don&apos;t have an account, </span>
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          register
        </Link>
      </div>
    </div>
  );
};

export default Login;
