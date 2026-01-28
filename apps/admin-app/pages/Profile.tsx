
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await updateUser(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      dob: user?.dob || '',
      gender: user?.gender || '',
    });
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Header Banner */}
        <div className="absolute top-0 left-0 w-full h-32 bg-zepto-blue"></div>

        {/* Profile Avatar */}
        <div className="relative pt-16 flex flex-col items-center">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl">
            <div className="w-full h-full rounded-[2rem] bg-zepto-yellow text-zepto-blue flex items-center justify-center text-4xl font-black">
              {formData.name.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">{formData.name || user?.name}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{user?.role} Access</p>

          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 px-6 py-2 bg-zepto-blue text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
            <span className="material-symbols-outlined">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message.text}
          </div>
        )}

        {/* Profile Details */}
        <div className="mt-12 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Account Details</h3>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border-2 border-zepto-blue/20 focus:border-zepto-blue outline-none transition-all"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl font-black text-slate-900">{user?.name}</div>
              )}
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
              <div className="p-4 bg-slate-50 rounded-2xl font-black text-slate-900 flex items-center justify-between">
                {user?.email}
                <span className="text-[8px] bg-slate-200 px-2 py-0.5 rounded text-slate-500 uppercase">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="mt-8 flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-zepto-blue text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
