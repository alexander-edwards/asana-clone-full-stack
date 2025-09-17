import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [quickLogin, setQuickLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const onSubmit = async (data) => {
    console.log('Submitting login with:', data);
    const result = await login(data.email, data.password);
    console.log('Login result:', result);
    if (result.success) {
      toast.success('Welcome back!');
      // Navigate to dashboard
      navigate('/');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  // Quick login for testing
  const handleQuickLogin = () => {
    setValue('email', 'demo@asanaclone.com');
    setValue('password', 'Demo123456');
    setQuickLogin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-asana-purple via-asana-coral to-asana-yellow flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-asana-gray-700 mb-2">
            Welcome back
          </h1>
          <p className="text-asana-gray-500">
            Log in to your Asana account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-asana-gray-600 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-asana-gray-400" />
              </div>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-asana-gray-600 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-asana-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                className="input pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FiEyeOff className="text-asana-gray-400" />
                ) : (
                  <FiEye className="text-asana-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-asana-coral focus:ring-asana-coral"
              />
              <span className="ml-2 text-sm text-asana-gray-600">
                Remember me
              </span>
            </label>
            <a href="#" className="text-sm text-asana-coral hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 text-lg font-semibold"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>

          {/* Quick Login Button for Testing */}
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full btn btn-secondary py-2 text-sm"
          >
            🚀 Quick Demo Login
          </button>
          {quickLogin && (
            <p className="text-xs text-center text-asana-gray-500">
              Using demo credentials - click Log in
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-asana-gray-500">
              New to Asana?
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-asana-coral hover:underline font-medium"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
