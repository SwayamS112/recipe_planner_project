// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import AddRecipe from './pages/AddRecipe.jsx';
import ItemListPage from './pages/ItemListPage.jsx';
import SocialBrowser from './pages/SocialBrowser.jsx';
import EditRecipe from './pages/EditRecipe.jsx';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) setUser(JSON.parse(savedUser));
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        {user && (
          <nav className="p-4 bg-white shadow">
            <div className="max-w-4xl mx-auto flex gap-4 items-center">
              <NavLink to="/social" className="font-bold text-lg">RecipePlanner</NavLink>
              <NavLink to="/dashboard/profile" className="hover:text-green-500 transition-colors">Dashboard</NavLink>
              <NavLink to="/add" className="hover:text-green-500 transition-colors">Add Recipe</NavLink>
              <NavLink to="/items" className="hover:text-green-500 transition-colors">Item List</NavLink>
              <NavLink to="/social" className="hover:text-green-500 transition-colors">Social</NavLink>

              <div className="ml-auto flex items-center gap-2">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black"></div>
                )}
                <span className="font-medium">{user.name || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-4xl mx-auto p-4">
          <Routes>
            <Route path="/" element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/social" />} />
            <Route path="/login" element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/social" />} />
            <Route path="/signup" element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/social" />} />

            {/* Dashboard with nested routes */}
            <Route path="/dashboard/*" element={user ? <Dashboard setUser={setUser} /> : <Navigate to="/" />} />

            <Route path="/add" element={user ? <AddRecipe /> : <Navigate to="/" />} />
            <Route path="/items" element={user ? <ItemListPage /> : <Navigate to="/" />} />
            <Route path="/social" element={user ? <SocialBrowser /> : <Navigate to="/" />} />
            <Route path="/recipes/:id/edit" element={user ? <EditRecipe /> : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to={user ? "/social" : "/"} />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
