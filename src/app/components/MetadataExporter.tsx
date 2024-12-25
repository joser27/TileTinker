"use client";
import { saveAs } from "file-saver";
import { useState } from "react";


interface Frame {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Animation {
  name: string;
  frames: number[];
  fps: number;
}

interface SpriteMetadata {
  frames: Frame[];
  animations: Animation[];
  meta: {
    image: string;
    size: {
      width: number;
      height: number;
    };
    scale: number;
  };
}

interface MetadataExporterProps {
  imageSrc: string | null;
  columns: number;
  rows: number;
  scale: number;
  animationFrames: number[];
  animationSpeed: number;
  outputFilename: string;
}

interface ArrayFrame {
  x: number;
  y: number;
  width?: number;
  height?: number;
  w?: number;
  h?: number;
  filename?: string;
  name?: string;
}

type MetadataOutput = {
  // TexturePacker format
  frames: Record<string, TexturePackerFrame>;
  meta: {
    image: string;
    size: { w: number; h: number };
    scale?: string;
  };
} | {
  // JSON Array format
  frames: Array<ArrayFrame>;
  meta?: {
    image?: string;
    size?: { w: number; h: number };
  };
} | {
  // Aseprite format
  frames: Array<{
    filename: string;
    frame: { x: number; y: number; w: number; h: number };
    duration: number;
  }>;
  meta: {
    image: string;
    size: { w: number; h: number };
    frameTags: Array<{ name: string; from: number; to: number; direction: string }>;
  };
} | string | null;

type ExportFormat = 'TexturePacker' | 'JSON Array' | 'Aseprite';

interface TexturePackerFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export default function MetadataExporter({
  imageSrc,
  columns,
  rows,
  scale,
  animationFrames,
  animationSpeed,
  outputFilename,
}: MetadataExporterProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('JSON Array');

  const generateMetadata = (): SpriteMetadata | null => {
    if (!imageSrc) return null;

    const img = new Image();
    img.src = imageSrc;

    const spriteWidth = img.width / columns;
    const spriteHeight = img.height / rows;

    const frames = Array.from({ length: rows * columns }, (_, i) => ({
      id: i,
      x: (i % columns) * spriteWidth,
      y: Math.floor(i / columns) * spriteHeight,
      width: spriteWidth,
      height: spriteHeight
    }));

    const animations = [{
      name: "default",
      frames: animationFrames,
      fps: animationSpeed
    }];

    return {
      frames,
      animations,
      meta: {
        image: outputFilename + ".png",
        size: {
          width: img.width,
          height: img.height
        },
        scale: scale
      }
    };
  };

  const saveMetadata = async (format: ExportFormat = 'JSON Array') => {
    let data: MetadataOutput;
    let extension: string;
    
    const metadata = generateMetadata();
    if (!metadata) return;

    switch (format) {
      case 'TexturePacker':
        data = { frames: {}, meta: { image: metadata.meta.image, size: { w: metadata.meta.size.width, h: metadata.meta.size.height } } };
        extension = 'json';
        break;
      case 'Aseprite':
        data = { frames: [], meta: { image: metadata.meta.image, size: { w: metadata.meta.size.width, h: metadata.meta.size.height }, frameTags: [] } };
        extension = 'json';
        break;
      default: // JSON Array
        data = { frames: metadata.frames };
        extension = 'json';
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${outputFilename}.${extension}`);
  };

  return (
    <div className="flex gap-2">
      <select 
        value={selectedFormat}
        onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
        className="flex-1 p-2 border rounded bg-white text-black"
        disabled={!imageSrc}
      >
        <option value="JSON Array">JSON Array</option>
        <option value="TexturePacker">TexturePacker</option>
        <option value="Aseprite">Aseprite</option>
      </select>
      
      <button
        onClick={() => saveMetadata(selectedFormat)}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        disabled={!imageSrc}
      >
        Export
      </button>
    </div>
  );
} 