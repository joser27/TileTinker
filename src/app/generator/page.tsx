"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from '../components/Navbar'

interface Cell {
  id: number;
  spriteId: string | null;
}

interface Sprite {
  id: string;
  src: string;
  name: string;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

export default function SpritesheetGenerator() {
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState({ rows: 4, cols: 4 });
  const [cellSize, setCellSize] = useState(64);
  const [outputFilename, setOutputFilename] = useState("spritesheet");
  const [showGrid, setShowGrid] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [antialiasing, setAntialiasing] = useState(false);
  const [padding, setPadding] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationCells, setAnimationCells] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(12);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [frameSequenceInput, setFrameSequenceInput] = useState('');
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [currentPreviewFrame, setCurrentPreviewFrame] = useState<number>(0);

  // Calculate optimal cell size based on sprites
  const calculateOptimalCellSize = (sprites: Sprite[]) => {
    if (sprites.length === 0) return 64; // Default size

    // Find the largest width and height among all sprites
    const maxWidth = Math.max(...sprites.map(s => s.width));
    const maxHeight = Math.max(...sprites.map(s => s.height));

    // Add padding (both sides)
    return Math.max(maxWidth, maxHeight) + (padding * 2);
  };

  // Update grid when rows/cols change
  const updateGrid = (newRows: number, newCols: number) => {
    const newTotalCells = newRows * newCols;
    const newCells: Cell[] = Array(newTotalCells).fill(null).map((_, index) => {
      if (index < cells.length) {
        return cells[index];
      }
      return {
        id: index,
        spriteId: null
      };
    });
    
    setCells(newCells);
    setGridSize({ rows: newRows, cols: newCols });
  };

  // Initialize grid only for new uploads
  useEffect(() => {
    if (sprites.length > 0) {
      // Get all currently placed sprite IDs
      const placedSpriteIds = new Set(cells.map(cell => cell.spriteId).filter(Boolean));
      
      // Find sprites that aren't placed yet
      const unplacedSprites = sprites.filter(sprite => !placedSpriteIds.has(sprite.id));
      
      // Only update grid if we have new sprites to place
      if (unplacedSprites.length > 0) {
        const totalCells = gridSize.rows * gridSize.cols;
        const newCells = [...cells];
        
        // Expand cells array if needed
        while (newCells.length < totalCells) {
          newCells.push({
            id: newCells.length,
            spriteId: null
          });
        }
        
        // Find empty cells and place new sprites
        let unplacedIndex = 0;
        for (let i = 0; i < newCells.length && unplacedIndex < unplacedSprites.length; i++) {
          if (!newCells[i].spriteId) {
            newCells[i].spriteId = unplacedSprites[unplacedIndex].id;
            unplacedIndex++;
          }
        }
        
        setCells(newCells);
        
        // Update cell size based on all sprites
        const optimalSize = calculateOptimalCellSize(sprites);
        setCellSize(optimalSize);
      }
    }
  }, [sprites]);

