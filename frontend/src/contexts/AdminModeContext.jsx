// src/contexts/AdminModeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AdminModeContext = createContext();

export function AdminModeProvider({ children }) {
  const [isAdminMode, setIsAdminMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem("isAdminMode") || "false"); } catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem("isAdminMode", JSON.stringify(isAdminMode));
  }, [isAdminMode]);

  return (
    <AdminModeContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  return useContext(AdminModeContext);
}
