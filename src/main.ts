import { convertJsonToVtt, JsonData } from "./app";
import './style.css';

// DOM Elements
let fileInput: HTMLInputElement;
let dropZone: HTMLLabelElement;
let convertButton: HTMLButtonElement;
let resultDiv: HTMLDivElement;
let fileInfoDiv: HTMLDivElement;
let messageArea: HTMLDivElement;

// Helper Functions
function displayMessage(message: string, type: 'error' | 'success' | 'info' = 'info') {
  if (!messageArea) return;
  messageArea.textContent = message;
    messageArea.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-blue-100', 'text-blue-700');

    switch (type) {
      case 'error':
        messageArea.classList.add('bg-red-100', 'text-red-700');
        break;
      case 'success':
        messageArea.classList.add('bg-green-100', 'text-green-700');
        break;
      case 'info':
      default:
        messageArea.classList.add('bg-blue-100', 'text-blue-700');
        break;
    }
    messageArea.classList.remove('hidden');
  }

function clearMessage() {
  if (!messageArea) return;
  messageArea.textContent = '';
  messageArea.classList.add('hidden');
}

function updateFileInfo(file: File) {
  if (!fileInfoDiv) return;
  const size = (file.size / 1024).toFixed(2);
  fileInfoDiv.textContent = `${file.name} (${size} KB)`;
  fileInfoDiv.classList.remove('hidden');
}

function handleFileSelection(selectedFile: File | null | undefined) {
  clearMessage();
  if (resultDiv) resultDiv.innerHTML = '';

  if (selectedFile) {
    if (selectedFile.type !== 'application/json') {
      updateFileInfo(selectedFile); // Show file info even if wrong type
      displayMessage('Invalid file type. Please upload a JSON file.', 'error');
      if (fileInput) fileInput.value = ''; // Clear the invalid file selection
      if (fileInfoDiv) fileInfoDiv.classList.add('hidden'); // Hide file info as it's invalid
      return false;
    }
    updateFileInfo(selectedFile);
    return true;
  } else {
    if (fileInfoDiv) fileInfoDiv.classList.add('hidden');
    return false;
  }
}

function setupDragAndDrop() {
  if (!dropZone || !fileInput || !convertButton) return;

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Add visual feedback
  dropZone.addEventListener('dragenter', () => dropZone.classList.add('border-blue-500', 'bg-blue-50'));
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-500', 'bg-blue-50'));

  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    const dt = e.dataTransfer;
    const files = dt?.files;

    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (handleFileSelection(droppedFile)) {
        fileInput.files = files; // Assign dropped files to input for consistency
        convertButton.click();   // Automatically trigger conversion
      }
    }
  });
}

function processConversion() {
  if (!fileInput || !resultDiv) return;

  clearMessage();
  resultDiv.innerHTML = '';

  const file = fileInput.files?.[0];
  if (!handleFileSelection(file)) { // Re-validate, also handles no-file selected case
      if (!file) displayMessage('Please select a JSON file.', 'error'); // Specific message if no file
      return;
  }

  // file is re-asserted here because handleFileSelection would have returned false if !file
  const currentFile = file!;

  const reader = new FileReader();
  reader.onerror = () => {
    displayMessage('Error reading file.', 'error');
    console.error('FileReader error');
  };

  reader.onload = (e) => {
    try {
      if (!e.target?.result) {
        displayMessage('File content is empty or unreadable.', 'error');
        return;
      }
      const fileContent = e.target.result as string;
      if (fileContent.trim() === '') {
        displayMessage('JSON file is empty.', 'error');
        return;
      }
      const jsonData = JSON.parse(fileContent) as JsonData;

      if (!jsonData.chunks || !Array.isArray(jsonData.chunks)) {
        displayMessage('Invalid JSON structure. Missing "chunks" array.', 'error');
        console.error('Invalid JSON structure:', jsonData);
        return;
      }

      const vttContent = convertJsonToVtt(jsonData);

      let messageDisplayed = false;
      if (vttContent === 'WEBVTT\n\n' && jsonData.chunks.length > 0) {
        displayMessage('JSON contained chunks, but none could be converted. Check if chunks have valid time and text.', 'info');
        messageDisplayed = true;
      } else if (jsonData.chunks.length === 0) {
        displayMessage('JSON file has no subtitle chunks to convert.', 'info');
        messageDisplayed = true;
      }

      if (vttContent !== 'WEBVTT\n\n') {
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'subtitles.vtt';
        downloadLink.className =
          'inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-300 ease-in-out transform hover:scale-105';
        downloadLink.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download VTT file`;

        resultDiv.innerHTML = '';
        resultDiv.appendChild(downloadLink);
        if (!messageDisplayed) {
          displayMessage('Conversion successful! Click to download.', 'success');
        }
      } else if (!messageDisplayed) {
        displayMessage('No convertible subtitle data found.', 'info');
      }

    } catch (error: any) {
      if (error instanceof SyntaxError) {
        displayMessage('Invalid JSON file. Please check the file content and structure.', 'error');
      } else {
        displayMessage('Error processing JSON file. See console for details.', 'error');
      }
      console.error("Error during conversion:", error);
    }
  };
  reader.readAsText(currentFile);
}

function initializeApp() {
  // Assign DOM elements
  fileInput = document.getElementById('jsonInput') as HTMLInputElement;
  dropZone = document.querySelector('label[for="jsonInput"]') as HTMLLabelElement;
  convertButton = document.getElementById('convertButton') as HTMLButtonElement;
  resultDiv = document.getElementById('result') as HTMLDivElement;
  fileInfoDiv = document.getElementById('fileInfo') as HTMLDivElement; // Corrected from fileInfo
  messageArea = document.getElementById('messageArea') as HTMLDivElement;

  if (!fileInput || !dropZone || !convertButton || !resultDiv || !fileInfoDiv || !messageArea) {
    console.error('Initialization failed: One or more essential DOM elements are missing.');
    return;
  }

  // Setup event listeners
  fileInput.addEventListener('change', () => handleFileSelection(fileInput.files?.[0]));
  convertButton.addEventListener('click', processConversion);
  setupDragAndDrop();
}

document.addEventListener('DOMContentLoaded', initializeApp);
});