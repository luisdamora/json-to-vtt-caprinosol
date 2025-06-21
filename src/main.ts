import { convertJsonToVtt, JsonData, convertSrtToVtt } from "./app";
import JSZip from 'jszip';
import './style.css';


document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const fileTypeSelect = document.getElementById('fileType') as HTMLSelectElement;
  const dropZone = document.querySelector('label[for="fileInput"]') as HTMLLabelElement;
  const convertButton = document.getElementById('convertButton') as HTMLButtonElement;
  const resultDiv = document.getElementById('result') as HTMLDivElement;
  const fileInfo = document.getElementById('fileInfo') as HTMLDivElement;

  // Video Preview Elements
  const videoPreviewSection = document.getElementById('videoPreviewSection') as HTMLDivElement;
  const videoUpload = document.getElementById('videoUpload') as HTMLInputElement;
  const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement;
  const subtitleDisplay = document.getElementById('subtitleDisplay') as HTMLDivElement;
  let currentTrack: TextTrack | null = null;


  function updateFileInfo(files: FileList | null) {
    if (files && files.length > 0) {
      if (files.length === 1) {
        const file = files[0];
        const size = (file.size / 1024).toFixed(2);
        fileInfo.textContent = `${file.name} (${size} KB)`;
      } else {
        fileInfo.textContent = `${files.length} files selected`;
      }
      fileInfo.classList.remove('hidden');
    } else {
      fileInfo.classList.add('hidden');
      fileInfo.textContent = '';
    }
  }

  fileInput.addEventListener('change', () => {
    updateFileInfo(fileInput.files);
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
      fileInput.files = files; // Assign dropped files to the input
      updateFileInfo(files); // Update UI with info about dropped files
      // convertButton.click(); // Optionally auto-click convert, or let user do it
    }
  });

  convertButton.addEventListener('click', async () => {
    const files = fileInput.files;
    if (!files || files.length === 0) {
      alert('Please select one or more files');
      return;
    }

    const zip = new JSZip();
    const processingPromises: Promise<void>[] = [];
    let firstVttContent: string | null = null; // For single file preview

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const promise = new Promise<void>((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const fileContent = e.target?.result as string;
            let vttContent = '';
            let outputFilename = file.name.replace(/\.(json|srt)$/i, '.vtt');

            if (fileTypeSelect.value === 'json') {
              const jsonData = JSON.parse(fileContent) as JsonData;
              vttContent = convertJsonToVtt(jsonData);
            } else if (fileTypeSelect.value === 'srt') {
              vttContent = convertSrtToVtt(fileContent);
            } else {
              alert('Invalid file type selected for ' + file.name);
              reject(new Error('Invalid file type'));
              return;
            }

            zip.file(outputFilename, vttContent);
            if (i === 0) { // Store first VTT content for preview
              firstVttContent = vttContent;
            }
            resolve();
          } catch (error) {
            alert(`Error processing file ${file.name}: ${error}`);
            console.error(`Error processing file ${file.name}:`, error);
            reject(error);
          }
        };
        reader.onerror = (error) => {
            alert(`Error reading file ${file.name}`);
            console.error(`Error reading file ${file.name}:`, error);
            reject(error);
        };
        reader.readAsText(file);
      });
      processingPromises.push(promise);
    }

    try {
      await Promise.all(processingPromises);

      if (files.length === 1 && firstVttContent) {
        // Single file: create direct download link and show preview
        const blob = new Blob([firstVttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = files[0].name.replace(/\.(json|srt)$/i, '.vtt');
        downloadLink.className =
          'inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-300 ease-in-out transform hover:scale-105';
        downloadLink.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download VTT file
        `;
        resultDiv.innerHTML = '';
        resultDiv.appendChild(downloadLink);

        // Show video preview section and load subtitles
        videoPreviewSection.classList.remove('hidden');
        if (currentTrack) {
          currentTrack.mode = 'disabled';
          const existingTrackElement = videoPlayer.querySelector('track');
          if (existingTrackElement) videoPlayer.removeChild(existingTrackElement);
          currentTrack = null;
        }
        const trackBlob = new Blob([firstVttContent], { type: 'text/vtt' });
        const trackUrl = URL.createObjectURL(trackBlob);
        const trackElement = document.createElement('track');
        trackElement.kind = 'subtitles';
        trackElement.label = 'Preview';
        trackElement.srclang = 'en';
        trackElement.src = trackUrl;
        trackElement.default = true;
        videoPlayer.appendChild(trackElement);
        currentTrack = videoPlayer.textTracks[videoPlayer.textTracks.length - 1];
        currentTrack.mode = 'showing';
        currentTrack.oncuechange = () => {
          subtitleDisplay.innerHTML = '';
          if (currentTrack && currentTrack.activeCues) {
            for (let j = 0; j < currentTrack.activeCues.length; j++) {
              const cue = currentTrack.activeCues[j] as VTTCue;
              const p = document.createElement('p');
              p.innerHTML = cue.text;
              subtitleDisplay.appendChild(p);
            }
          }
        };

      } else if (files.length > 1) {
         // Multiple files: create ZIP download link
        zip.generateAsync({ type: 'blob' }).then((content) => {
          const url = URL.createObjectURL(content);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'subtitles.zip';
          downloadLink.className =
            'inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-300 ease-in-out transform hover:scale-105';
          downloadLink.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download All VTT Files (ZIP)
          `;
          resultDiv.innerHTML = '';
          resultDiv.appendChild(downloadLink);
          videoPreviewSection.classList.add('hidden'); // Hide preview for batch
        });
      }
    } catch (error) {
      console.error('Error during batch processing or ZIP generation:', error);
      alert('An error occurred during batch processing. Check console for details.');
    }
  });

  videoUpload.addEventListener('change', () => {
    const videoFile = videoUpload.files?.[0];
    if (videoFile) {
      const videoURL = URL.createObjectURL(videoFile);
      videoPlayer.src = videoURL;
      // videoPlayer.play(); // Optional: auto-play uploaded video
    }
  });

});