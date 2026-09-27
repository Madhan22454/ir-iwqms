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
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#f5f3ff', padding: 10, borderRadius: 12, border: '1px solid #ddd6fe' }}>
            <Users size={22} color="#6d28d9" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
              User & Role Management
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Manage system users, assign roles, and control access levels
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #e2e8f0',
                fontSize: 13, width: 220, outline: 'none'
              }}
            />
          </div>
          <button onClick={fetchUsers} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={thStyle}>Employee ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id} style={{
                    borderBottom: '1px solid #f8fafc',
                    background: idx % 2 === 0 ? 'white' : '#fafafa',
                  }}>
                    <td style={tdStyle}><strong>{u.employee_id}</strong></td>
                    <td style={tdStyle}>{u.name}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: '#e0e7ff', color: '#3730a3', display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        <Shield size={10} /> {u.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 800,
                        background: u.is_active ? '#f0fdf4' : '#fef2f2',
                        color: u.is_active ? '#16a34a' : '#dc2626',
                      }}>
                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => handleEditClick(u)}
                        style={{
                          background: 'white', border: '1px solid #e2e8f0', padding: '4px 8px', 
                          borderRadius: 6, color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 12, fontWeight: 600
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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

const thStyle = {
  padding: '12px 18px', textAlign: 'left' as const,
  fontSize: 11, fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' as const,
};

const tdStyle = {
  padding: '12px 18px', fontSize: 12.5, color: '#334155',
  whiteSpace: 'nowrap' as const,
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13,
  outline: 'none', boxSizing: 'border-box' as const
};
