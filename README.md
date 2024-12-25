# **TileTinker: Sprite Sheet Tools**

TileTinker is a web-based toolkit for game developers and pixel artists to work with sprite sheets. It offers both sprite sheet creation and automatic sprite detection features, allowing users to either build sprite sheets from scratch or extract sprites from existing sheets.

### **Live Demo**
🎮 Try it now: [TileTinker Live Demo](https://joser27.github.io/TileTinker/)

## **Browser Compatibility**

TileTinker is tested and optimized for:
- Chrome (recommended) v90+
- Firefox v90+
- Edge v90+
- Safari v14+

For the best experience:
- Use a modern browser with HTML5 Canvas support
- Enable JavaScript
- Use a desktop/laptop device (mobile support is limited)
- Recommended minimum screen resolution: 1280x720

Known limitations:
- Mobile devices may have reduced functionality
- Large sprite sheets may cause performance issues on low-end devices
- Some features may not work in older browsers

## **Features**

### **Sprite Sheet Generator** (`/generator`)
- **Create Sprite Sheets**: Build sprite sheets from individual sprites
- **Customizable Grid**: Set the number of rows and columns to define the layout
- **Interactive Preview**:
  - Live grid overlay with toggleable grid lines
  - Optional tile numbering for easy reference
  - Adjustable preview scale
  - Toggle antialiasing for pixel-perfect preview
  - Individual sprite offset adjustments
- **Animation Preview**:
  - Test animations with adjustable frame rate
  - Select specific frames using ranges (e.g., "0-3") or comma-separated values
  - Real-time frame counter
  - Toggle animation preview panel
- **Sprite Management**:
  - View sprite details and position
  - Adjust individual sprite offsets
  - Delete individual sprites
- **Flexible Export Options**:
  - Save all frames as individual files (ZIP)
  - Save selected frames as individual files (ZIP)
  - Save selected frames as a new sprite sheet
- **Display Options**:
  - Toggle grid lines
  - Toggle cell numbers
  - Toggle antialiasing
  - Adjust sprite padding
  - Scale preview for better visibility

### **Auto Frame Detection** (`/auto`)
- **Automatic Sprite Detection**: Upload a sprite sheet and automatically detect individual sprites
- **Interactive Preview**: View detected frames with numbered overlays
- **Frame Selection**: Select specific frames for preview or export
- **Frame Management**:
  - Merge multiple frames into a single frame
  - Split frames for more granular detection
  - Background color removal with tolerance
- **Animation Testing**: Test animations using frame sequences
- **Offset Adjustment**: Fine-tune sprite positions with X/Y offsets
- **Export Options**: Save as individual frames or new sprite sheet

### **Sprite Sheet Slicer** (`/`)
- **Manual Slicing**: Set rows and columns to slice sprite sheets
- **Interactive Grid**:
  - Adjustable preview scale
  - Toggle grid lines
  - Toggle cell numbers
  - Antialiasing toggle
- **Animation Preview**:
  - Test frame sequences
  - Adjustable animation speed
  - Frame counter
- **Export Options**:
  - Save all frames or selected frames
  - Choose between ZIP of individual frames or combined sprite sheet
  - Custom filename support

### **General Features**
- **Help Guide**: Interactive help system for each tool
- **Responsive Design**: Works on various screen sizes
- **Local Processing**: All operations performed in-browser
- **No Registration**: No account required
- **Privacy Focused**: No data collection or storage

## **How to Use**

### **Sprite Sheet Generator**
1. Navigate to `/generator`
2. Upload individual sprites
3. Set grid layout (rows and columns)
4. Arrange sprites by clicking cells
5. Adjust display options and sprite positions
6. Preview animations if needed
7. Export as individual files or sprite sheet

### **Auto Frame Detection**
1. Navigate to `/auto`
2. Upload a sprite sheet
3. Review detected frames
4. Adjust frame offsets if needed
5. Test animations using frame sequences
6. Export selected frames or entire sheet

## **Technologies Used**
- **Frontend**:
  - [React](https://reactjs.org/) for building the UI
  - [Next.js](https://nextjs.org/) for server-side rendering and routing
  - [Tailwind CSS](https://tailwindcss.com/) for styling
- **Dependencies**:
  - [JSZip](https://stuk.github.io/jszip/) for creating ZIP files
  - [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for downloading files
- **Development Tools**:
  - TypeScript for type safety

## **Future Improvements**
- Support irregular grids and tile dimensions
- Provide advanced file formats for export (e.g., JSON metadata)
- Implement undo/redo functionality

## **License**

MIT License

Copyright (c) 2024 Jose Rodriguez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## **Usage Limitations**

- This tool processes all images locally in your browser
- Maximum recommended sprite sheet size: 4096x4096 pixels
- Maximum recommended file size: 10MB
- For larger files, consider splitting them into smaller sheets

## **Privacy & Security**

- No data is collected or stored on servers
- All image processing happens in your browser
- No user authentication required
- No cookies are used except those required for basic functionality

## **Attribution**

If you use TileTinker in your project, attribution is appreciated but not required
