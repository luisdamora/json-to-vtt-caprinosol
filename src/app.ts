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

            vttContent += `${index + 1} `;
            vttContent += `${startTime} --> ${endTime} `;
            vttContent += `${chunk.text}\n\n`;
        }
    });

    return vttContent;
}