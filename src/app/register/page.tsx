'use client';

import React, { useState } from 'react';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const Register = () => {
  const { register, loading, error } = useAuth();
  const router = useRouter();

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
    // Name validation
    if (!formData.name.trim() || formData.name.length < 2) {
      errors.name = 'Name is required (min 2 characters)';
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    // Password validation
    const password = formData.password;
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain an uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain a lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      errors.password = 'Password must contain a number';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.password = 'Password must contain a special character';
    }
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
      router.push('/'); // Redirect to login
    } else {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto mt-8 sm:mt-12 p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-800">Register</h2>
      {error && <p className="text-red-500 mb-4 text-center font-semibold">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <FormField
          label="Name"
          name="name"
          value={formData.name}
          handleChange={handleChange}
          placeholder="John Doe"
        />
        {formErrors.name && <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.name}</p>}
        <FormField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          handleChange={handleChange}
          placeholder="example@example.com"
        />
        {formErrors.email && <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.email}</p>}
        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          handleChange={handleChange}
          placeholder="Enter your password"
        />
        {formErrors.password && <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.password}</p>}
        <FormField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          handleChange={handleChange}
          placeholder="Confirm your password"
        />
        {formErrors.confirmPassword && <p className="text-red-500 text-sm -mt-4 mb-4">{formErrors.confirmPassword}</p>}
        <div className="flex justify-center">
          <Button
            type="submit"
            text={loading ? 'Registering...' : 'Register'}
            disabled={loading}
          />
        </div>
      </form>
      <div className="mt-4 sm:mt-6 text-center">
        <span className="text-gray-500">Already have an account? </span>
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          Login
        </Link>
      </div>
    </div>
  );
};

export default Register;
