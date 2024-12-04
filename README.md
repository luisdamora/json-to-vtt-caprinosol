# JSON to VTT Converter

A modern web application that converts JSON subtitle files to WebVTT format with a beautiful, responsive UI.

## Features

- 🎯 Convert JSON subtitle files to WebVTT format
- 💫 Beautiful gradient animated background
- 🎨 Modern UI with Tailwind CSS
- 📱 Fully responsive design
- ⚡ Built with Vite + TypeScript
- 🔄 Drag & drop file upload
- ⬇️ Instant VTT file download

## Technical Details

### JSON Input Format

The application expects JSON files with the following structure:

```json
{
  "chunks": [
    {
      "timestamp": [0, 2.5],
      "text": "Subtitle text here"
    }
    // ... more chunks
  ]
}
