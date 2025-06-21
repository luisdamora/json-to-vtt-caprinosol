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
    // Round milliseconds to handle floating point inaccuracies
    const ms = Math.round((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
    )}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function convertJsonToVtt(jsonData: JsonData): string {
    let vttContent = 'WEBVTT\n\n';
    let cueIndex = 1;

    if (!jsonData || !Array.isArray(jsonData.chunks)) {
        // Or throw an error, depending on desired handling for fundamentally malformed JSON
        return vttContent;
    }

    jsonData.chunks.forEach((chunk) => {
        let startTimeVal: number | undefined;
        let endTimeVal: number | undefined;

        // Validate chunk structure and content
        if (typeof chunk.text !== 'string' || chunk.text.trim() === '') {
            // console.warn('Skipping chunk due to missing or empty text:', chunk);
            return; // Skip chunk if text is missing or empty
        }

        if (Array.isArray(chunk.timestamp) && chunk.timestamp.length === 2 &&
            typeof chunk.timestamp[0] === 'number' && typeof chunk.timestamp[1] === 'number' &&
            !isNaN(chunk.timestamp[0]) && !isNaN(chunk.timestamp[1]) &&
            chunk.timestamp[0] <= chunk.timestamp[1]) {
            startTimeVal = chunk.timestamp[0];
            endTimeVal = chunk.timestamp[1];
        } else if (typeof chunk.start === 'number' && typeof chunk.end === 'number' &&
                   !isNaN(chunk.start) && !isNaN(chunk.end) &&
                   chunk.start <= chunk.end) {
            // This path is taken if timestamp is invalid or not present, but start/end are valid
            if (Array.isArray(chunk.timestamp)) { // if timestamp was present but invalid
                 // console.warn('Invalid or incomplete timestamp, attempting to use start/end:', chunk.timestamp)
            }
            startTimeVal = chunk.start;
            endTimeVal = chunk.end;
        } else {
            // console.warn('Skipping chunk due to invalid or missing time information:', chunk);
            return; // Skip chunk if no valid time information
        }

        // Final check if we got valid time values
        if (startTimeVal === undefined || endTimeVal === undefined) {
            // console.warn('Skipping chunk due to unresolved time information:', chunk);
            return;
        }

        const startTime = formatTime(startTimeVal);
        const endTime = formatTime(endTimeVal);

        vttContent += `${cueIndex}\n`;
        vttContent += `${startTime} --> ${endTime}\n`;
        vttContent += `${chunk.text.trim()}\n\n`; // Trim text just in case
        cueIndex++;
    });

    return vttContent;
}