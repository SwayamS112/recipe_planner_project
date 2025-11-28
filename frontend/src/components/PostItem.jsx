// src/components/PostItem.jsx
import React, { useState } from "react";
import api from "../utils/api";
import { toast } from "sonner";

export default function PostItem({ post, currentUser, onUpdated }) {
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
      onUpdated?.();
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
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-800">{post.title}</div>
          <div className="text-sm text-gray-500">By: {post.user?.name || post.user?.email || "Unknown"}</div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                onClick={handleRemoveToggle}
                disabled={loading}
              >
                {post.isRemoved ? "Restore" : "Remove"}
              </button>

              {currentUser?.role === "superadmin" && (
                <button
                  className="px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-50"
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

      <p className="mt-3 text-slate-700">{post.content?.slice(0, 400)}</p>

      {post.isRemoved && (
        <div className="mt-3 text-sm text-red-600">Removed by moderator</div>
      )}
    </div>
  );
}
