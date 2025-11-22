import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/" />;

  if (user.role !== "admin" && user.role !== "superadmin") {
    return <Navigate to="/dashboard/profile" />;
  }

  return children;
}
