// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";

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

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        {user && (
          <nav className="p-4 bg-white shadow">
            <div className="max-w-5xl mx-auto flex gap-4 items-center">
              <NavLink to="/social" className="font-bold text-xl">
                RecipePlanner
              </NavLink>

              <NavLink to="/dashboard/profile" className="hover:text-green-600">
                Dashboard
              </NavLink>
              <NavLink to="/add" className="hover:text-green-600">
                Add Recipe
              </NavLink>
              <NavLink to="/items" className="hover:text-green-600">
                Item List
              </NavLink>
              <NavLink to="/social" className="hover:text-green-600">
                Social
              </NavLink>

              {/* ADMIN NAV BUTTON — Only for admins */}
              {user?.role === "admin" || user?.role === "superadmin" ? (
                <NavLink
                  to="/admin"
                  className="ml-6 bg-purple-600 text-white px-3 py-1 rounded"
                >
                  Admin Panel
                </NavLink>
              ) : null}

              <div className="ml-auto flex items-center gap-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600"></div>
                )}

                <span className="font-medium">{user.name || user.email}</span>

                <button
                  onClick={handleLogout}
                  className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Logout
                </button>
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
