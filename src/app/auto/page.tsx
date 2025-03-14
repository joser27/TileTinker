"use client";
import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Navbar from '../components/Navbar'
import HelpGuide from '../components/HelpGuide';
import FileUpload from '../components/FileUpload';
import FilenameInput from '../components/FilenameInput';

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
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null);
  const [mergingMode, setMergingMode] = useState<boolean>(false);
  const [framesToMerge, setFramesToMerge] = useState<number[]>([]);
  const [useManualColor, setUseManualColor] = useState<boolean>(false);
  const [manualColors, setManualColors] = useState<string[]>(['#000000']);
  const [scale, setScale] = useState<number>(1);


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

      // Get background colors
      let bgColors: number[][] = [];
      if (removeBackground) {
        if (useManualColor) {
          // Convert all hex colors to RGB
          bgColors = manualColors.map(color => {
            const r = parseInt(color.slice(1,3), 16);
            const g = parseInt(color.slice(3,5), 16);
            const b = parseInt(color.slice(5,7), 16);
            return [r, g, b];
          });
        } else {
          bgColors = [[
            imageData.data[0],
            imageData.data[1],
            imageData.data[2]
          ]];
        }
      }

      // Process the entire image if background removal is enabled
      if (removeBackground && bgColors.length > 0) {
        for (let i = 0; i < imageData.data.length; i += 4) {
          const isBackground = bgColors.some(bgColor => 
            Math.abs(imageData.data[i] - bgColor[0]) <= 5 &&
            Math.abs(imageData.data[i + 1] - bgColor[1]) <= 5 &&
            Math.abs(imageData.data[i + 2] - bgColor[2]) <= 5
          );
          
          if (isBackground) {
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
        const isEmpty = isEmptyRow(imageData, y, bgColors.length > 0 ? bgColors[0] : undefined);

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

  const handleFrameMerge = () => {
    if (framesToMerge.length < 2) return;
    
    // Calculate the new bounding box that encompasses all selected frames
    const selectedFrames = framesToMerge.map(index => detectedFrames[index]);
    const minX = Math.min(...selectedFrames.map(frame => frame.x));
    const minY = Math.min(...selectedFrames.map(frame => frame.y));
    const maxX = Math.max(...selectedFrames.map(frame => frame.x + frame.width));
    const maxY = Math.max(...selectedFrames.map(frame => frame.y + frame.height));

    // Create new merged frame
    const mergedFrame: Frame = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      offsetX: 0,
      offsetY: 0
    };

    // Create new frames array without the merged frames
    const newFrames = detectedFrames.filter((_, index) => !framesToMerge.includes(index));
    
    // Insert the merged frame at the position of the first selected frame
    const firstFrameIndex = Math.min(...framesToMerge);
    newFrames.splice(firstFrameIndex, 0, mergedFrame);

    // Update state
    setDetectedFrames(newFrames);
    setFramesToMerge([]);
    setMergingMode(false);
  };

  const handleFrameSplit = () => {
    if (selectedFrame === null) return;
    
    const frameToSplit = detectedFrames[selectedFrame];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !processedImageSrc) return;

    const image = new Image();
    image.src = processedImageSrc;

    image.onload = () => {
      // Create a canvas with just the selected frame
      canvas.width = frameToSplit.width;
      canvas.height = frameToSplit.height;
      ctx.drawImage(
        image,
        frameToSplit.x,
        frameToSplit.y,
        frameToSplit.width,
        frameToSplit.height,
        0,
        0,
        frameToSplit.width,
        frameToSplit.height
      );

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newFrames: Frame[] = [];

      // Logic to detect rows and columns with content
      const rowRanges: { start: number; end: number }[] = [];
      let startY = 0;
      let inSprite = false;

      // Detect rows
      for (let y = 0; y < canvas.height; y++) {
        const isEmpty = isEmptyRow(imageData, y, removeBackground ? [
          imageData.data[0],
          imageData.data[1],
          imageData.data[2]
        ] : undefined);

        if (!isEmpty && !inSprite) {
          startY = y;
          inSprite = true;
        } else if (isEmpty && inSprite) {
          rowRanges.push({ start: startY, end: y });
          inSprite = false;
        }
      }

      if (inSprite) {
        rowRanges.push({ start: startY, end: canvas.height });
      }

      // Detect sprites within each row
      rowRanges.forEach((rowRange) => {
        let startX = 0;
        inSprite = false;

        for (let x = 0; x < canvas.width; x++) {
          let isEmpty = true;

          for (let y = rowRange.start; y < rowRange.end; y++) {
            const index = (y * canvas.width + x) * 4;
            if (imageData.data[index + 3] > 0) {
              isEmpty = false;
              break;
            }
          }

          if (!isEmpty && !inSprite) {
            startX = x;
            inSprite = true;
          } else if (isEmpty && inSprite) {
            newFrames.push({
              x: frameToSplit.x + startX,
              y: frameToSplit.y + rowRange.start,
              width: x - startX,
              height: rowRange.end - rowRange.start,
              offsetX: 0,
              offsetY: 0
            });
            inSprite = false;
          }
        }

        if (inSprite) {
          newFrames.push({
            x: frameToSplit.x + startX,
            y: frameToSplit.y + rowRange.start,
            width: canvas.width - startX,
            height: rowRange.end - rowRange.start,
            offsetX: 0,
            offsetY: 0
          });
        }
      });

      if (newFrames.length > 0) {
        // Replace the original frame with the new detected frames
        const updatedFrames = [...detectedFrames];
        updatedFrames.splice(selectedFrame, 1, ...newFrames);
        setDetectedFrames(updatedFrames);
        setSelectedFrame(null);
      }
    };
  };

  // Add the help content
  const autoDetectHelp = {
    title: "How to Use Auto Frame Detection",
    sections: [
      {
        title: "Basic Usage",
        content: [
          "Upload a sprite sheet to automatically detect frames",
          "Toggle background removal if needed",
          "View detected frames outlined on your sprite sheet",
          "Preview animation using the detected frames"
        ]
      },
      {
        title: "Frame Management",
        content: [
          "Click 'Start Merge' to combine multiple frames",
          "Select frames you want to merge, then click 'Merge Frames'",
          "Select a frame and click 'Split Frame' to attempt re-detection",
          "Adjust frame offsets by selecting individual frames"
        ]
      },
      {
        title: "Animation & Export",
        content: [
          "Enter frame sequence (e.g., '0-3' or '0,1,2,3')",
          "Adjust animation speed with FPS control",
          "Choose to save all frames or selected frames",
          "Export as individual frames (ZIP) or combined spritesheet"
        ]
      }
    ]
  };

  return (
    <>
      <Navbar />
      <HelpGuide content={autoDetectHelp} />
      <div className="flex flex-row items-start space-x-4 p-6">
        {/* Left Section: Inputs */}
        <div className="flex flex-col items-start space-y-4 w-1/4 min-w-[300px]">
          <h1 className="text-4xl font-bold">Auto Frame Detection</h1>

          <FileUpload 
            onImageUpload={(src) => {
              if (typeof src === 'string') {
                setImageSrc(src);
                detectFrames(src);
              }
            }}
            multiple={false}
          />

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

              <div className="space-y-2">
                <div className="flex flex-col gap-4 p-4 border rounded bg-slate-800">
                  <label className="text-sm font-medium">Background Removal Options:</label>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={removeBackground}
                      onChange={(e) => {
                        setRemoveBackground(e.target.checked);
                        // Automatically detect frames when toggling background removal
                        if (imageSrc) detectFrames(imageSrc);
                      }}
                      className="rounded"
                    />
                    <span>Remove Background</span>
                  </div>

                  {removeBackground && (
                    <div className="space-y-4 pl-4 border-l-2 border-slate-700">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            setUseManualColor(false);
                            if (imageSrc) detectFrames(imageSrc);
                          }}
                          className={`px-3 py-2 rounded ${!useManualColor ? 'bg-blue-500' : 'bg-slate-600'}`}
                        >
                          Auto Detect
                        </button>
                        <button
                          onClick={() => {
                            setUseManualColor(true);
                            if (imageSrc) detectFrames(imageSrc);
                          }}
                          className={`px-3 py-2 rounded ${useManualColor ? 'bg-blue-500' : 'bg-slate-600'}`}
                        >
                          Manual Color
                        </button>
                      </div>

                      {useManualColor && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {manualColors.map((color, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => {
                                    const newColors = [...manualColors];
                                    newColors[index] = e.target.value;
                                    setManualColors(newColors);
                                    if (imageSrc) detectFrames(imageSrc);
                                  }}
                                  className="w-10 h-10 rounded cursor-pointer"
                                />
                                {manualColors.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newColors = manualColors.filter((_, i) => i !== index);
                                      setManualColors(newColors);
                                      if (imageSrc) detectFrames(imageSrc);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-600"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => setManualColors([...manualColors, '#000000'])}
                              className="w-10 h-10 rounded border-2 border-dashed border-gray-500 hover:border-gray-400 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm text-gray-400">
                            Select multiple colors to remove different background colors
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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

                  <div className="space-y-2 bg-slate-800 p-6 rounded-lg w-full">
                    <label className="block text-sm font-medium mb-1">Export Options:</label>
                    <div className="space-y-2">
                      <FilenameInput
                        value={outputFilename}
                        onChange={setOutputFilename}
                      />
                      {/* Other export controls */}
                    </div>
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

                <div className="flex items-center space-x-2 mt-4">
                  <label>Frame Merging:</label>
                  <button
                    onClick={() => {
                      setMergingMode(!mergingMode);
                      setFramesToMerge([]);
                    }}
                    className={`px-3 py-1 rounded ${
                      mergingMode ? 'bg-blue-500' : 'bg-gray-500'
                    } text-white`}
                  >
                    {mergingMode ? 'Cancel Merge' : 'Start Merge'}
                  </button>
                  {mergingMode && (
                    <>
                      <button
                        onClick={handleFrameMerge}
                        disabled={framesToMerge.length < 2}
                        className={`px-3 py-1 rounded ${
                          framesToMerge.length < 2 ? 'bg-gray-500' : 'bg-green-500'
                        } text-white`}
                      >
                        Merge {framesToMerge.length} Frames
                      </button>
                      <span className="text-sm text-gray-400">
                        Selected: {framesToMerge.join(', ')}
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleFrameSplit}
                  disabled={selectedFrame === null}
                  className={`px-3 py-1 rounded ${
                    selectedFrame === null ? 'bg-gray-500' : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  Split Frame
                </button>

                <div>
                  <label>Scale Preview (0.5x, 2x, etc.):</label>
                  <input
                    type="number"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="p-2 border rounded w-20 text-black"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Middle Section: Sprite Sheet Preview */}
        {processedImageSrc && (
          <div 
            className="relative w-1/2 overflow-hidden"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="relative w-full">
              <img
                src={processedImageSrc}
                alt="Uploaded Sprite Sheet"
                className="w-full h-auto block"
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
                        ${mergingMode 
                          ? framesToMerge.includes(index)
                            ? 'border-green-500 border-2'
                            : 'border-gray-500'
                          : selectedFrame === index 
                            ? 'border-blue-500 border-2' 
                            : 'border-red-500'}`}
                      style={{
                        left: `${frame.x * scaleX}px`,
                        top: `${frame.y * scaleY}px`,
                        width: `${frame.width * scaleX}px`,
                        height: `${frame.height * scaleY}px`,
                      }}
                      onClick={() => {
                        if (mergingMode) {
                          setFramesToMerge(prev => 
                            prev.includes(index)
                              ? prev.filter(f => f !== index)
                              : [...prev, index]
                          );
                        } else {
                          setSelectedFrame(index);
                        }
                      }}
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
