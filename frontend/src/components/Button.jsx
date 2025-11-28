// frontend/src/components/Button.jsx
import React from "react";

export default function Button({ children, loading = false, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`py-3 px-5 text-lg font-semibold rounded-xl shadow-md transition transform hover:-translate-y-0.5 disabled:opacity-60 ${className}`}
      style={{ backgroundColor: "#ff7a2d", color: "white" }} // fallback inline to ensure food color shows
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
