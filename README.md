# **TileTinker: Sprite Sheet Cutter**

TileTinker is a web-based tool for game developers and pixel artists to cut sprite sheets into individual tiles. It allows users to upload a sprite sheet, define the number of rows and columns, preview the grid layout with numbered tiles, and download frames individually or as a new sprite sheet.

### **Live Demo**
🎮 Try it now: [TileTinker Live Demo](https://joser27.github.io/TileTinker/)

## **Features**

- **Upload Sprite Sheets**: Supports common image formats (e.g., PNG, JPEG).
- **Customizable Grid**: Set the number of rows and columns to define the tile layout.
- **Interactive Preview**:
  - Live grid overlay with toggleable grid lines
  - Optional tile numbering for easy reference
  - Adjustable preview scale
  - Toggle antialiasing for pixel-perfect preview
- **Flexible Export Options**:
  - Save all frames as individual files (ZIP)
  - Save selected frames as individual files (ZIP)
  - Save selected frames as a new sprite sheet
- **Animation Preview**:
  - Test animations with adjustable frame rate
  - Select specific frames using ranges or comma-separated values

## **Getting Started**

### **Prerequisites**
- Node.js (version 16+)
- npm (Node Package Manager)

### **Installation**
1. Clone the repository:
   ```bash
   git clone https://github.com/joser27/tiletinker.git
   cd tiletinker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the site in your browser:
   ```
   http://localhost:3000
   ```

## **How to Use**
1. **Upload Sprite Sheet**: Click the upload button and select a sprite sheet.
2. **Set Grid Layout**: 
   - Specify the number of rows and columns
   - Toggle grid lines and tile numbers for better visibility
3. **Preview and Adjust**:
   - Use the scale control to zoom in/out
   - Toggle antialiasing for pixel art
   - Test animations by entering frame sequences and adjusting speed
4. **Export Options**:
   - Choose between saving all frames or specific frames
   - When saving specific frames, select either:
     - Individual PNG files (zipped)
     - Combined sprite sheet with selected frames

## **Technologies Used**
- **Frontend**:
  - [React](https://reactjs.org/) for building the UI.
  - [Next.js](https://nextjs.org/) for server-side rendering and routing.
  - [Tailwind CSS](https://tailwindcss.com/) for styling.
- **Dependencies**:
  - [JSZip](https://stuk.github.io/jszip/) for creating ZIP files.
  - [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for downloading files.
- **Development Tools**:
  - TypeScript for type safety.

## **Future Improvements**
- Support irregular grids and tile dimensions.
- Enable drag-and-drop grid adjustments.
- Provide advanced file formats for export (e.g., JSON metadata).
- Add batch processing for multiple sprite sheets.
- Implement undo/redo functionality.

## **Contributing**
Contributions are welcome! If you'd like to improve TileTinker:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Submit a pull request.
