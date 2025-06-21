import { formatTime, convertJsonToVtt, JsonData } from './app';

describe('formatTime', () => {
    it('should format 0 seconds correctly', () => {
        expect(formatTime(0)).toBe('00:00:00.000');
    });

    it('should format time with only seconds and milliseconds', () => {
        expect(formatTime(15.789)).toBe('00:00:15.789');
    });

    it('should format time with minutes, seconds, and milliseconds', () => {
        expect(formatTime(125.321)).toBe('00:02:05.321'); // 2 minutes, 5 seconds, 321 ms
    });

    it('should format time with hours, minutes, seconds, and milliseconds', () => {
        expect(formatTime(3661.123)).toBe('01:01:01.123'); // 1 hour, 1 minute, 1 second, 123 ms
    });

    it('should handle time at minute boundary', () => {
        expect(formatTime(60)).toBe('00:01:00.000');
    });

    it('should handle time at hour boundary', () => {
        expect(formatTime(3600)).toBe('01:00:00.000');
    });

    it('should handle fractional seconds that round down', () => {
        expect(formatTime(1.0004)).toBe('00:00:01.000');
    });

    it('should handle fractional seconds that round up correctly', () => {
        expect(formatTime(1.0009)).toBe('00:00:01.001'); // 1.0009 seconds is 1 second and 0.9 ms, rounded to 1 ms
    });

    it('should handle time just under a second', () => {
        expect(formatTime(0.999)).toBe('00:00:00.999');
    });
});

describe('convertJsonToVtt', () => {
    it('should convert basic JSON to VTT correctly using timestamp array', () => {
        const jsonData: JsonData = {
            chunks: [
                { timestamp: [0, 2.5], text: 'Subtitle text here' },
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Subtitle text here

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should convert JSON to VTT correctly using start/end properties', () => {
        const jsonData: JsonData = {
            chunks: [
                { start: 3, end: 5.5, text: 'Another subtitle' },
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:03.000 --> 00:00:05.500
Another subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should correctly number multiple cues', () => {
        const jsonData: JsonData = {
            chunks: [
                { timestamp: [0, 1], text: 'First' },
                { start: 1.5, end: 2.5, text: 'Second' },
                { timestamp: [3, 4], text: 'Third' },
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:00.000 --> 00:00:01.000
First

2
00:00:01.500 --> 00:00:02.500
Second

3
00:00:03.000 --> 00:00:04.000
Third

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });


    it('should handle empty chunks array', () => {
        const jsonData: JsonData = { chunks: [] };
        const expectedVtt = 'WEBVTT\n\n';
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks with missing text', () => {
        const jsonData: JsonData = {
            chunks: [
                // @ts-expect-error testing invalid input
                { timestamp: [0, 1] },
                { timestamp: [1, 2], text: 'Valid subtitle' }
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks with invalid timestamp (not an array)', () => {
        const jsonData: JsonData = {
            chunks: [
                { timestamp: 'invalid' as any, text: 'Will be skipped' }, // Cast timestamp to any
                { timestamp: [1, 2], text: 'Valid subtitle' }
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks with invalid timestamp (array wrong length)', () => {
        const jsonData: JsonData = {
            chunks: [
                { timestamp: [1] as any, text: 'Will be skipped' }, // Cast timestamp to any
                { timestamp: [1, 2, 3] as any, text: 'Will also be skipped' }, // Cast timestamp to any
                { timestamp: [3, 4], text: 'Valid subtitle' }
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:03.000 --> 00:00:04.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks with non-numeric values in timestamp', () => {
        const jsonData: JsonData = {
            chunks: [
                { timestamp: ['a', 'b'] as any, text: 'Will be skipped' }, // Cast timestamp to any
                { timestamp: [1, 2], text: 'Valid subtitle' }
            ],
        };
         const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks with invalid start/end (non-numeric)', () => {
        const jsonData: JsonData = {
            chunks: [
                { start: 'a' as any, end: 'b' as any, text: 'Will be skipped' }, // Cast start/end to any
                { start: 1, end: 2, text: 'Valid subtitle' }
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks with start time after end time', () => {
        const jsonData: JsonData = {
            chunks: [
                { start: 3, end: 1, text: 'Will be skipped' },
                { timestamp: [1, 2], text: 'Valid subtitle' } // Added a valid one to ensure VTT is generated
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should skip chunks missing all time information', () => {
        const jsonData: JsonData = {
            chunks: [
                { text: 'Will be skipped' },
                { timestamp: [1, 2], text: 'Valid subtitle' }
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Valid subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    it('should prioritize timestamp if both timestamp and start/end exist', () => {
        const jsonData: JsonData = {
            chunks: [
                { timestamp: [1, 2], start: 3, end: 4, text: 'Uses timestamp' },
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:01.000 --> 00:00:02.000
Uses timestamp

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });
});