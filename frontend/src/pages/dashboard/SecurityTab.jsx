// src/pages/dashboard/SecurityTab.jsx
import React, { useState } from "react";
import api from "../../utils/api";
import { toast } from "sonner";

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Fill both fields");
      return;
    }
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleChange} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm text-slate-700">Current password</label>
        <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="input" required />
      </div>
      <div>
        <label className="block text-sm text-slate-700">New password</label>
        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="input text-black" required />
      </div>
      <div>
        <button type="submit" disabled={loading} className="btn text-center py-2 px-2 bg-food-500 text-black rounded-lg shadow">
          {loading ? 'Saving...' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
