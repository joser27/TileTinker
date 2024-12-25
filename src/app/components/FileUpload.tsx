"use client";
import { ChangeEvent } from 'react';

interface FileUploadProps {
  onImageUpload: (imageSrc: string | string[]) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
  label?: string;
}

export default function FileUpload({ 
  onImageUpload, 
  multiple = false,
  accept = "image/*", 
  className = "",
  label = "Upload Sprite Sheet:"
}: FileUploadProps) {
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (multiple) {
      Promise.all(
        files.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }))
      ).then(results => {
        onImageUpload(results);
      });
    } else {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!e.target?.result) return;
          onImageUpload(e.target.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block mb-2">{label}</label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleImageUpload}
        className="p-2 border rounded w-full"
      />
    </div>
  );
} 