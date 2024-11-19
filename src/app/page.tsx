"use client";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [columns, setColumns] = useState<number>(1);
  const [rows, setRows] = useState<number>(1);
  const [scale, setScale] = useState<number>(1); // Default scale
  const [antialiasing, setAntialiasing] = useState<boolean>(false); // Default: Off
  const [animationFrames, setAnimationFrames] = useState<number[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState<number>(5); // Frames per second
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnimationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const frames = input
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
    setAnimationFrames(frames);
  };

  const handleAnimationSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(Number(event.target.value));
  };

  useEffect(() => {
    if (!imageSrc || animationFrames.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = imageSrc;

    let frameIndex = 0;
    let animationInterval: number;

    const drawFrame = () => {
      const spriteWidth = image.width / columns;
      const spriteHeight = image.height / rows;

      const frame = animationFrames[frameIndex];
      const col = frame % columns;
      const row = Math.floor(frame / columns);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        col * spriteWidth, // Source X
        row * spriteHeight, // Source Y
        spriteWidth, // Source Width
        spriteHeight, // Source Height
        0, // Destination X
        0, // Destination Y
        canvas.width, // Destination Width
        canvas.height // Destination Height
      );

      frameIndex = (frameIndex + 1) % animationFrames.length;
    };

    image.onload = () => {
      canvas.width = image.width / columns;
      canvas.height = image.height / rows;

      clearInterval(animationInterval);
      animationInterval = window.setInterval(drawFrame, 1000 / animationSpeed);
    };

    return () => clearInterval(animationInterval);
  }, [imageSrc, columns, rows, animationFrames, animationSpeed]);
  

  return (
    <div className="flex flex-row items-start space-x-4 p-6">
      {/* Left Section: Inputs */}
      <div className="flex flex-col items-start space-y-4 w-1/4">
        <h1 className="text-4xl font-bold">Sprite Animation Viewer</h1>

        {/* Upload Input */}
        <div>
          <label className="block mb-2">Upload Sprite Sheet:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="p-2 border rounded"
          />
        </div>

        {/* Grid Settings */}
        <div className="flex space-x-4">
          <div>
            <label>Columns:</label>
            <input
              type="number"
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              className="p-2 border rounded w-20 text-black"
            />
          </div>
          <div>
            <label>Rows:</label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="p-2 border rounded w-20 text-black"
            />
          </div>
        </div>

        {/* Scale Control */}
        <div>
          <label>Scale Preview (1x, 2x, etc.):</label>
          <input
            type="number"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="p-2 border rounded w-20 text-black"
          />
        </div>

        {/* Antialiasing Toggle */}
        <div className="flex items-center space-x-2">
          <label>Antialiasing:</label>
          <input
            type="checkbox"
            checked={antialiasing}
            onChange={(e) => setAntialiasing(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
        </div>

        {/* Animation Settings */}
        <div>
          <label>Animation Frames (comma-separated):</label>
          <input
            type="text"
            onChange={handleAnimationInput}
            placeholder="e.g., 4,5,6,7"
            className="p-2 border rounded w-full text-black"
          />
        </div>
        <div>
          <label>Animation Speed (FPS):</label>
          <input
            type="number"
            value={animationSpeed}
            onChange={handleAnimationSpeedChange}
            className="p-2 border rounded w-20 text-black"
          />
        </div>
      </div>

      {/* Middle Section: Image Grid Preview */}
      {imageSrc && (
        <div
          className="relative w-1/2 bg-gray-200 overflow-hidden"
          style={{
            transform: `scale(${scale})`, // Apply scaling
            transformOrigin: "top left", // Ensure scaling starts from top-left corner
          }}
        >
          <div className="relative w-full">
            <img
              src={imageSrc}
              alt="Uploaded Sprite Sheet"
              className="w-full h-auto block"
              style={{
                display: "block",
                imageRendering: antialiasing ? "auto" : "pixelated", // Toggle antialiasing
              }}
            />
            <div
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              {/* Horizontal Grid Lines */}
              {Array.from({ length: rows - 1 }).map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="absolute left-0 border-t border-dashed border-red-500"
                  style={{
                    width: "100%",
                    top: `${((rowIndex + 1) / rows) * 100}%`,
                  }}
                />
              ))}

              {/* Vertical Grid Lines */}
              {Array.from({ length: columns - 1 }).map((_, colIndex) => (
                <div
                  key={`col-${colIndex}`}
                  className="absolute top-0 border-l border-dashed border-red-500"
                  style={{
                    height: "100%",
                    left: `${((colIndex + 1) / columns) * 100}%`,
                  }}
                />
              ))}

              {/* Tile Numbers */}
              {Array.from({ length: rows }).map((_, rowIndex) =>
                Array.from({ length: columns }).map((_, colIndex) => {
                  const tileIndex = rowIndex * columns + colIndex; // Calculate tile index
                  return (
                    <div
                      key={`tile-${tileIndex}`}
                      className="absolute text-xs font-bold text-red-600 bg-white bg-opacity-75 rounded px-1"
                      style={{
                        top: `${(rowIndex + 0.5) / rows * 100}%`, // Center vertically
                        left: `${(colIndex + 0.5) / columns * 100}%`, // Center horizontally
                        transform: "translate(-50%, -50%)", // Fully center the number
                      }}
                    >
                      {tileIndex}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right Section: Animation Preview */}
      <div className="w-1/4">
        <h2 className="text-2xl font-bold mb-4">Animation Preview</h2>
        <canvas ref={canvasRef} className="border w-full" />
      </div>
    </div>
  );
}
