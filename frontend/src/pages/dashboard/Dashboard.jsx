// src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import AdminToggle from "../../components/AdminToggle";
import { useAdminMode } from "../../contexts/AdminModeContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

/**
 * Dashboard with three tabs:
 * - Profile (edit avatar/name/email/phone)
 * - My Recipes (list + edit/delete for owner)
 * - Security (change password)
 *
 * If the logged user is admin or superadmin, a button to go to /admin is visible
 * and AdminMode toggle is shown to switch admin UI on/off.
 */

export default function Dashboard() {
  const [tab, setTab] = useState("profile"); // profile | recipes | security
  const [currentUser, setCurrentUser] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdminMode } = useAdminMode(); // read admin-mode (safe when provider is present)

  // profile form state
  const [form, setForm] = useState({ name: "", email: "", phone: "", avatarFile: null, avatarPreview: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // get user
      let me = null;
      try {
        const meRes = await api.get("/auth/me");
        me = meRes.data;
        setCurrentUser(me);
        setForm((f) => ({ ...f, name: me.name || "", email: me.email || "", phone: me.phone || "", avatarPreview: me.avatar || "" }));
      } catch (err) {
        // not logged in or token invalid
        console.warn("not logged in", err);
        setCurrentUser(null);
      }

      // my recipes
      try {
        const mine = await api.get("/recipes/mine");
        setMyRecipes(mine.data || []);
      } catch (e) {
        setMyRecipes([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  // profile avatar file change
  function onAvatarChange(e) {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, avatarFile: file, avatarPreview: file ? URL.createObjectURL(file) : f.avatarPreview }));
  }

  async function saveProfile() {
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone || "");
      if (form.avatarFile) fd.append("avatar", form.avatarFile);

      const res = await api.put("/auth/me", fd, { headers: { "Content-Type": "multipart/form-data" }});
      setCurrentUser(res.data.user);
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecipe(id) {
    if (!confirm("Delete recipe?")) return;
    try {
      await api.delete(`/recipes/${id}`);
      setMyRecipes((prev) => prev.filter((r) => r._id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Account</h1>

        <div className="flex items-center gap-4">
          {/* Admin Mode toggle visible only to admins */}
          {currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
            <>
              <AdminToggle />
              <Link to="/admin" className="px-3 py-1 bg-rose-600 text-white rounded">Admin Panel</Link>
              <div className="text-sm text-gray-600">Role: {currentUser.role}</div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left nav */}
        <div className="col-span-1 bg-white rounded shadow p-4">
          <div className="text-center mb-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-xl">
              {currentUser?.avatar ? <img src={currentUser.avatar} className="w-20 h-20 rounded-full object-cover" alt="avatar" /> : (currentUser?.name?.[0] || "U")}
            </div>
            <div className="mt-2 font-medium">{currentUser?.name || currentUser?.email}</div>
          </div>

          <nav className="space-y-2">
            <button onClick={() => setTab("profile")} className={`w-full text-left px-3 py-2 rounded ${tab === "profile" ? "bg-amber-50" : ""}`}>Profile</button>
            <button onClick={() => setTab("recipes")} className={`w-full text-left px-3 py-2 rounded ${tab === "recipes" ? "bg-amber-50" : ""}`}>My Recipes</button>
            <button onClick={() => setTab("security")} className={`w-full text-left px-3 py-2 rounded ${tab === "security" ? "bg-amber-50" : ""}`}>Security</button>
          </nav>
        </div>

        {/* Right content */}
        <div className="col-span-3 bg-white rounded shadow p-6">
          {tab === "profile" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Name</label>
                  <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border p-2 rounded mb-3" />

                  <label className="block text-sm font-medium">Email</label>
                  <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border p-2 rounded mb-3" />

                  <label className="block text-sm font-medium">Phone (10 digits)</label>
                  <input value={form.phone || ""} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border p-2 rounded mb-3" />

                  <button disabled={saving} onClick={saveProfile} className="mt-2 px-4 py-2 bg-amber-600 text-white rounded">Save profile</button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden mb-3">
                    {form.avatarPreview ? <img src={form.avatarPreview} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center">No</div>}
                  </div>
                  <input type="file" accept="image/*" onChange={onAvatarChange} />
                </div>
              </div>
            </div>
          )}

          {tab === "recipes" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Recipes</h2>
              {myRecipes.length === 0 ? <div>No recipes yet. <Link to="/add" className="text-orange-600">Add one</Link></div> : (
                <div className="grid gap-4">
                  {myRecipes.map(r => (
                    <div key={r._id} className="p-4 border rounded flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-sm text-gray-600">{r.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/recipes/${r._id}/edit`} className="px-3 py-1 border rounded">Edit</Link>

                        {/* If admin-mode is ON and user is admin, allow admin delete too (owner always can delete) */}
                        <button onClick={() => handleDeleteConfirm(r._id)} className="px-3 py-1 border rounded">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "security" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Security</h2>
              <SecurityForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // local functions
  function handleDeleteConfirm(id) {
    if (!confirm("Delete this recipe?")) return;
    handleDeleteRecipe(id);
  }

  async function handleDeleteRecipe(id) {
    try {
      await api.delete(`/recipes/${id}`);
      setMyRecipes(prev => prev.filter(r => r._id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }
}

// small security form component (change password)
function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (!currentPassword || !newPassword) return alert("Fill both fields");
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      alert("Password changed. Please login again.");
      // optionally: logout user
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Change failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <label className="block text-sm">Current password</label>
      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded mb-3" />
      <label className="block text-sm">New password</label>
      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border rounded mb-3" />
      <button disabled={loading} onClick={handleChange} className="px-4 py-2 bg-amber-600 text-white rounded">Change password</button>
    </div>
  );
}
