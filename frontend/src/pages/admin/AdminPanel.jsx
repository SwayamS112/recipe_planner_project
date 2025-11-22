// frontend/src/pages/admin/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { toast } from "sonner";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      // use the admin endpoints your backend already provides
      const [uRes, pRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/posts"),
      ]);
      setUsers(uRes.data || []);
      setPosts(pRes.data || []);
    } catch (err) {
      console.error("AdminPanel load error:", err);
      toast.error(err.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlock(id, block) {
    try {
      await api.patch(`/admin/users/${id}/block`, { block });
      toast.success(block ? "Blocked" : "Unblocked");
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to change block status");
    }
  }

  async function changeRole(id, newRole) {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      toast.success("Role updated");
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to change role");
    }
  }

  async function removeOrRestorePost(id, remove) {
    try {
      await api.patch(`/admin/posts/${id}/remove`, { remove });
      toast.success(remove ? "Removed" : "Restored");
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update post");
    }
  }

  async function deletePostPermanent(id) {
    if (!confirm("Permanently delete this post?")) return;
    try {
      await api.delete(`/admin/posts/${id}`); // superadmin-only on backend
      toast.success("Deleted permanently");
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete post");
    }
  }

  if (loading) return <div className="p-6">Loading admin data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Users</h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u._id} className="p-3 bg-white rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{u.name || u.email}</div>
                <div className="text-sm text-gray-500">{u.email} • {u.role} • {u.isBlocked ? "Blocked" : "Active"}</div>
              </div>

              <div className="flex gap-2">
                {u.role !== "superadmin" && (
                  <>
                    <button
                      onClick={() => toggleBlock(u._id, !u.isBlocked)}
                      className="px-3 py-1 border rounded"
                    >
                      {u.isBlocked ? "Unblock" : "Block"}
                    </button>

                    {/* show promote/demote UI (actual permission check enforced on backend) */}
                    <button
                      onClick={() => changeRole(u._id, u.role === "admin" ? "user" : "admin")}
                      className="px-3 py-1 border rounded"
                    >
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Posts Moderation</h2>
        <div className="grid gap-3">
          {posts.map(p => (
            <div key={p._id} className="p-3 bg-white rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-gray-500">By: {p.user?.name || p.user?.email}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => removeOrRestorePost(p._id, !p.isRemoved)}
                    className="px-3 py-1 border rounded"
                  >
                    {p.isRemoved ? "Restore" : "Remove"}
                  </button>

                  <button
                    onClick={() => deletePostPermanent(p._id)}
                    className="px-3 py-1 border rounded text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-700">{p.description || p.content || ""}</p>
              {p.isRemoved && <div className="mt-2 text-sm text-red-600">Removed</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
