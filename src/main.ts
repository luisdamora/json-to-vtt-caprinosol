interface Chunk {
  timestamp?: number[];
  start?: number;
  end?: number;
  text: string;
}

interface JsonData {
  chunks: Chunk[];
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function convertJsonToVtt(jsonData: JsonData): string {
  let vttContent = 'WEBVTT\n\n';

  jsonData.chunks.forEach((chunk, index) => {


    if (!chunk.timestamp && chunk.start && chunk.end) {
      chunk.timestamp = [chunk.start, chunk.end]
    } else {
      chunk.timestamp = []
    }

    const startTime = formatTime(chunk.timestamp[0]);
    const endTime = formatTime(chunk.timestamp[1]);

    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${chunk.text}\n\n`;
  });

  return vttContent;
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('jsonInput') as HTMLInputElement;
  const dropZone = document.querySelector('label[for="jsonInput"]') as HTMLLabelElement;
  const convertButton = document.getElementById('convertButton') as HTMLButtonElement;
  const resultDiv = document.getElementById('result') as HTMLDivElement;
  const fileInfo = document.getElementById('fileInfo') as HTMLDivElement;

  function updateFileInfo(file: File) {
    const size = (file.size / 1024).toFixed(2);
    fileInfo.textContent = `${file.name} (${size} KB)`;
    fileInfo.classList.remove('hidden');
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) {
      updateFileInfo(file);
    }
  });

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Add visual feedback
  dropZone.addEventListener('dragenter', () => {
    dropZone.classList.add('border-blue-500');
    dropZone.classList.add('bg-blue-50');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500');
    dropZone.classList.remove('bg-blue-50');
  });

  // Handle dropped files
  dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('border-blue-500');
    dropZone.classList.remove('bg-blue-50');
    
    const dt = e.dataTransfer;
    const files = dt?.files;

    if (files && files.length > 0) {
      fileInput.files = files;
      updateFileInfo(files[0]);
      convertButton.click();
    }
  });

  convertButton.addEventListener('click', () => {
    const file = fileInput.files?.[0];
    if (!file) {
      alert('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string) as JsonData;
        const vttContent = convertJsonToVtt(jsonData);

        // Create download link
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'subtitles.vtt';
        downloadLink.className =
          'inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-300 ease-in-out transform hover:scale-105';

        downloadLink.textContent = 'Download VTT file';
        downloadLink.innerHTML = `
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        Download VTT file
      `;

        resultDiv.innerHTML = '';
        resultDiv.appendChild(downloadLink);
      } catch (error) {
        alert('Error processing JSON file');
        console.error(error);
      }
    };
    reader.readAsText(file);
  });
});