import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';
import toast from 'react-hot-toast';

const HealthMapsRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useHealthMapsAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\d{7,15}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone_number.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      toast.error('All fields are required.');
      return;
    }

    if (!emailPattern.test(formData.email.trim())) {
      toast.error('Enter a valid email address.');
      return;
    }

    if (!phonePattern.test(formData.phone_number.trim())) {
      toast.error('Phone number must be 7 to 15 digits.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Confirm password must match.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password
      });
      
      if (success) {
        toast.success('Registration successful');
        navigate('/dashboard');
      } else {
        toast.error(error || 'Registration failed');
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
            Register as a client and get assigned by admin.
          </h1>
          <p className="mt-6 max-w-md text-[#8fa3bf]">
            Your dashboard appears immediately after signup. Club assignment is handled by administrator.
          </p>
        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
          <div className="w-full max-w-md rounded-xl border border-[#1f2d3d] bg-[#131820] p-8 shadow-2xl">
            <h2 className="font-['Syne',sans-serif] text-3xl">Create account</h2>
            <p className="mt-2 text-sm text-[#8fa3bf]">Client registration</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="mb-1 block text-sm text-[#8fa3bf]">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-[#8fa3bf]">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phone_number" className="mb-1 block text-sm text-[#8fa3bf]">Phone Number</label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="Digits only"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-[#8fa3bf]">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm text-[#8fa3bf]">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-[#e8edf5] outline-none ring-[#00c9a7] placeholder:text-[#4d6278] focus:ring-2"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-[#00c9a7] px-4 py-2 font-medium text-[#0c0f14] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <p className="mt-6 text-sm text-[#8fa3bf]">
              Already registered?{' '}
              <Link to="/login" className="text-[#00c9a7] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HealthMapsRegister;
