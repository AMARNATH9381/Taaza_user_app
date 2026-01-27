
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

  // Fetch users from API on component mount
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

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

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

  const sendNotification = (user: User) => {
    alert(`Custom notification sent to ${user.name} via ${user.mobile}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zepto-blue"></div>
        <span className="ml-4 text-slate-600 font-medium">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-rose-500 mb-4">error</span>
        <p className="text-rose-600 font-bold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Network</h1>
          <p className="text-slate-500 text-sm font-medium">Tracking {users.length} registered customers</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border-2 border-slate-100 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">mail</span>
            Bulk Broadcast
          </button>
          <button className="bg-zepto-blue text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Export List
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-zepto-blue/5 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {['All', 'Active', 'Blocked'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border-2 transition-all ${statusFilter === status ? 'bg-zepto-blue border-zepto-blue text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-6">Customer Profile</th>
                <th className="px-8 py-6">Contact</th>
                <th className="px-8 py-6">Joined On</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                    <p className="font-bold">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setSelectedUser(user)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-zepto-blue/5 text-zepto-blue flex items-center justify-center font-black text-sm border border-zepto-blue/10">
                          {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-zepto-blue transition-colors">{user.name || 'No Name'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-600">{user.email}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{user.mobile}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-600">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-3 hover:bg-slate-100 rounded-2xl text-slate-300 hover:text-zepto-blue transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110]" onClick={() => setSelectedUser(null)}></div>
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[120] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Overview</h2>
              <button className="p-3 hover:bg-slate-100 rounded-full transition-colors" onClick={() => setSelectedUser(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 space-y-10">
              <div className="text-center space-y-4">
                <div className="w-28 h-28 rounded-[2rem] bg-zepto-blue/5 border-4 border-white shadow-2xl shadow-slate-200 mx-auto flex items-center justify-center text-4xl font-black text-zepto-blue">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedUser.name || 'No Name'}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Joined on {formatDate(selectedUser.created_at)}</p>
                </div>
                <div className="flex justify-center gap-3">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${selectedUser.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</p>
                  <p className="text-sm font-bold text-slate-900">{selectedUser.email}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mobile</p>
                  <p className="text-sm font-bold text-slate-900">{selectedUser.mobile}</p>
                </div>
                {selectedUser.gender && (
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gender</p>
                    <p className="text-sm font-bold text-slate-900">{selectedUser.gender}</p>
                  </div>
                )}
                {selectedUser.dob && (
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of Birth</p>
                    <p className="text-sm font-bold text-slate-900">{formatDate(selectedUser.dob)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Administrative Actions</h4>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => sendNotification(selectedUser)}
                    className="w-full flex items-center gap-4 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xs text-slate-700 hover:bg-zepto-blue hover:text-white transition-all group"
                  >
                    <span className="material-symbols-outlined text-zepto-blue group-hover:text-white">send</span>
                    Send Custom Push Message
                  </button>
                  <button
                    onClick={() => toggleUserStatus(selectedUser.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all border ${selectedUser.status === 'Active'
                        ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                      }`}
                  >
                    <span className="material-symbols-outlined">{selectedUser.status === 'Active' ? 'block' : 'undo'}</span>
                    {selectedUser.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Data logged as of today</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Users;
