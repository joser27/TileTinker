
# **TileTinker: Sprite Sheet Cutter**

TileTinker is a web-based tool for game developers and pixel artists to cut sprite sheets into individual tiles. It allows users to upload a sprite sheet, define the number of rows and columns, preview the grid layout with numbered tiles, and download all the slices as a ZIP file.

## **Features**

- **Upload Sprite Sheets**: Supports common image formats (e.g., PNG, JPEG).
- **Customizable Grid**: Set the number of rows and columns to define the tile layout.
- **Live Preview**: Displays a grid overlay on the sprite sheet, dynamically numbered for easy reference.
- **Downloadable Slices**: Packages all slices into a single ZIP file for download.

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

### **Live Demo**
Visit the live site here: [TileTinker GitHub Pages](https://joser27.github.io/TileTinker/)

## **How to Use**
1. **Upload Sprite Sheet**: Click the upload button and select a sprite sheet.
2. **Set Rows and Columns**: Use the input fields to specify the grid layout.
3. **Preview the Grid**:
   - The grid dynamically updates based on the rows and columns.
   - Each tile is labeled with its index, starting from `0`.
4. **Download Slices**: Click "Save Frames as ZIP" to download all slices packaged in a ZIP file.

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

## **Contributing**
Contributions are welcome! If you’d like to improve TileTinker:
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
