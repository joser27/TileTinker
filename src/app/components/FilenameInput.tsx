"use client";

interface FilenameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function FilenameInput({ 
  value, 
  onChange, 
  placeholder = "spritesheet",
  className = ""
}: FilenameInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium mb-1">Output Filename:</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded text-black"
        placeholder={placeholder}
      />
    </div>
  );
} 