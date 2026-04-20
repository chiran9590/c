import React, { useState, useEffect } from 'react';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';
import { healthMapsAuthService, Profile } from '../services/healthMapsAuthService';
import { clubsService, Club, ClubAssignment } from '../services/clubsService';
import { uploadService, UploadRecord } from '../services/uploadService';
import toast from 'react-hot-toast';

type AdminSection = 'placeholder' | 'users' | 'clubs' | 'uploads';

const HealthMapsAdminDashboard: React.FC = () => {
  const { profile, signOut } = useHealthMapsAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('placeholder');
  const [users, setUsers] = useState<Profile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [assignments, setAssignments] = useState<ClubAssignment[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [uploadClubId, setUploadClubId] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0, clubs: 0, uploads: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeSection === 'users') fetchUsers();
    if (activeSection === 'clubs') Promise.all([fetchUsers(), fetchClubs(), fetchAssignments()]);
    if (activeSection === 'uploads') Promise.all([fetchClubs(), fetchUploads()]);
  }, [activeSection]);

  const toSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const loadStats = async () => {
    const [usersResult, clubsResult, uploadsResult] = await Promise.all([
      healthMapsAuthService.getAllUsers(),
      clubsService.getAllClubs(),
      uploadService.getRecentUploads(200)
    ]);

    setStats({
      users: usersResult.users?.length ?? 0,
      clubs: clubsResult.clubs?.length ?? 0,
      uploads: uploadsResult.uploads?.length ?? 0
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { users: allUsers, error } = await healthMapsAuthService.getAllUsers();
      if (error) {
        toast.error(error);
      } else {
        setUsers(allUsers || []);
      }
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const { clubs: allClubs, error } = await clubsService.getAllClubs();
      if (error) {
        toast.error(error);
      } else {
        setClubs(allClubs || []);
      }
    } catch {
      toast.error('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { assignments: allAssignments, error } = await clubsService.getAssignments();
      if (error) {
        toast.error(error);
      } else {
        setAssignments(allAssignments || []);
      }
    } catch {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const { uploads: recentUploads, error } = await uploadService.getRecentUploads(20);
      if (error) {
        toast.error(error);
      } else {
        setUploads(recentUploads || []);
      }
    } catch {
      toast.error('Failed to fetch uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) {
      toast.error('Club name is required.');
      return;
    }

    const slug = toSlug(newClubName);
    if (!slug) {
      toast.error('Invalid club name.');
      return;
    }

    try {
      const { error } = await clubsService.createClub({
        club_name: newClubName.trim(),
        slug
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success('Golf club created');
        setNewClubName('');
        await Promise.all([fetchClubs(), loadStats()]);
      }
    } catch {
      toast.error('Failed to create club');
    }
  };

  const handleAssignUserToClub = async () => {
    if (!selectedClientId || !selectedClubId) {
      toast.error('Select both client and club.');
      return;
    }

    try {
      const { error } = await clubsService.assignUserToClub({
        user_id: selectedClientId,
        club_id: selectedClubId
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Client assigned to golf club');
        setSelectedClientId('');
        setSelectedClubId('');
        await fetchAssignments();
      }
    } catch {
      toast.error('Failed to assign user to club');
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const incoming = Array.from(files);
    const invalid = incoming.filter((f) => f.type !== 'image/png');
    const valid = incoming.filter((f) => f.type === 'image/png');

    if (invalid.length > 0) {
      toast.error('Only PNG files are allowed.');
    }

    if (valid.length > 0) {
      setQueuedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeQueuedFile = (index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!uploadClubId) {
      toast.error('Select a golf club before upload.');
      return;
    }

    if (queuedFiles.length === 0) {
      toast.error('Select at least one PNG file.');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      for (let i = 0; i < queuedFiles.length; i += 1) {
        const current = queuedFiles[i];
        const { success, error } = await uploadService.uploadPngTile(uploadClubId, current);
        if (!success) {
          toast.error(error || `Failed uploading ${current.name}`);
        }
        setUploadProgress(Math.round(((i + 1) / queuedFiles.length) * 100));
      }

      toast.success('Upload process complete');
      setQueuedFiles([]);
      await Promise.all([fetchUploads(), loadStats()]);
    } catch {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredUsers = users.filter((u) => {
    const needle = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle);
  });

  const sectionNav: { id: AdminSection; label: string }[] = [
    { id: 'placeholder', label: 'Section 1' },
    { id: 'users', label: 'User Management' },
    { id: 'clubs', label: 'Club Management' },
    { id: 'uploads', label: 'Upload Tiles' }
  ];

  return (
    <div className="min-h-screen bg-[#0c0f14] text-[#e8edf5]">
      <div className="flex min-h-screen">
        <aside className="w-60 border-r border-[#1f2d3d] bg-[#131820] p-4">
          <h1 className="font-['Syne',sans-serif] text-2xl">Health Maps</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-[#8fa3bf]">Admin</p>
          <nav className="mt-6 space-y-2">
            {sectionNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  activeSection === item.id ? 'bg-[#00c9a7]/20 text-[#00c9a7]' : 'text-[#8fa3bf] hover:bg-[#1a2230]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-lg border border-[#1f2d3d] bg-[#1a2230] p-3 text-sm">
            <p className="font-medium">{profile?.name}</p>
            <p className="text-[#8fa3bf]">{profile?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg bg-[#ff4d6d] px-3 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-[#1f2d3d] bg-[#131820] px-5 py-4">
            <div>
              <h2 className="font-['Syne',sans-serif] text-2xl">Admin Dashboard</h2>
              <p className="text-sm text-[#8fa3bf]">Golf club operations center</p>
            </div>
            <span className="rounded-full bg-[#f59e0b]/20 px-3 py-1 text-xs uppercase text-[#f59e0b]">admin</span>
          </header>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-4">
              <p className="text-sm text-[#8fa3bf]">Total users</p>
              <p className="mt-2 text-3xl font-semibold">{stats.users}</p>
            </div>
            <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-4">
              <p className="text-sm text-[#8fa3bf]">Golf clubs</p>
              <p className="mt-2 text-3xl font-semibold">{stats.clubs}</p>
            </div>
            <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-4">
              <p className="text-sm text-[#8fa3bf]">Tile uploads</p>
              <p className="mt-2 text-3xl font-semibold">{stats.uploads}</p>
            </div>
          </div>

          {activeSection === 'placeholder' && (
            <section className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
              <h3 className="text-xl font-semibold">Section 1</h3>
              <p className="mt-3 text-[#8fa3bf]">Coming Soon</p>
            </section>
          )}

          {activeSection === 'users' && (
            <section className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
              <h3 className="text-xl font-semibold">User Management</h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email"
                className="mt-4 w-full rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-sm text-[#e8edf5] outline-none placeholder:text-[#4d6278] focus:ring-2 focus:ring-[#00c9a7]"
              />
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#8fa3bf]">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Phone</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-[#1f2d3d] hover:bg-[#1a2230]">
                        <td className="py-2">{user.name}</td>
                        <td className="py-2">{user.email}</td>
                        <td className="py-2">{user.phone_number || '-'}</td>
                        <td className="py-2">
                          <span className={`rounded-full px-2 py-1 text-xs ${user.role === 'admin' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#00c9a7]/20 text-[#00c9a7]'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && <p className="mt-3 text-xs text-[#8fa3bf]">Loading...</p>}
            </section>
          )}

          {activeSection === 'clubs' && (
            <section className="space-y-6">
              <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
                <h3 className="text-xl font-semibold">Create Golf Club</h3>
                <form onSubmit={handleCreateClub} className="mt-4 grid gap-4 md:grid-cols-3">
                  <input
                    type="text"
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder="Club name"
                    className="rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-sm outline-none placeholder:text-[#4d6278] focus:ring-2 focus:ring-[#00c9a7]"
                  />
                  <div className="rounded-lg border border-dashed border-[#1f2d3d] bg-[#1a2230] px-3 py-2 text-sm text-[#8fa3bf]">
                    R2 folder preview: maptiles/{toSlug(newClubName) || 'club-slug'}/
                  </div>
                  <button type="submit" className="rounded-lg bg-[#00c9a7] px-4 py-2 font-medium text-[#0c0f14]">
                    Create
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
                <h3 className="text-xl font-semibold">Assign Client to Club</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-sm">
                    <option value="">Select client</option>
                    {users.filter((u) => u.role === 'client').map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <select value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)} className="rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-sm">
                    <option value="">Select club</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>{club.club_name}</option>
                    ))}
                  </select>
                  <button onClick={handleAssignUserToClub} className="rounded-lg bg-[#00c9a7] px-4 py-2 font-medium text-[#0c0f14]">
                    Assign
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
                <h3 className="text-xl font-semibold">Clubs</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#8fa3bf]">
                        <th className="py-2">Name</th>
                        <th className="py-2">Slug</th>
                        <th className="py-2">R2 Folder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubs.map((club) => (
                        <tr key={club.id} className="border-t border-[#1f2d3d] hover:bg-[#1a2230]">
                          <td className="py-2">{club.club_name}</td>
                          <td className="py-2">{club.slug}</td>
                          <td className="py-2">maptiles/{club.slug}/</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
                <h3 className="text-xl font-semibold">Assignments</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#8fa3bf]">
                        <th className="py-2">Client</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Club</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((item) => (
                        <tr key={item.id} className="border-t border-[#1f2d3d] hover:bg-[#1a2230]">
                          <td className="py-2">{item.users?.name || '-'}</td>
                          <td className="py-2">{item.users?.email || '-'}</td>
                          <td className="py-2">{item.clubs?.club_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && <p className="mt-2 text-xs text-[#8fa3bf]">Loading...</p>}
                </div>
              </div>
            </section>
          )}

          {activeSection === 'uploads' && (
            <section className="space-y-6">
              <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
                <h3 className="text-xl font-semibold">Upload PNG Tiles</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <select value={uploadClubId} onChange={(e) => setUploadClubId(e.target.value)} className="rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-sm">
                    <option value="">Select golf club</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>{club.club_name}</option>
                    ))}
                  </select>
                  <input
                    type="file"
                    accept="image/png"
                    multiple
                    onChange={(e) => addFiles(e.target.files)}
                    className="rounded-lg border border-[#1f2d3d] bg-[#0c0f14] px-3 py-2 text-sm"
                  />
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                  className="mt-4 rounded-lg border border-dashed border-[#1f2d3d] bg-[#1a2230] p-5 text-center text-sm text-[#8fa3bf]"
                >
                  Drag and drop PNG files here or use browse above.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {queuedFiles.map((file, index) => (
                    <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-[#1a2230] px-3 py-1 text-xs">
                      {file.name}
                      <button className="text-[#ff4d6d]" onClick={() => removeQueuedFile(index)}>x</button>
                    </span>
                  ))}
                </div>

                <div className="mt-4 h-2 w-full rounded-full bg-[#1a2230]">
                  <div className="h-2 rounded-full bg-[#00c9a7]" style={{ width: `${uploadProgress}%` }} />
                </div>

                <button onClick={handleUpload} className="mt-4 rounded-lg bg-[#00c9a7] px-4 py-2 font-medium text-[#0c0f14]">
                  Upload
                </button>
              </div>

              <div className="rounded-xl border border-[#1f2d3d] bg-[#131820] p-6">
                <h3 className="text-xl font-semibold">Recent Uploads</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#8fa3bf]">
                        <th className="py-2">File</th>
                        <th className="py-2">Club</th>
                        <th className="py-2">Key</th>
                        <th className="py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((item) => (
                        <tr key={item.id} className="border-t border-[#1f2d3d] hover:bg-[#1a2230]">
                          <td className="py-2">{item.file_name}</td>
                          <td className="py-2">{item.clubs?.club_name || '-'}</td>
                          <td className="py-2">{item.file_key}</td>
                          <td className="py-2">{new Date(item.uploaded_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && <p className="mt-2 text-xs text-[#8fa3bf]">Loading...</p>}
                  {!loading && uploads.length === 0 && <p className="mt-2 text-sm text-[#8fa3bf]">No uploads yet.</p>}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default HealthMapsAdminDashboard;
