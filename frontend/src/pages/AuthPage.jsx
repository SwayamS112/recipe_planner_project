// frontend/src/pages/AuthPage.jsx
import api, { setAuthToken } from "../services/api";
import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";

export default function AuthPage({ setUser }) {
  const [tab, setTab] = useState("login"); // 'login' or 'signup'
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setAvatarFile(f || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "login") {
  const res = await api.post("/auth/login", { email: form.email, password: form.password });
  const { token, user } = res.data;
  // persist and set auth header
  setAuthToken(token);
  localStorage.setItem('user', JSON.stringify(user));
  setUser?.(user);
  toast.success("Welcome back!");
  navigate("/"); 
      } else {
        const payload = new FormData();
  payload.append("name", form.name);
  payload.append("email", form.email);
  payload.append("password", form.password);
  if (avatarFile) payload.append("avatar", avatarFile);

  const res = await api.post("/auth/register", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const { token, user } = res.data;
  setAuthToken(token);
  localStorage.setItem('user', JSON.stringify(user));
  setUser?.(user);
  toast.success("Account created — welcome!");
  navigate("/"); 
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center px-6 py-12">
      <Toaster position="top-right" />
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left hero */}
        <div className="hidden md:flex flex-col gap-6 px-6">
          <img src="/assets/logo.jpg" alt="logo" className="w-20 h-20 rounded-full shadow-lg object-cover" />
          <h1 className="text-4xl font-display font-semibold text-food-700 leading-tight">Cook. Share. Taste.</h1>
          <p className="text-lg text-slate-600 max-w-md">
            Discover and save recipes, build your flavor profile, and share dishes with the community.
          </p>
          <div className="mt-4">
            <img src="/assets/auth-hero.jpg" alt="Delicious food" className="rounded-3xl shadow-xl object-cover w-full h-64" />
          </div>
        </div>

        {/* Auth card */}
        <div className="flex justify-center px-4">
          <div className="w-full max-w-lg bg-white/95 rounded-2xl shadow-2xl p-8">
            {/* Tabs */}
            <div className="flex items-center justify-start gap-3 mb-6">
              <button
                onClick={() => setTab("login")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  tab === "login" ? "bg-food-500 text-white shadow" : "text-slate-600 bg-food-50"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setTab("signup")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  tab === "signup" ? "bg-food-500 text-white shadow" : "text-slate-600 bg-food-50"
                }`}
              >
                Sign up
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {tab === "login"
                ? "Sign in to access your saved recipes and favorites."
                : "Join the community — upload recipes, follow cooks and save favorites."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "signup" && (
                <Input
                  label="Full name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Your name"
                />
              )}

              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="At least 6 characters"
              />

              {tab === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Avatar (optional)</label>
                  <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" loading={loading} className="w-full">
                  {tab === "login" ? "Sign in" : "Create account"}
                </Button>
              </div>
            </form>

           
          </div>
        </div>
      </div>
    </div>
  );
}
