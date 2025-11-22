// src/components/PostItem.jsx
import React, { useState } from "react";
import api from "../utils/api";
import { toast } from "sonner";

export default function PostItem({ post, currentUser, onUpdated }) {
  // post example fields: {_id, title, content, isRemoved, user: {name, email}}
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  async function handleRemoveToggle() {
    if (!isAdmin) return toast.error("Not allowed");
    const remove = !post.isRemoved;
    if (!confirm(`${remove ? "Remove" : "Restore"} this post?`)) return;
    setLoading(true);
    try {
      await api.patch(`/admin/posts/${post._id}/remove`, { remove });
      toast.success(remove ? "Removed" : "Restored");
      onUpdated?.(); // tell parent to refresh
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Action failed");
    } finally { setLoading(false); }
  }

  async function handlePermanentDelete() {
    if (!isAdmin || currentUser.role !== "superadmin") return toast.error("Only superadmin can permanently delete");
    if (!confirm("Permanently delete this post? This cannot be undone.")) return;
    setLoading(true);
    try {
      await api.delete(`/admin/posts/${post._id}`);
      toast.success("Permanently deleted");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Delete failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-white rounded p-4 shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="text-lg font-semibold">{post.title}</div>
          <div className="text-sm text-gray-600">By: {post.user?.name || post.user?.email || "Unknown"}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* moderation controls appear only to admin and when parent wrapped with admin-mode check */}
          {isAdmin && (
            <>
              <button
                className="px-3 py-1 border rounded bg-amber-50 text-amber-700 disabled:opacity-50"
                onClick={handleRemoveToggle}
                disabled={loading}
              >
                {post.isRemoved ? "Restore" : "Remove"}
              </button>

              {currentUser?.role === "superadmin" && (
                <button
                  className="px-3 py-1 border rounded text-red-600 disabled:opacity-50"
                  onClick={handlePermanentDelete}
                  disabled={loading}
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-gray-700">{post.content?.slice(0, 400)}</p>

      {post.isRemoved && (
        <div className="mt-2 text-sm text-red-600">Removed by moderator</div>
      )}
    </div>
  );
}
