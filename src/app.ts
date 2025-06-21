export interface Chunk {
    timestamp?: number[];
    start?: number;
    end?: number;
    text: string;
}

export interface JsonData {
    chunks: Chunk[];
}

export function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
    )}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function convertJsonToVtt(jsonData: JsonData): string {
    let vttContent = 'WEBVTT\n\n';

    jsonData.chunks.forEach((chunk, index) => {
        if (!chunk.timestamp && chunk.start !== undefined && chunk.end !== undefined) {
            chunk.timestamp = [chunk.start, chunk.end];
        }

        if (chunk.timestamp && chunk.timestamp.length === 2) {
            const startTime = formatTime(chunk.timestamp[0]);
            const endTime = formatTime(chunk.timestamp[1]);

            vttContent += `${index + 1}\n`;
            vttContent += `${startTime} --> ${endTime}\n`;
            vttContent += `${chunk.text}\n\n`;
        }
    });

    return vttContent;
}

export function convertSrtToVtt(srtContent: string): string {
    const lines = srtContent.trim().split(/\r?\n/);
    let vttContent = 'WEBVTT\n\n';
    let i = 0;

    while (i < lines.length) {
        // Skip empty lines or lines with only whitespace
        if (lines[i].trim() === '') {
            i++;
            continue;
        }

        // Read subtitle number (optional in VTT, so we can ignore it or use it for validation)
        const subtitleNumber = lines[i++].trim();
        if (!subtitleNumber) continue; // End of file or malformed

        // Read timecodes
        if (i >= lines.length || !lines[i].includes('-->')) {
            console.warn(`Skipping malformed SRT block starting with number: ${subtitleNumber}. Missing timecodes.`);
            // Fast-forward to the next potential block start or empty line
            while (i < lines.length && lines[i].trim() !== '') {
                i++;
            }
            continue;
        }
        const timecodes = lines[i++].trim();

        // Read text lines
        let textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i].trim());
            i++;
        }

        // Add to VTT content
        vttContent += `${timecodes.replace(/,/g, '.')}\n`; // SRT uses comma for ms, VTT uses dot
        vttContent += `${textLines.join('\n')}\n\n`;

        // Skip any blank lines between subtitles
        while (i < lines.length && lines[i].trim() === '') {
            i++;
        }
    }

    return vttContent;
}