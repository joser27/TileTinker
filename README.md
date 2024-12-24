# **TileTinker: Sprite Sheet Tools**

TileTinker is a web-based toolkit for game developers and pixel artists to work with sprite sheets. It offers both sprite sheet creation and automatic sprite detection features, allowing users to either build sprite sheets from scratch or extract sprites from existing sheets.

### **Live Demo**
🎮 Try it now: [TileTinker Live Demo](https://joser27.github.io/TileTinker/)

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

### **Auto Frame Detection** (`/auto`)
- **Automatic Sprite Detection**: Upload a sprite sheet and automatically detect individual sprites
- **Interactive Preview**: View detected frames with numbered overlays
- **Frame Selection**: Select specific frames for preview or export
- **Animation Testing**: Test animations using frame sequences
- **Offset Adjustment**: Fine-tune sprite positions with X/Y offsets
- **Export Options**: Save as individual frames or new sprite sheet

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
