"use client";

import { useState, useRef, useEffect } from 'react';

export default function Converter() {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [pixelatedImage, setPixelatedImage] = useState<string | null>(null);
    const [pixelSize, setPixelSize] = useState<number>(10);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setOriginalImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const pixelateImage = (imageUrl: string, pixelSize: number) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear canvas and set transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Clear canvas again for redrawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Process each pixel
            for (let y = 0; y < canvas.height; y += pixelSize) {
                for (let x = 0; x < canvas.width; x += pixelSize) {
                    let r = 0, g = 0, b = 0, count = 0;

                    // Calculate average color for the pixel block
                    for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
                        for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
                            const i = ((y + py) * canvas.width + (x + px)) * 4;
                            if (data[i + 3] > 128) { // Only consider pixels that are more than 50% opaque
                                r += data[i];
                                g += data[i + 1];
                                b += data[i + 2];
                                count++;
                            }
                        }
                    }

                    if (count > 0) {
                        // Calculate averages
                        r = Math.round(r / count);
                        g = Math.round(g / count);
                        b = Math.round(b / count);

                        // Convert to black or white based on brightness
                        const brightness = (r + g + b) / 3;
                        const color = brightness > 128 ? 255 : 0;

                        // Fill the pixel block with the solid color (fully opaque)
                        ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
                        ctx.fillRect(x, y, pixelSize, pixelSize);
                    }
                }
            }

            setPixelatedImage(canvas.toDataURL('image/png'));
        };
    };

    const handleDownload = () => {
        if (pixelatedImage) {
            const link = document.createElement('a');
            link.href = pixelatedImage;
            link.download = 'pixelated-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    useEffect(() => {
        if (originalImage) {
            pixelateImage(originalImage, pixelSize);
        }
    }, [originalImage, pixelSize]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Pixel Art Converter</h1>
            
            <div className="mb-4 space-y-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-4"
                />
                
                <div className="flex items-center gap-4">
                    <label htmlFor="pixelSize" className="font-medium">
                        Pixel Size:
                    </label>
                    <input
                        id="pixelSize"
                        type="range"
                        min="1"
                        max="50"
                        value={pixelSize}
                        onChange={(e) => setPixelSize(Number(e.target.value))}
                        className="w-48"
                    />
                    <span>{pixelSize}px</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {originalImage && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Original Image</h2>
                        <img src={originalImage} alt="Original" className="max-w-full" />
                    </div>
                )}
                
                {pixelatedImage && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Pixelated Image</h2>
                        <img src={pixelatedImage} alt="Pixelated" className="max-w-full mb-2" />
                        <button 
                            onClick={handleDownload}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                        >
                            Download Image
                        </button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}