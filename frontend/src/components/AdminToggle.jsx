// src/components/AdminToggle.jsx
import React from "react";
import { useAdminMode } from "../contexts/AdminModeContext";

export default function AdminToggle() {
  const { isAdminMode, setIsAdminMode } = useAdminMode();
  return (
    <button
      onClick={() => setIsAdminMode(!isAdminMode)}
      className={`px-3 py-1 rounded ${isAdminMode ? "bg-amber-600 text-white" : "border"}`}
      title="Toggle admin mode (UI only)"
    >
      {isAdminMode ? "Admin Mode: ON" : "Admin Mode: OFF"}
    </button>
  );
}
