'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

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
          'If an account with that email exists, you will receive a password reset link shortly.'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-2">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-[#1E293B]">Forgot Password</h1>

        {message && (
          <p role="alert" className="mb-4 text-center text-green-600 bg-green-100 p-2 sm:p-3 rounded-xl border border-green-300 font-semibold">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 text-center text-red-600 bg-red-100 p-2 sm:p-3 rounded-xl border border-red-300 font-semibold">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-50 shadow rounded-xl p-4 sm:p-6">
          <div className="mb-6 sm:mb-8">
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
