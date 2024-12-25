"use client";
import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Navbar from '../components/Navbar'

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export default function AutoDetect() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [detectedFrames, setDetectedFrames] = useState<Frame[]>([]);
  const [animationFrames, setAnimationFrames] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [animationSpeed, setAnimationSpeed] = useState<number>(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [currentPreviewFrame, setCurrentPreviewFrame] = useState<number>(0);
  const [antialiasing, setAntialiasing] = useState<boolean>(false);
  const [saveAllFrames, setSaveAllFrames] = useState<boolean>(true);
  const [outputFilename, setOutputFilename] = useState<string>("auto_detected_frames");
  const [saveFormat, setSaveFormat] = useState<'individual' | 'spritesheet'>('individual');
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const [removeBackground, setRemoveBackground] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target) return;
        setImageSrc(e.target.result as string);
        detectFrames(e.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isPixelBackground = (imageData: ImageData, x: number, y: number, bgColor: number[]): boolean => {
    const index = (y * imageData.width + x) * 4;
    return (
      Math.abs(imageData.data[index] - bgColor[0]) <= 5 &&
      Math.abs(imageData.data[index + 1] - bgColor[1]) <= 5 &&
      Math.abs(imageData.data[index + 2] - bgColor[2]) <= 5
    );
  };

  const isEmptyRow = (imageData: ImageData, y: number, bgColor?: number[]): boolean => {
    for (let x = 0; x < imageData.width; x++) {
      const index = (y * imageData.width + x) * 4;
      const alpha = imageData.data[index + 3];
      
      if (removeBackground && bgColor) {
        if (!isPixelBackground(imageData, x, y, bgColor)) return false;
      } else {
        if (alpha > 0) return false;
      }
    }
    return true;
  };

  const detectFrames = (imgSrc: string) => {
    const img = new Image();
    img.src = imgSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const frames: Frame[] = [];

      // Get background color from top-left pixel
      const bgColor = removeBackground ? [
        imageData.data[0],
        imageData.data[1],
        imageData.data[2]
      ] : undefined;

      // Store the background color for later use
      setBackgroundColor(bgColor ? `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})` : null);

      // Process the entire image if background removal is enabled
      if (removeBackground && bgColor) {
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (
            Math.abs(imageData.data[i] - bgColor[0]) <= 5 &&
            Math.abs(imageData.data[i + 1] - bgColor[1]) <= 5 &&
            Math.abs(imageData.data[i + 2] - bgColor[2]) <= 5
          ) {
            imageData.data[i + 3] = 0; // Set alpha to 0
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setProcessedImageSrc(canvas.toDataURL());
      } else {
        setProcessedImageSrc(imgSrc);
      }

      // Logic to detect rows and columns with content
      const rowRanges: { start: number; end: number }[] = [];
      let startY = 0;
      let inSprite = false;

      for (let y = 0; y < img.height; y++) {
        const isEmpty = isEmptyRow(imageData, y, bgColor);

        if (!isEmpty && !inSprite) {
          startY = y;
          inSprite = true;
        } else if (isEmpty && inSprite) {
          rowRanges.push({ start: startY, end: y });
          inSprite = false;
        }
      }

      if (inSprite) {
        rowRanges.push({ start: startY, end: img.height });
      }

      rowRanges.forEach((rowRange) => {
        let startX = 0;
        inSprite = false;

        for (let x = 0; x < img.width; x++) {
          let isEmpty = true;

          for (let y = rowRange.start; y < rowRange.end; y++) {
            const index = (y * imageData.width + x) * 4;
            if (imageData.data[index + 3] > 0) {
              isEmpty = false;
              break;
            }
          }

          if (!isEmpty && !inSprite) {
            startX = x;
            inSprite = true;
          } else if (isEmpty && inSprite) {
            frames.push({
              x: startX,
              y: rowRange.start,
              width: x - startX,
              height: rowRange.end - rowRange.start,
              offsetX: 0,
              offsetY: 0
            });
            inSprite = false;
          }
        }

        if (inSprite) {
          frames.push({
            x: startX,
            y: rowRange.start,
            width: img.width - startX,
            height: rowRange.end - rowRange.start,
            offsetX: 0,
            offsetY: 0
          });
        }
      });

      setDetectedFrames(frames);
      setAnimationFrames(frames.map((_, index) => index)); // Default to all frames
    };
  };

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

  useEffect(() => {
    if (!processedImageSrc || animationFrames.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.imageRendering = antialiasing ? "auto" : "pixelated";
    ctx.imageSmoothingEnabled = antialiasing;

    const image = new Image();
    image.src = processedImageSrc;

    let frameIndex = 0;
    let animationInterval: number;

    const drawFrame = () => {
      const frame = detectedFrames[animationFrames[frameIndex]];
      if (!frame) return;

      // Calculate scale to maintain original size
      const scale = 1;  // Adjust this value if you want to change the size
      canvas.width = frame.width * scale;
      canvas.height = frame.height * scale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply scale if needed
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      
      ctx.drawImage(
        image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        frame.offsetX,
        frame.offsetY,
        frame.width,
        frame.height
      );

      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      setCurrentPreviewFrame(animationFrames[frameIndex]);
      frameIndex = (frameIndex + 1) % animationFrames.length;
    };

    image.onload = () => {
      const firstFrame = detectedFrames[0];
      if (firstFrame) {
        canvas.width = firstFrame.width;
        canvas.height = firstFrame.height;
      }

      clearInterval(animationInterval);
      animationInterval = window.setInterval(drawFrame, 1000 / animationSpeed);
    };

    return () => clearInterval(animationInterval);
  }, [processedImageSrc, detectedFrames, animationFrames, animationSpeed, antialiasing]);

  const saveSpriteSheet = () => {
    if (!processedImageSrc || !canvasRef.current || detectedFrames.length === 0) return;
    
    if (!saveAllFrames && animationFrames.length === 0) {
      alert("Please enter frame numbers to save in the Animation Frames input");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = processedImageSrc;

    image.onload = () => {
      const framesToProcess = saveAllFrames 
        ? Array.from({ length: detectedFrames.length }, (_, i) => i)
        : animationFrames;

      if (saveFormat === 'spritesheet') {
        // Create a new canvas for the combined sprite sheet
        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d');
        if (!newCtx) return;

        // Calculate total width and maximum height
        const totalWidth = framesToProcess.reduce((sum, frameIndex) => {
          const frame = detectedFrames[frameIndex];
          return sum + frame.width;
        }, 0);
        const maxHeight = Math.max(...framesToProcess.map(frameIndex => detectedFrames[frameIndex].height));

        newCanvas.width = totalWidth;
        newCanvas.height = maxHeight;

        // Draw each frame horizontally
        let currentX = 0;
        framesToProcess.forEach((frameIndex) => {
          const frame = detectedFrames[frameIndex];
          newCtx.drawImage(
            image,
            frame.x,
            frame.y,
            frame.width,
            frame.height,
            currentX + frame.offsetX,
            frame.offsetY,
            frame.width,
            frame.height
          );
          currentX += frame.width;
        });

        // Save the combined sprite sheet
        newCanvas.toBlob((blob) => {
          if (blob) {
            const filename = outputFilename.trim() || "auto_detected_frames";
            saveAs(blob, `${filename}.png`);
          }
        }, 'image/png');

      } else {
        // Original individual frames logic
        const zip = new JSZip();

        framesToProcess.forEach((frameIndex) => {
          const frame = detectedFrames[frameIndex];
          canvas.width = frame.width;
          canvas.height = frame.height;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            image,
            frame.x,
            frame.y,
            frame.width,
            frame.height,
            frame.offsetX,
            frame.offsetY,
            frame.width,
            frame.height
          );

          const frameDataUrl = canvas.toDataURL("image/png");
          zip.file(`frame_${frameIndex}.png`, frameDataUrl.split(",")[1], { base64: true });
        });

        zip.generateAsync({ type: "blob" }).then((blob) => {
          const filename = outputFilename.trim() || "auto_detected_frames";
          saveAs(blob, `${filename}.zip`);
        });
      }
    };
  };

  useEffect(() => {
    if (imageSrc) {
      detectFrames(imageSrc);
    }
  }, [removeBackground]);

  return (
    <>
      <Navbar />
      <div className="flex flex-row items-start space-x-4 p-6">
        {/* Left Section: Inputs */}
        <div className="flex flex-col items-start space-y-4 w-1/4 min-w-[300px]">
          <h1 className="text-4xl font-bold">Auto Frame Detection</h1>

          <div className="w-full">
            <label className="block mb-2">Upload Sprite Sheet:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="p-2 border rounded w-full"
            />
          </div>

          {imageSrc && (
            <>
              <div>
                <label className="block mb-2">Enter Frames to Preview:</label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleAnimationInput}
                  placeholder="e.g., 0-3,5,7"
                  className="p-2 border rounded w-full text-black"
                />
              </div>

              <div>
                <label className="block mb-2">Animation Speed (FPS):</label>
                <input
                  type="number"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  className="p-2 border rounded w-20 text-black"
                />
              </div>

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
                <label>Remove Background:</label>
                <input
                  type="checkbox"
                  checked={removeBackground}
                  onChange={(e) => setRemoveBackground(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </div>
              {backgroundColor && removeBackground && (
                <div className="text-sm">
                  Detected background color: 
                  <div 
                    className="inline-block w-4 h-4 ml-2 border"
                    style={{ backgroundColor: backgroundColor }}
                  />
                </div>
              )}

              {selectedFrame !== null && (
                <div className="w-full p-4 border rounded">
                  <h3 className="text-xl font-bold mb-2">Adjust Frame {selectedFrame}</h3>
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="mr-2">X offset:</label>
                      <input
                        type="number"
                        value={detectedFrames[selectedFrame].offsetX}
                        onChange={(e) => {
                          const newFrames = [...detectedFrames];
                          newFrames[selectedFrame] = {
                            ...newFrames[selectedFrame],
                            offsetX: parseInt(e.target.value) || 0
                          };
                          setDetectedFrames(newFrames);
                        }}
                        className="p-1 border rounded w-20 text-black"
                      />
                    </div>
                    <div>
                      <label className="mr-2">Y offset:</label>
                      <input
                        type="number"
                        value={detectedFrames[selectedFrame].offsetY}
                        onChange={(e) => {
                          const newFrames = [...detectedFrames];
                          newFrames[selectedFrame] = {
                            ...newFrames[selectedFrame],
                            offsetY: parseInt(e.target.value) || 0
                          };
                          setDetectedFrames(newFrames);
                        }}
                        className="p-1 border rounded w-20 text-black"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                    placeholder="auto_detected_frames"
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
              </div>
            </>
          )}
        </div>

        {/* Middle Section: Sprite Sheet Preview */}
        {processedImageSrc && (
          <div className="w-1/2">
            <div className="relative">
              <img
                src={processedImageSrc}
                alt="Uploaded Sprite Sheet"
                className="w-full h-auto"
                ref={imageRef}
              />
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {detectedFrames.map((frame, index) => {
                  const imageElement = imageRef.current;
                  if (!imageElement) return null;

                  const scaleX = imageElement.clientWidth / imageElement.naturalWidth;
                  const scaleY = imageElement.clientHeight / imageElement.naturalHeight;

                  return (
                    <div
                      key={index}
                      className={`absolute border border-dashed cursor-pointer pointer-events-auto
                        ${selectedFrame === index ? 'border-blue-500 border-2' : 'border-red-500'}`}
                      style={{
                        left: `${frame.x * scaleX}px`,
                        top: `${frame.y * scaleY}px`,
                        width: `${frame.width * scaleX}px`,
                        height: `${frame.height * scaleY}px`,
                      }}
                      onClick={() => setSelectedFrame(index)}
                    >
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 bg-white bg-opacity-75 px-1 text-xs text-red-600 font-bold"
                        style={{
                          transform: "translateY(-100%)",
                        }}
                      >
                        {index}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Section: Animation Preview */}
        {imageSrc && (
          <div className="w-1/4">
            <h2 className="text-2xl font-bold mb-4">Animation Preview</h2>
            <div className="relative">
              <canvas ref={canvasRef} className="border w-full" />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                Frame: {currentPreviewFrame}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
