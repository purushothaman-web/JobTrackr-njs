import React from "react";

interface FormFieldProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, type = "text", name, value, handleChange, placeholder }) => {
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
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required
          className="w-full px-3 py-2 border border-[#64748B] rounded-md shadow-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        />
      )}
    </div>
  );
};

export default FormField;
