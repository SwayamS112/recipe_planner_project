// src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import AdminToggle from "../../components/AdminToggle";
import { useAdminMode } from "../../contexts/AdminModeContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import ProfileTab from "./ProfileTab";
import MyRecipesTab from "./MyRecipesTab";
import SecurityTab from "./SecurityTab";

/**
 * Refreshed Dashboard layout:
 * - left nav with card & avatar
 * - right content area with soft rounded panels
 * - uses food-color accents (amber/orange/green)
 */

export default function Dashboard({ setUser }) {
  const [tab, setTab] = useState("profile"); // profile | recipes | security
  const [currentUser, setCurrentUser] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdminMode } = useAdminMode?.() || { isAdminMode: false };

  useEffect(() => {
    void loadData();
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
      } catch (err) {
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

  // delete handler forwarded to MyRecipesTab
  async function handleDeleteRecipe(id) {
    try {
      await api.delete(`/recipes/${id}`);
      setMyRecipes((prev) => prev.filter((r) => r._id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-food-700">Your Account</h1>
          <p className="text-sm text-slate-600 mt-1">Manage profile, your recipes and security settings.</p>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin") && (
            <>
              <AdminToggle />
              <Link to="/admin" className="px-3 py-1 bg-food-500 hover:bg-food-600 text-white rounded shadow">
                Admin Panel
              </Link>
              <div className="text-sm text-slate-600">Role: <span className="font-medium">{currentUser.role}</span></div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left nav card */}
        <aside className="col-span-1 bg-white rounded-2xl shadow-lg p-5">
          <div className="text-center mb-4">
            <div className="w-28 h-28 rounded-full mx-auto overflow-hidden ring-2 ring-food-100 shadow">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-50 flex items-center justify-center text-2xl font-bold text-food-700">
                  {currentUser?.name?.[0] || "U"}
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="text-lg font-medium text-slate-800">{currentUser?.name || currentUser?.email}</div>
              <div className="text-sm text-slate-500">{currentUser?.email}</div>
            </div>
          </div>

          <nav className="mt-4 space-y-2">
            <button
              onClick={() => setTab("profile")}
              className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${
                tab === "profile" ? "bg-food-50 ring-1 ring-food-200" : "hover:bg-slate-50"
              }`}
            >
              <span className="font-medium">Profile</span>
              <span className="ml-auto text-xs text-slate-400">Edit</span>
            </button>

            <button
              onClick={() => setTab("recipes")}
              className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${
                tab === "recipes" ? "bg-food-50 ring-1 ring-food-200" : "hover:bg-slate-50"
              }`}
            >
              <span className="font-medium">My Recipes</span>
              <span className="ml-auto text-xs text-slate-400">{myRecipes.length}</span>
            </button>

            <button
              onClick={() => setTab("security")}
              className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${
                tab === "security" ? "bg-food-50 ring-1 ring-food-200" : "hover:bg-slate-50"
              }`}
            >
              <span className="font-medium">Security</span>
              <span className="ml-auto text-xs text-slate-400">Password</span>
            </button>
          </nav>

          <div className="mt-6 border-t pt-4">
            <Link to="/add" className="block text-center py-2 bg-food-500 text-black rounded-lg shadow">
              Add Recipe
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <section className="col-span-3 bg-white rounded-2xl shadow-lg p-6">
          {tab === "profile" && (
            <ProfileTab setUser={(u) => { setUser?.(u); setCurrentUser(u); }} />
          )}

          {tab === "recipes" && (
            <MyRecipesTab
              recipes={myRecipes}
              onDelete={(id) => handleDeleteRecipe(id)}
            />
          )}

          {tab === "security" && <SecurityTab />}
        </section>
      </div>
    </div>
  );
}
