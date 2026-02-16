import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormFieldProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, type = "text", name, value, handleChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-[#1E293B] font-semibold mb-2">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required
          className="w-full px-3 py-2 border border-[#64748B] rounded-md shadow-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          rows={4}
        />
      ) : (
        <div className="relative">
          <input
            type={inputType}
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            required
            className="w-full px-3 py-2 border border-[#64748B] rounded-md shadow-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] pr-10"
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormField;
