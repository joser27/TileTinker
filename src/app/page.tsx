"use client";
import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Navbar from './components/Navbar'
import HelpGuide from './components/HelpGuide';
import MetadataExporter from './components/MetadataExporter';
import FileUpload from './components/FileUpload';

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [columns, setColumns] = useState<number>(1);
  const [rows, setRows] = useState<number>(1);
  const [scale, setScale] = useState<number>(1); // Default scale
  const [antialiasing, setAntialiasing] = useState<boolean>(false); // Default: Off
  const [animationFrames, setAnimationFrames] = useState<number[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState<number>(5); // Frames per second
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saveAllFrames, setSaveAllFrames] = useState<boolean>(true);
  const [outputFilename, setOutputFilename] = useState<string>("sprite_sheet_frames");
  const [inputValue, setInputValue] = useState<string>('');
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [showRowCol, setShowRowCol] = useState<boolean>(false);
  const [saveFormat, setSaveFormat] = useState<'individual' | 'spritesheet'>('individual');

  const handleAnimationInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setInputValue(input); // Store the raw input value

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout to process the input after 500ms of no typing
    debounceTimeout.current = setTimeout(() => {
      const frames: number[] = [];
      
      // Only process if there's input
      if (input.trim()) {
        // Split by comma and process each part
        input.split(',').forEach(part => {
          part = part.trim();
          if (part.includes('-')) {
            // Handle range (e.g., "4-8")
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                frames.push(i);
              }
            }
          } else {
            // Handle single number
            const num = parseInt(part, 10);
            if (!isNaN(num)) {
              frames.push(num);
            }
          }
        });
      }
      
      setAnimationFrames(frames);
    }, 500);
  };

  const handleAnimationSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(Number(event.target.value));
  };

  const saveSpriteSheet = () => {
    if (!imageSrc || !canvasRef.current) return;
    
    if (!saveAllFrames && animationFrames.length === 0) {
      alert("Please enter frame numbers to save in the Animation Frames input");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const spriteWidth = image.width / columns;
      const spriteHeight = image.height / rows;

      const framesToProcess = saveAllFrames 
        ? Array.from({ length: rows * columns }, (_, i) => i)
        : animationFrames;

      if (saveFormat === 'spritesheet') {
        // Create a new canvas for the combined sprite sheet
        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d');
        if (!newCtx) return;

        // Set the canvas size based on the number of frames
        newCanvas.width = spriteWidth * framesToProcess.length;
        newCanvas.height = spriteHeight;

        // Draw each frame horizontally
        framesToProcess.forEach((frameIndex, i) => {
          const row = Math.floor(frameIndex / columns);
          const col = frameIndex % columns;

          newCtx.drawImage(
            image,
            col * spriteWidth,
            row * spriteHeight,
            spriteWidth,
            spriteHeight,
            i * spriteWidth,
            0,
            spriteWidth,
            spriteHeight
          );
        });

        // Save the combined sprite sheet
        newCanvas.toBlob((blob) => {
          if (blob) {
            const filename = outputFilename.trim() || "sprite_sheet";
            saveAs(blob, `${filename}.png`);
          }
        }, 'image/png');

      } else {
        // Original individual frames logic
        const zip = new JSZip();

        framesToProcess.forEach((frameIndex) => {
          const row = Math.floor(frameIndex / columns);
          const col = frameIndex % columns;

          canvas.width = spriteWidth;
          canvas.height = spriteHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            image,
            col * spriteWidth,
            row * spriteHeight,
            spriteWidth,
            spriteHeight,
            0,
            0,
            spriteWidth,
            spriteHeight
          );

          const frameDataUrl = canvas.toDataURL("image/png");
          zip.file(`frame_${frameIndex}.png`, frameDataUrl.split(",")[1], { base64: true });
        });

        zip.generateAsync({ type: "blob" }).then((blob) => {
          const filename = outputFilename.trim() || "sprite_sheet_frames";
          saveAs(blob, `${filename}.zip`);
        });
      }
    };
  };

  useEffect(() => {
    if (!imageSrc || animationFrames.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.imageRendering = antialiasing ? "auto" : "pixelated";
    ctx.imageSmoothingEnabled = antialiasing;

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
  }, [imageSrc, columns, rows, animationFrames, animationSpeed, antialiasing]);
  

  // Add the help content
  const slicerHelp = {
    title: "How to Use Sprite Slicer",
    sections: [
      {
        title: "Basic Usage",
        content: [
          "Upload a sprite sheet using the file input",
          "Set the number of rows and columns to match your sheet",
          "Adjust the scale to better view small sprites",
          "Toggle grid and numbers for better visualization"
        ]
      },
      {
        title: "Animation",
        content: [
          "Enter frame numbers (e.g., '0-3' or '0,1,2,3')",
          "Adjust animation speed with FPS control",
          "Preview your animation in the right panel",
          "Toggle antialiasing for different rendering styles"
        ]
      },
      {
        title: "Saving",
        content: [
          "Choose between saving all frames or selected frames",
          "Select output format (individual frames or spritesheet)",
          "Set custom filename for the output",
          "Click Save to download your frames"
        ]
      }
    ]
  };

  return (
    <>
      <Navbar />
      <HelpGuide content={slicerHelp} />
      <div className="flex flex-row items-start space-x-4 p-6">
        {/* Left Section: Inputs */}
        <div className="flex flex-col items-start space-y-4 w-1/4 min-w-[300px]">
          <h1 className="text-4xl font-bold">Sprite Animation Viewer</h1>

          {/* Upload Input */}
          <FileUpload 
            onImageUpload={(src) => {
              if (typeof src === 'string') {
                setImageSrc(src);
              }
            }}
            multiple={false}
          />

          {imageSrc && (
            <>
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
                <label>Scale Preview (0.5x, 2x, etc.):</label>
                <input
                  type="number"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="p-2 border rounded w-20 text-black"
                />
              </div>

              {/* Display Controls */}
              <div className="flex items-center space-x-2">
                <label>Antialiasing:</label>
                <input
                  type="checkbox"
                  checked={antialiasing}
                  onChange={(e) => setAntialiasing(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label>Show Grid:</label>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label>Show Numbers:</label>
                <input
                  type="checkbox"
                  checked={showNumbers}
                  onChange={(e) => setShowNumbers(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label>Show Row/Col:</label>
                <input
                  type="checkbox"
                  checked={showRowCol}
                  onChange={(e) => setShowRowCol(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>

              {/* Animation Settings */}
              <div>
                <label>Animation Frames (comma-separated):</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleAnimationInput}
                  placeholder="e.g., 4-8 or 4,5,6,7,8"
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

              {/* Save Settings */}
              <div className="w-full pt-4 border-t">
                <div className="w-full">
                  <label className="block mb-2">Save Mode:</label>
                  <select 
                    value={saveAllFrames ? "all" : "selected"}
                    onChange={(e) => setSaveAllFrames(e.target.value === "all")}
                    className="p-2 border rounded text-black w-full"
                  >
                    <option value="all">All Frames</option>
                    <option value="selected">Selected Frames Only</option>
                  </select>
                </div>

                {/* Only show format selection for selected frames */}
                {!saveAllFrames && (
                  <div className="w-full mt-4">
                    <label className="block mb-2">Save Format:</label>
                    <select 
                      value={saveFormat}
                      onChange={(e) => setSaveFormat(e.target.value as 'individual' | 'spritesheet')}
                      className="p-2 border rounded text-black w-full"
                    >
                      <option value="individual">Individual Frames (ZIP)</option>
                      <option value="spritesheet">Combined Sprite Sheet</option>
                    </select>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block mb-2">Output Filename:</label>
                  <input
                    type="text"
                    value={outputFilename}
                    onChange={(e) => setOutputFilename(e.target.value)}
                    placeholder="sprite_sheet_frames"
                    className="p-2 border rounded w-full text-black"
                  />
                </div>

                {!saveAllFrames && (
                  <div className="text-sm text-gray-600 mt-2">
                    Use the &quot;Animation Frames&quot; input above to specify which frames to save
                  </div>
                )}

                <button
                  onClick={saveSpriteSheet}
                  className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                >
                  Save {saveAllFrames ? "All" : "Selected"} Frames
                  {!saveAllFrames && ` as ${saveFormat === 'individual' ? 'ZIP' : 'Sprite Sheet'}`}
                </button>
                
                <MetadataExporter
                  imageSrc={imageSrc}
                  columns={columns}
                  rows={rows}
                  scale={scale}
                  animationFrames={animationFrames}
                  animationSpeed={animationSpeed}
                  outputFilename={outputFilename}
                />
              </div>
            </>
          )}
        </div>

        {/* Middle Section: Image Grid Preview */}
        {imageSrc && (
          <div
            className="relative w-1/2 overflow-hidden"
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
                {showGrid && Array.from({ length: rows - 1 }).map((_, rowIndex) => (
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
                {showGrid && Array.from({ length: columns - 1 }).map((_, colIndex) => (
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
                {showNumbers && Array.from({ length: rows }).map((_, rowIndex) =>
                  Array.from({ length: columns }).map((_, colIndex) => {
                    const tileIndex = rowIndex * columns + colIndex;
                    return (
                      <div
                        key={`tile-${tileIndex}`}
                        className="absolute text-xs font-bold text-red-600 bg-white bg-opacity-75 rounded px-1"
                        style={{
                          top: `${rowIndex / rows * 100}%`,
                          left: `${(colIndex + 0.5) / columns * 100}%`,
                          transform: "translate(-50%, 2px)",
                        }}
                      >
                        <div className="text-center">
                          {showRowCol ? (
                            <>
                              <div>#{tileIndex}</div>
                              <div className="text-[10px]">R{rowIndex} C{colIndex}</div>
                            </>
                          ) : (
                            tileIndex
                          )}
                        </div>
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
    </>
  );
}
