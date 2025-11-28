// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";

import { setAuthToken } from "./services/api";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import AddRecipe from "./pages/AddRecipe.jsx";
import ItemListPage from "./pages/ItemListPage.jsx";
import SocialBrowser from "./pages/SocialBrowser.jsx";
import EditRecipe from "./pages/EditRecipe.jsx";

import AdminRoute from "./components/AdminRoute.jsx";
import AdminPanel from "./pages/admin/AdminPanel.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false); // mobile menu toggle

  useEffect(() => {
  const savedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (token) {
    setAuthToken(token);
  } else {
    setAuthToken(null);
  }

  if (savedUser && token) {
    setUser(JSON.parse(savedUser));
  }
}, []);

const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  setAuthToken(null);
  setUser(null);
  setOpen(false);
};


  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        {user && (
          <nav className="bg-white shadow sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              {/* Left: Logo */}
              <div className="flex items-center gap-4">
                <NavLink to="/social" className="text-2xl font-serif font-semibold text-amber-700">
                  RecipePlanner
                </NavLink>
                {/* Desktop links (hidden on mobile) */}
                <div className="hidden md:flex gap-4 items-center">
                  <NavLink to="/dashboard/profile" className="text-sm hover:text-amber-700">
                    Dashboard
                  </NavLink>
                  <NavLink to="/add" className="text-sm hover:text-amber-700">
                    Add Recipe
                  </NavLink>
                  <NavLink to="/items" className="text-sm hover:text-amber-700">
                    Item List
                  </NavLink>
                  <NavLink to="/social" className="text-sm hover:text-amber-700">
                    Social
                  </NavLink>
                </div>
              </div>

              {/* Right: desktop avatar + actions */}
              <div className="hidden md:flex items-center gap-3">
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <NavLink
                    to="/admin"
                    className="ml-2 bg-purple-600 text-white px-3 py-1 rounded-lg shadow-sm text-sm"
                  >
                    Admin Panel
                  </NavLink>
                )}

                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover border border-amber-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-600" />
                  )}

                  <span className="font-medium text-sm">{user.name || user.email}</span>

                  <button
                    onClick={handleLogout}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Mobile: Hamburger */}
              <div className="md:hidden">
                <button
                  onClick={() => setOpen(!open)}
                  aria-expanded={open}
                  aria-label="Toggle menu"
                  className="p-2 rounded-md text-2xl text-amber-700 focus:outline-none"
                >
                  {open ? "✕" : "☰"}
                </button>
              </div>
            </div>

            {/* Mobile dropdown */}
            <div
              className={`md:hidden overflow-hidden bg-white border-t transition-max-height duration-300 ${
                open ? "max-h-96" : "max-h-0"
              }`}
            >
              <div className="flex flex-col gap-3 p-4">
                <NavLink
                  to="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="py-2 px-2 rounded hover:bg-amber-50"
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/add"
                  onClick={() => setOpen(false)}
                  className="py-2 px-2 rounded hover:bg-amber-50"
                >
                  Add Recipe
                </NavLink>

                <NavLink
                  to="/items"
                  onClick={() => setOpen(false)}
                  className="py-2 px-2 rounded hover:bg-amber-50"
                >
                  Item List
                </NavLink>

                <NavLink
                  to="/social"
                  onClick={() => setOpen(false)}
                  className="py-2 px-2 rounded hover:bg-amber-50"
                >
                  Social Feed
                </NavLink>

                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <NavLink
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="py-2 px-2 rounded bg-purple-600 text-white"
                  >
                    Admin Panel
                  </NavLink>
                )}

                <div className="border-t pt-3 flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover border border-amber-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600" />
                  )}

                  <div className="flex-1">
                    <div className="text-sm font-medium">{user.name || user.email}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-5xl mx-auto p-4">
          <Routes>
            <Route
              path="/"
              element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/social" />}
            />

            {/* Auth */}
            <Route
              path="/login"
              element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/social" />}
            />
            <Route
              path="/signup"
              element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/social" />}
            />

            {/* User Dashboard */}
            <Route
              path="/dashboard/*"
              element={user ? <Dashboard setUser={setUser} /> : <Navigate to="/" />}
            />

            {/* Normal User Routes */}
            <Route path="/add" element={user ? <AddRecipe /> : <Navigate to="/" />} />
            <Route path="/items" element={user ? <ItemListPage /> : <Navigate to="/" />} />
            <Route path="/social" element={user ? <SocialBrowser /> : <Navigate to="/" />} />
            <Route
              path="/recipes/:id/edit"
              element={user ? <EditRecipe /> : <Navigate to="/" />}
            />

            {/* ADMIN ROUTE */}
            <Route
              path="/admin"
              element={
                <AdminRoute user={user}>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? "/social" : "/"} />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
