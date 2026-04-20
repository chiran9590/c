import React, { useState, useEffect } from 'react';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';
import { clubsService, Club } from '../services/clubsService';
import toast from 'react-hot-toast';

const HealthMapsClientDashboard: React.FC = () => {
  const { user, profile, signOut } = useHealthMapsAuth();
  const [assignedClub, setAssignedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { club, error } = await clubsService.getUserAssignedClub(user.id);
        if (error) {
          toast.error(error);
        } else {
          setAssignedClub(club);
        }
      } catch {
        toast.error('Failed to fetch your assigned golf club.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0f14] text-[#e8edf5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#00c9a7]"></div>
          <p className="mt-3 text-[#8fa3bf]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0f14] text-[#e8edf5]">
      <header className="border-b border-[#1f2d3d] bg-[#131820]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="font-['Syne',sans-serif] text-3xl">Client Dashboard</h1>
            <p className="text-sm text-[#8fa3bf]">Health Maps</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg bg-[#ff4d6d] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-3">
        <section className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6 md:col-span-2">
          <h2 className="text-xl font-semibold">Assigned Golf Club</h2>
          {assignedClub ? (
            <div>
              <p className="mt-4 text-2xl font-semibold text-[#00c9a7]">{assignedClub.club_name}</p>
              <p className="mt-2 text-sm text-[#8fa3bf]">Slug: {assignedClub.slug}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-[#1f2d3d] bg-[#1a2230] p-4 text-[#8fa3bf]">
              Contact your administrator. No golf club is assigned to your account yet.
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
          <h2 className="text-xl font-semibold">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-[#8fa3bf]">Name</dt>
              <dd>{profile?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-[#8fa3bf]">Email</dt>
              <dd>{profile?.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-[#8fa3bf]">Phone</dt>
              <dd>{profile?.phone_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-[#8fa3bf]">Role</dt>
              <dd>
                <span className="rounded-full bg-[#00c9a7]/15 px-2 py-1 text-xs text-[#00c9a7]">client</span>
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
};

export default HealthMapsClientDashboard;
