import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, RefreshCw, Edit2, Shield, X, Check, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config/api';

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Edit state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', role: '', is_active: true, password: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '' // Only send if changed
    });
  };

  const handleSave = async () => {
    if (!editingUser || !token) return;
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      
      await axios.put(`${API_URL}/users/${editingUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ir-page">
      <div className="ir-container space-y-6">
        {/* Header */}
        <div className="ir-header-card flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30">
              <Users size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                User & Role Management
              </h2>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Manage railway medical officers, engineers, lab analysts, and control access permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search officers..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ir-input"
                style={{ paddingLeft: 36, width: 220 }}
              />
            </div>
            <button 
              onClick={fetchUsers} 
              className="ir-btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="ir-card overflow-hidden">
          {loading ? (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
              Loading authorized user accounts...
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Officer Name</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-xs font-bold" style={{ color: '#0284c7' }}>{u.employee_id}</td>
                      <td className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                      <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                          background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <Shield size={10} /> {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 800,
                          background: u.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.is_active ? '#10b981' : '#ef4444',
                        }}>
                          {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="ir-btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                        No user accounts found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 450,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Edit User: {editingUser.employee_id}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input 
                  type="text" value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={labelStyle}>Email</label>
                <input 
                  type="email" value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={labelStyle}>Role</label>
                <select 
                  value={editForm.role}
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                  style={inputStyle}
                >
                  <option value="CENTRAL_ADMIN">Central Admin</option>
                  <option value="ZONAL_ADMIN">Zonal Admin</option>
                  <option value="DIVISIONAL_OFFICER">Divisional Officer</option>
                  <option value="HMI">H&MI</option>
                  <option value="LABORATORY">Laboratory</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="STATION_INCHARGE">Station Incharge</option>
                  <option value="SENIOR_MANAGEMENT">Senior Management</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Reset Password (leave blank to keep current)</label>
                <input 
                  type="text" value={editForm.password} 
                  placeholder="New password..."
                  onChange={e => setEditForm({...editForm, password: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input 
                  type="checkbox" 
                  id="isActiveToggle"
                  checked={editForm.is_active}
                  onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                />
                <label htmlFor="isActiveToggle" style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                  Account Active
                </label>
              </div>
            </div>

            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setEditingUser(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{ 
                  padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', 
                  fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Check size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13,
  outline: 'none', boxSizing: 'border-box' as const
};