  // Separate effect for handling grid size changes
  useEffect(() => {
    const totalCells = gridSize.rows * gridSize.cols;
    if (cells.length !== totalCells) {
      const newCells = [...cells];
      
      // Expand or shrink cells array to match grid size
      if (newCells.length < totalCells) {
        // Add new cells
        while (newCells.length < totalCells) {
          newCells.push({
            id: newCells.length,
            spriteId: null
          });
        }
      } else if (newCells.length > totalCells) {
        // Remove excess cells
        newCells.length = totalCells;
      }
      
      setCells(newCells);
    }
  }, [gridSize]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newSprites: Promise<Sprite>[] = Array.from(files).map(file => 
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
              resolve({
                id: crypto.randomUUID(),
                src: reader.result as string,
                name: file.name,
                width: img.width,
                height: img.height
              });
            };
          }
        };
        reader.readAsDataURL(file);
      })
    );

    Promise.all(newSprites).then(loadedSprites => {
      setSprites(prev => [...prev, ...loadedSprites]);
    });
  };

  const handleCellClick = (cellId: number) => {
    if (selectedCell === null) {
      // First click - select the cell
      setSelectedCell(cellId);
    } else if (selectedCell !== cellId) { // Make sure we're not clicking the same cell
      // Second click - swap cells
      const newCells = [...cells];
      const temp = newCells[selectedCell].spriteId;
      newCells[selectedCell].spriteId = newCells[cellId].spriteId;
      newCells[cellId].spriteId = temp;
      setCells(newCells);
      setSelectedCell(null); // Clear selection after swap
    } else {
      // Clicked same cell twice - just clear selection
      setSelectedCell(null);
    }
  };

  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    // Make sure we're within grid bounds
    if (col >= 0 && col < gridSize.cols && row >= 0 && row < gridSize.rows) {
      const cellId = row * gridSize.cols + col;
      handleCellClick(cellId);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d')!;
    const width = gridSize.cols * cellSize;
    const height = gridSize.rows * cellSize;
    
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (!antialiasing) {
      ctx.imageSmoothingEnabled = false;
    }

    // Draw grid and sprites
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const x = col * cellSize;
        const y = row * cellSize;
        const cellIndex = row * gridSize.cols + col;

        // Draw cell border if grid is enabled
        if (showGrid) {
          ctx.strokeStyle = '#ddd';
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        // Draw cell number if enabled
        if (showNumbers) {
          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.fillText(cellIndex.toString(), x + 4, y + 14);
        }

        // Draw sprite if present
        const cell = cells[cellIndex];
        if (cell?.spriteId) {
          const sprite = sprites.find(s => s.id === cell.spriteId);
          if (sprite) {
            const img = new Image();
            img.src = sprite.src;
            img.onload = () => {
              // Calculate scale to fit sprite within cell (accounting for padding)
              const availableWidth = cellSize - (padding * 2);
              const availableHeight = cellSize - (padding * 2);
              const scale = Math.min(
                availableWidth / sprite.width,
                availableHeight / sprite.height
              );
              
              const width = sprite.width * scale;
              const height = sprite.height * scale;
              
              // Center sprite in cell (with padding) and apply offset
              const spriteX = x + (cellSize - width) / 2 + (sprite.offsetX || 0);
              const spriteY = y + (cellSize - height) / 2 + (sprite.offsetY || 0);
              
              ctx.drawImage(img, spriteX, spriteY, width, height);
            };
          }
        }

        // Highlight selected cell
        if (cellIndex === selectedCell) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }, [gridSize, cellSize, cells, selectedCell, sprites, showGrid, showNumbers, antialiasing, padding]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert the canvas to a blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      // Create URL for the blob
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${outputFilename || 'spritesheet'}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Get selected sprite details
  const getSelectedSprite = () => {
    if (selectedCell === null) return null;
    const cell = cells[selectedCell];
    if (!cell?.spriteId) return null;
    return sprites.find(s => s.id === cell.spriteId);
  };

  // Handle sprite deletion entirely
  const handleDeleteSprite = (spriteId: string) => {
    // Remove sprite from sprites list
    setSprites(prev => prev.filter(sprite => sprite.id !== spriteId));

    // Clear only the cells that contain this specific sprite
    setCells(prev => prev.map(cell => ({
      ...cell,
      spriteId: cell.spriteId === spriteId ? null : cell.spriteId
    })));

    // Clear selection if the deleted sprite was selected
    if (selectedCell !== null && cells[selectedCell]?.spriteId === spriteId) {
      setSelectedCell(null);
    }
  };

  // Update preloaded images when sprites change
  useEffect(() => {
    // Clear old preloaded images
    preloadedImagesRef.current.clear();

    // Preload each sprite image
    sprites.forEach(sprite => {
      const img = new Image();
      img.src = sprite.src;
      img.onload = () => {
        preloadedImagesRef.current.set(sprite.id, img);
      };
    });
  }, [sprites]); // Now this will update when sprites (including offsets) change

  // Animation preview effect
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !isPlaying || animationCells.length === 0) return;

    // Set canvas size to match cell size
    canvas.width = cellSize;
    canvas.height = cellSize;

    let frameIndex = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / fps;
    const ctx = canvas.getContext('2d')!;

    if (!antialiasing) {
      ctx.imageSmoothingEnabled = false;
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTime >= frameInterval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cellIndex = animationCells[frameIndex];
        const cell = cells[cellIndex];
        
        if (cell?.spriteId) {
          const sprite = sprites.find(s => s.id === cell.spriteId);
          if (sprite && preloadedImagesRef.current.has(sprite.id)) {
            const img = preloadedImagesRef.current.get(sprite.id)!;
            
            // Calculate scale to fit sprite within cell (accounting for padding)
            const availableWidth = cellSize - (padding * 2);
            const availableHeight = cellSize - (padding * 2);
            const scale = Math.min(
              availableWidth / sprite.width,
              availableHeight / sprite.height
            );
            
            const width = sprite.width * scale;
            const height = sprite.height * scale;
            
            // Center sprite in canvas with padding and offset
            const x = (cellSize - width) / 2 + (sprite.offsetX || 0);
            const y = (cellSize - height) / 2 + (sprite.offsetY || 0);
            
            ctx.drawImage(img, x, y, width, height);
          }
        }

        frameIndex = (frameIndex + 1) % animationCells.length;
        setCurrentPreviewFrame(animationCells[frameIndex]);
        lastFrameTime = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animationCells, fps, cells, sprites, antialiasing, cellSize, padding]);

  // Helper function to parse cell sequence input
  const parseCellSequence = (input: string): number[] => {
    return input
      .split(',')
      .flatMap(part => {
        part = part.trim();
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(n => parseInt(n.trim()));
          if (!isNaN(start) && !isNaN(end)) {
            // Create array of numbers from start to end (inclusive)
            return Array.from(
              { length: end - start + 1 }, 
              (_, i) => start + i
            );
          }
        }
        const num = parseInt(part);
        return !isNaN(num) ? [num] : [];
      })
      .filter(n => n >= 0 && n < cells.length);
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-row items-start space-x-4 p-6">
        {/* Left Panel: Controls */}
        <div className="flex flex-col items-start space-y-4 w-1/4 min-w-[300px]">
          <h1 className="text-2xl font-bold">Sprite Sheet Generator</h1>
          
          <div className="space-y-4 bg-slate-800 p-6 rounded-lg w-full">
            <div>
              <label className="block text-sm font-medium mb-1">Add Sprites:</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rows:</label>
                <input
                  type="number"
                  value={gridSize.rows}
                  onChange={(e) => {
                    const newRows = Math.max(1, parseInt(e.target.value));
                    updateGrid(newRows, gridSize.cols);
                  }}
                  className="w-full p-2 border rounded text-black"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Columns:</label>
                <input
                  type="number"
                  value={gridSize.cols}
                  onChange={(e) => {
                    const newCols = Math.max(1, parseInt(e.target.value));
                    updateGrid(gridSize.rows, newCols);
                  }}
                  className="w-full p-2 border rounded text-black"
                  min="1"
                />
              </div>
            </div>

            {/* Padding Control */}
            <div>
              <label className="block text-sm font-medium mb-1">Sprite Padding:</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={padding}
                  onChange={(e) => {
                    const newPadding = parseInt(e.target.value);
                    setPadding(newPadding);
                    const optimalSize = calculateOptimalCellSize(sprites);
                    setCellSize(optimalSize);
                  }}
                  className="flex-1"
                />
                <span className="text-sm w-8">{padding}px</span>
              </div>
            </div>

            {/* Output Filename */}
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Output Filename:</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full p-2 border rounded text-black"
                  placeholder="spritesheet"
                />
                <button
                  onClick={handleSave}
                  className={`w-full px-4 py-2 rounded transition-colors ${
                    sprites.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  }`}
                  disabled={sprites.length === 0}
                >
                  Save PNG
                </button>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-2">
              <h3 className="font-medium">Display Options</h3>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded"
                  />
                  Show Grid
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                    className="rounded"
                  />
                  Show Cell Numbers
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={antialiasing}
                    onChange={(e) => setAntialiasing(e.target.checked)}
                    className="rounded"
                  />
                  Enable Antialiasing
                </label>
              </div>
            </div>

            {/* Move animation controls here but keep the preview canvas in the right panel */}
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Frame Sequence:</label>
              <input
                type="text"
                value={frameSequenceInput}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setFrameSequenceInput(inputValue);
                  const cells = parseCellSequence(inputValue);
                  setAnimationCells(cells);
                }}
                placeholder="Enter cells (e.g., 0-3 or 0,1,2,3)"
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">FPS:</label>
              <input
                type="number"
                value={fps}
                onChange={(e) => setFps(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2 border rounded text-black"
                min="1"
                max="60"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  animationCells.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : isPlaying 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                }`}
                disabled={animationCells.length === 0}
              >
                {isPlaying ? 'Stop' : 'Play'}
              </button>
            </div>
          </div>

          {/* Selected Cell Details */}
          {selectedCell !== null && (
            <div className="space-y-2 bg-slate-800 p-6 rounded-lg w-full">
              <h2 className="font-semibold">Selected Cell Details</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-400">Cell Number:</span>
                  <span className="ml-2">{selectedCell}</span>
                </div>
                
                {getSelectedSprite() ? (
                  <>
                    <div className="flex items-center gap-4">
                      <img
                        src={getSelectedSprite()?.src}
                        alt={getSelectedSprite()?.name}
                        className="w-16 h-16 object-contain bg-slate-700 rounded p-2"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium truncate">
                          {getSelectedSprite()?.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {getSelectedSprite()?.width}x{getSelectedSprite()?.height}px
                        </div>
                        <div className="text-sm text-gray-400">
                          Position: ({Math.floor(selectedCell % gridSize.cols)}, 
                          {Math.floor(selectedCell / gridSize.cols)})
                        </div>
                      </div>
                    </div>

                    {/* Offset Controls */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Offset Adjustments</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm text-gray-400">X Offset:</label>
                          <input
                            type="number"
                            value={getSelectedSprite()?.offsetX || 0}
                            onChange={(e) => {
                              const sprite = getSelectedSprite();
                              if (sprite) {
                                setSprites(prev => prev.map(s => 
                                  s.id === sprite.id 
                                    ? { ...s, offsetX: parseInt(e.target.value) || 0 }
                                    : s
                                ));
                              }
                            }}
                            className="w-full p-2 border rounded text-black"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Y Offset:</label>
                          <input
                            type="number"
                            value={getSelectedSprite()?.offsetY || 0}
                            onChange={(e) => {
                              const sprite = getSelectedSprite();
                              if (sprite) {
                                setSprites(prev => prev.map(s => 
                                  s.id === sprite.id 
                                    ? { ...s, offsetY: parseInt(e.target.value) || 0 }
                                    : s
                                ));
                              }
                            }}
                            className="w-full p-2 border rounded text-black"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const sprite = getSelectedSprite();
                          if (sprite) {
                            handleDeleteSprite(sprite.id);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition-colors"
                      >
                        Delete Sprite
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">Empty Cell</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Middle Section: Canvas */}
        <div className="w-1/2">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-gray-700"
          />
        </div>

        {/* Right Section: Animation Preview */}
        <div className="w-1/4">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Animation Preview</h2>
            <div className="relative">
              <canvas
                ref={previewCanvasRef}
                className="w-full aspect-square bg-slate-900"
                style={{ 
                  imageRendering: antialiasing ? 'auto' : 'pixelated',
                }}
              />
              {isPlaying && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  Cell {currentPreviewFrame}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}