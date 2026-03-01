import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="mb-6 group">
      <label htmlFor={name} className="block text-zinc-400 text-xs font-mono uppercase tracking-widest mb-1 transition-colors group-focus-within:text-electric">
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
          className="w-full bg-transparent border-0 border-b-2 border-border text-offwhite py-2 focus:ring-0 focus:border-electric transition-colors resize-y placeholder:text-zinc-600"
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
            className={cn(
              "w-full bg-transparent border-0 border-b-2 border-border text-offwhite py-2 focus:ring-0 focus:border-electric transition-colors placeholder:text-zinc-600",
              isPassword && "pr-10"
            )}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-electric transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormField;
