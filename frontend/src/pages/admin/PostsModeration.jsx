// src/pages/admin/PostsModeration.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import PostItem from "../../components/PostItem";
import { useAuth } from "../../utils/auth"; // your hook to get currentUser; adapt to your app
import { useAdminMode } from "../../contexts/AdminModeContext";
import { toast } from "sonner";

export default function PostsModeration() {
  const { currentUser } = useAuth(); // implement as per your project
  const { isAdminMode } = useAdminMode();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const canAccess = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  useEffect(() => {
    if (!canAccess) return setLoading(false);
    load();
    // eslint-disable-next-line
  }, [currentUser]);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get("/admin/posts");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  if (!canAccess) return <div className="p-6">You are not allowed to access moderation tools.</div>;
  if (!isAdminMode) return <div className="p-6">Turn ON admin mode to see moderation tools.</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Posts Moderation</h2>
      {loading ? <div>Loading...</div> :
        posts.length === 0 ? <div>No posts found</div> :
        <div className="grid gap-4">
          {posts.map(p => (
            <PostItem key={p._id} post={p} currentUser={currentUser} onUpdated={load} />
          ))}
        </div>
      }
    </div>
  );
}
