// frontend/src/pages/admin/UsersAdmin.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleBlock = async (id, block) => {
    try {
      await api.patch(`/admin/users/${id}/block`, { block });
      toast.success(block ? 'Blocked' : 'Unblocked');
      load();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      toast.success('Role updated');
      load();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div>Loading users...</div>;
  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Users</h2>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u._id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">{u.name || u.email}</div>
              <div className="text-sm text-gray-500">{u.email} • {u.role} • {u.isBlocked ? 'Blocked' : 'Active'}</div>
            </div>
            <div className="space-x-2">
              {u.role !== 'superadmin' && (
                <>
                  <button onClick={() => toggleBlock(u._id, !u.isBlocked)} className="px-3 py-1 border rounded">
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>

                  {/* only superadmin can change role; on client we don't show promote if current user is not superadmin */}
                  <button onClick={() => changeRole(u._id, u.role === 'admin' ? 'user' : 'admin')} className="px-3 py-1 border rounded">
                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
