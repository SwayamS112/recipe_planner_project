// frontend/src/components/Input.jsx
import React from "react";

export default function Input({ label, name, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full py-3 px-4 text-lg rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-food-200"
      />
    </div>
  );
}
