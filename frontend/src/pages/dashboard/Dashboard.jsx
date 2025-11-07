// frontend/src/pages/dashboard/Dashboard.jsx
import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import ProfileTab from "./ProfileTab";
import MyRecipesTab from "./MyRecipesTab";
import SecurityTab from "./SecurityTab";

export default function Dashboard({ setUser }) {
  const tabClass = ({ isActive }) =>
    `block w-full text-left px-3 py-2 rounded ${isActive ? 'bg-orange-100' : 'hover:bg-orange-50'}`;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4 grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 bg-white/60 backdrop-blur rounded-xl p-4 shadow">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-3 flex items-center justify-center text-2xl">U</div>
          <h3 className="font-semibold">Your Account</h3>
          <p className="text-sm text-gray-600">Manage profile & recipes</p>
        </div>

        <nav className="mt-6 space-y-2">
          <NavLink to="profile" className={tabClass}>Profile</NavLink>
          <NavLink to="recipes" className={tabClass}>My Recipes</NavLink>
          <NavLink to="security" className={tabClass}>Security</NavLink>
        </nav>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <div className="bg-white/60 backdrop-blur rounded-xl p-6 shadow min-h-[400px]">
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileTab setUser={setUser} />} />
            <Route path="recipes" element={<MyRecipesTab />} />
            <Route path="security" element={<SecurityTab />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
