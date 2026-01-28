
import React, { useState, useMemo, useEffect } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  // User addresses state
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUsers();
        setUsers(data);
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch addresses when user is selected
  useEffect(() => {
    if (selectedUser) {
      setLoadingAddresses(true);
      fetch(`/api/admin/users/addresses?user_id=${selectedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUserAddresses(data);
          } else {
            setUserAddresses([]);
          }
          setLoadingAddresses(false);
        })
        .catch(err => {
          console.error('Error fetching addresses:', err);
          setUserAddresses([]);
          setLoadingAddresses(false);
        });
    } else {
      setUserAddresses([]);
    }
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [users, searchTerm, statusFilter, sortBy]);

  const toggleUserStatus = async (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    try {
      await userService.updateStatus(id, newStatus);
      setUsers(prev => prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, status: newStatus as 'Active' | 'Blocked' };
          if (selectedUser?.id === id) setSelectedUser(updated);
          return updated;
        }
        return u;
      }));
    } catch (err) {
      console.error('Failed to update user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUserAddresses(prev => prev.filter(a => a.id !== id));
        setDeleteConfirm(null);
      } else {
        alert('Failed to delete address');
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Error deleting address');
    }
  };


  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert('No users to export');
      return;
    }

    // CSV headers
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Gender', 'Status', 'Joined On'];

    // CSV rows
    const rows = filteredUsers.map(user => [
      user.id,
      user.name || 'N/A',
      user.email,
      user.mobile,
      user.gender || 'N/A',
      user.status,
      formatDate(user.created_at)
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taaza_customers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zepto-blue"></div>
        <span className="ml-3 text-slate-600 font-medium text-sm">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-rose-500 mb-2">error</span>
        <p className="text-rose-600 font-bold text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-xs hover:bg-rose-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Customer Network</h1>
          <p className="text-slate-500 text-xs font-medium">{filteredUsers.length} of {users.length} customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-zepto-blue/10 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 w-full md:w-auto">
            {['All', 'Active', 'Blocked'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${statusFilter === status ? 'bg-zepto-blue border-zepto-blue text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3">
                  <button onClick={() => setSortBy('name')} className="flex items-center gap-1 hover:text-zepto-blue transition-colors">
                    Customer
                    {sortBy === 'name' && <span className="material-symbols-outlined text-xs">arrow_downward</span>}
                  </button>
                </th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">
                  <button onClick={() => setSortBy('date')} className="flex items-center gap-1 hover:text-zepto-blue transition-colors">
                    Joined
                    {sortBy === 'date' && <span className="material-symbols-outlined text-xs">arrow_downward</span>}
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-1">person_off</span>
                    <p className="font-medium text-sm">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedUser(user)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zepto-blue/5 text-zepto-blue flex items-center justify-center font-bold text-xs border border-zepto-blue/10">
                          {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-zepto-blue transition-colors">{user.name || 'No Name'}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">#{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-600">{user.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{user.mobile}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 capitalize">{user.gender || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-zepto-blue transition-all">
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Overview Panel - Compact */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110]" onClick={() => setSelectedUser(null)}></div>
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-[120] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">User Details</h2>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelectedUser(null)}>
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-zepto-blue/10 border-2 border-white shadow flex items-center justify-center text-xl font-black text-zepto-blue">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900">{selectedUser.name || 'No Name'}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Joined {formatDate(selectedUser.created_at)}</p>
                </div>
                <span className={`text-[8px] font-bold px-2 py-1 rounded-md uppercase ${selectedUser.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {selectedUser.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Email</p>
                  <p className="text-xs font-medium text-slate-900 truncate">{selectedUser.email}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Mobile</p>
                  <p className="text-xs font-medium text-slate-900">{selectedUser.mobile}</p>
                </div>
                {selectedUser.gender && (
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Gender</p>
                    <p className="text-xs font-medium text-slate-900 capitalize">{selectedUser.gender}</p>
                  </div>
                )}
                {selectedUser.dob && (
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">DOB</p>
                    <p className="text-xs font-medium text-slate-900">{formatDate(selectedUser.dob)}</p>
                  </div>
                )}
              </div>

              {/* Saved Addresses */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Saved Addresses</p>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{userAddresses.length}</span>
                </div>
                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                  </div>
                ) : userAddresses.length === 0 ? (
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <span className="material-symbols-outlined text-slate-300 text-2xl mb-1">location_off</span>
                    <p className="text-xs text-slate-400">No addresses saved</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userAddresses.map((addr: any) => (
                      <div key={addr.id} className="bg-slate-50 p-3 rounded-xl">
                        <div className="flex items-start gap-2">
                          <span className={`material-symbols-outlined text-base ${addr.is_default ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {addr.tag === 'Home' ? 'home' : addr.tag === 'Work' ? 'work' : 'location_on'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-bold text-slate-800">{addr.tag}</p>
                              {addr.is_default && (
                                <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">DEFAULT</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-600 truncate">{addr.house_no}, {addr.full_address}</p>
                            <p className="text-[9px] text-slate-400 mt-1">{addr.receiver_name} • {addr.receiver_phone}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(addr.id); }}
                            className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-600 transition-colors self-start"
                            title="Delete Address"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Actions</p>
                <button
                  onClick={() => toggleUserStatus(selectedUser.id)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all ${selectedUser.status === 'Active'
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                >
                  <span className="material-symbols-outlined text-base">{selectedUser.status === 'Active' ? 'block' : 'check_circle'}</span>
                  {selectedUser.status === 'Active' ? 'Block User' : 'Activate User'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[130]" onClick={() => setDeleteConfirm(null)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-[140] w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-rose-600 text-2xl">delete</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Address?</h3>
              <p className="text-sm text-slate-600 mb-6">This action cannot be undone. The address will be permanently removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAddress(deleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Users;
