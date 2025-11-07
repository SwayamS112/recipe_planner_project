// frontend/src/pages/dashboard/ProfileTab.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { toast } from "sonner";

export default function ProfileTab({ setUser }) {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatarPreview: null,
    avatarFile: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone ? String(u.phone) : "",
          avatarPreview: u.avatar || null,
          avatarFile: null,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function handlePhoneChange(v) {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    setForm(prev => ({ ...prev, phone: digits }));
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (f) {
      setForm(prev => ({ ...prev, avatarFile: f, avatarPreview: URL.createObjectURL(f) }));
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      if (form.phone) fd.append("phone", form.phone);
      if (form.avatarFile) fd.append("avatar", form.avatarFile);

      const res = await api.put("/auth/me", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Profile updated");
      const updatedUser = res.data.user;
      // update localStorage and parent user
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (setUser) setUser(updatedUser);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading profile...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Name</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />

          <label className="block text-sm font-medium mt-3">Email</label>
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" />

          <label className="block text-sm font-medium mt-3">Phone (10 digits)</label>
          <input value={form.phone} onChange={e => handlePhoneChange(e.target.value)} className="input" placeholder="9876543210" />
        </div>

        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-2">
            {form.avatarPreview ? <img src={form.avatarPreview} className="w-full h-full object-cover" alt="avatar" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No avatar</div>}
          </div>
          <input type="file" accept="image/*" onChange={handleFile} />
        </div>
      </div>

      <div className="pt-4 border-t">
        <button disabled={saving} className="btn bg-orange-500 text-white">{saving ? 'Saving...' : 'Save profile'}</button>
      </div>
    </form>
  );
}
