"use client"
import React, { useState, useRef } from "react";
import JSZip from "jszip"; 
import { saveAs } from "file-saver"; 

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [columns, setColumns] = useState<number>(1);
  const [rows, setRows] = useState<number>(1);
  const [imageName, setImageName] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageName(file.name.split(".")[0]); // Save the file name without extension
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleColumnsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColumns(Number(event.target.value) || 1);
  };

  const handleRowsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRows(Number(event.target.value) || 1);
  };

  const handleSaveCuts = async () => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const zip = new JSZip(); // Initialize a new zip archive
    const image = new Image();
    image.src = imageSrc;

    image.onload = async () => {
      const spriteWidth = image.width / columns;
      const spriteHeight = image.height / rows;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          canvas.width = spriteWidth;
          canvas.height = spriteHeight;

          // Draw the specific slice on the canvas
          ctx.drawImage(
            image,
            col * spriteWidth, // Source X
            row * spriteHeight, // Source Y
            spriteWidth, // Source Width
            spriteHeight, // Source Height
            0, // Destination X
            0, // Destination Y
            spriteWidth, // Destination Width
            spriteHeight // Destination Height
          );

          // Convert canvas slice to a data URL
          const dataURL = canvas.toDataURL("image/png");
          const base64Data = dataURL.split(",")[1];

          // Add the slice to the zip archive
          zip.file(`${imageName}-row${row + 1}-col${col + 1}.png`, base64Data, {
            base64: true,
          });
        }
      }

      // Generate the zip and trigger the download
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${imageName}-slices.zip`);
    };
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-4 min-h-screen bg-gray-100 p-6">
      {/* Left Side: Controls */}
      <div className="flex flex-col items-start space-y-4 md:w-2/5">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Sprite Cutter Tool</h1>
        
        {/* Upload Input */}
        <div>
          <label className="block mb-2 text-gray-800">Upload Sprite Sheet:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="p-2 border rounded-lg"
          />
          {imageName && (
            <p className="mt-2 text-green-800 text-sm">
              Uploaded File: <span className="font-medium">{imageName}</span>
            </p>
          )}
        </div>

        {/* Input for Columns and Rows */}
        <div className="flex space-x-4">
          <div>
            <label className="block text-gray-900">Columns:</label>
            <input
              type="number"
              value={columns}
              onChange={handleColumnsChange}
              className="p-2 border rounded-lg w-20 text-gray-900"
              min="1"
            />
          </div>
          <div>
            <label className="block text-gray-900">Rows:</label>
            <input
              type="number"
              value={rows}
              onChange={handleRowsChange}
              className="p-2 border rounded-lg w-20 text-gray-900"
              min="1"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveCuts}
          className="mt-4 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600"
          disabled={!imageSrc}
        >
          Save Cuts as Zip
        </button>
      </div>

      {/* Right Side: Display Uploaded Image */}
      {imageSrc && (
        <div className="relative">
          <img
            src={imageSrc}
            alt="Uploaded Sprite Sheet"
            className="block"
          />
      <div className="absolute top-0 left-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
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

        {/* Add Tile Labels */}
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: columns }).map((_, colIndex) => {
            const tileIndex = rowIndex * columns + colIndex; // Calculate the tile index
            return (
              <div
                key={`label-${tileIndex}`}
                className="absolute text-xs font-bold text-black bg-white bg-opacity-75 rounded px-1"
                style={{
                  top: `${(rowIndex / rows) * 100}%`,
                  left: `${(colIndex / columns) * 100}%`,
                  transform: "translate(-50%, -50%)", // Center the label in the tile
                }}
              >
                {tileIndex}
              </div>
            );
          })
        )}
      </div>

        </div>
      )}

      {/* Off-screen Canvas for Cutting */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
