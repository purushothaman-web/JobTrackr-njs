import React from "react";

interface ButtonProps {
  text: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ text, onClick, type = "button", disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-[#3B82F6] 
        hover:bg-[#2563EB] 
        text-white 
        font-semibold 
        py-2 
        px-5 
        rounded-md 
        focus:outline-none 
        focus:ring-2 
        focus:ring-[#3B82F6] 
        focus:ring-offset-2 
        transition 
        duration-200 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        disabled:hover:bg-[#3B82F6]
      `}
    >
      {text}
    </button>
  );
};

export default Button;
