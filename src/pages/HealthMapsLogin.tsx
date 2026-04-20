import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';
import toast from 'react-hot-toast';

const HealthMapsLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useHealthMapsAuth();
  const navigate = useNavigate();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailPattern.test(email.trim())) {
      toast.error('Enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      toast.error('Password is required.');
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await login(email.trim(), password);
      
      if (success) {
        toast.success('Login successful');
        navigate('/auth-redirect');
      } else {
        toast.error(error || 'Login failed');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0f14] text-[#e8edf5]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <section className="hidden w-1/2 flex-col justify-center border-r border-[#1f2d3d] bg-[#131820] px-12 lg:flex">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-[#00c9a7]">Health Maps</p>
          <h1 className="font-['Syne',sans-serif] text-5xl leading-tight">
            Golf club map tile operations in one place.
          </h1>
          <p className="mt-6 max-w-md text-[#8fa3bf]">
            Admins assign clubs and upload map tiles; clients view their assigned club details securely.
          </p>
        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
          <div className="w-full max-w-md rounded-xl border border-[#1f2d3d] bg-[#131820] p-8 shadow-2xl">
            <h2 className="font-['Syne',sans-serif] text-3xl">Sign in</h2>
            <p className="mt-2 text-sm text-[#8fa3bf]">
              Access your admin or client dashboard.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-[#8fa3bf]">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-[#8fa3bf]">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-[#00c9a7] px-4 py-2 font-medium text-[#0c0f14] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="mt-6 text-sm text-[#8fa3bf]">
              Need an account?{' '}
              <Link to="/register" className="text-[#00c9a7] hover:underline">
                Register
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HealthMapsLogin;
