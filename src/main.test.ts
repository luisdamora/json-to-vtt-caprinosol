import { convertJsonToVtt, formatTime, convertSrtToVtt } from './app';

describe('formatTime', () => {
    test('should format time correctly', () => {
        expect(formatTime(0)).toBe('00:00:00.000');
        expect(formatTime(1.5)).toBe('00:00:01.500');
        expect(formatTime(65.123)).toBe('00:01:05.123');
        expect(formatTime(3661.001)).toBe('01:01:01.001');
    });
});

describe('convertJsonToVtt', () => {
    test('should convert JSON data to VTT format', () => {
        const jsonData = {
            chunks: [
                { timestamp: [0, 2.5], text: 'Hello world' },
                { timestamp: [3, 5.123], text: 'This is a test' },
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Hello world

2
00:00:03.000 --> 00:00:05.123
This is a test

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

    test('should handle alternative timestamp format', () => {
        const jsonData = {
            chunks: [
                { start: 0, end: 2.5, text: 'Hello world' },
                { start: 3, end: 5.123, text: 'This is a test' },
            ],
        };
        const expectedVtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Hello world

2
00:00:03.000 --> 00:00:05.123
This is a test

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });


    test('should handle empty chunks array', () => {
        const jsonData = { chunks: [] };
        const expectedVtt = 'WEBVTT\n\n';
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });
});

describe('convertSrtToVtt', () => {
    test('should convert SRT data to VTT format', () => {
        const srtData = `
1
00:00:00,000 --> 00:00:02,500
Hello world

2
00:00:03,000 --> 00:00:05,123
This is a test
`;
        const expectedVtt = `WEBVTT

00:00:00.000 --> 00:00:02.500
Hello world

00:00:03.000 --> 00:00:05.123
This is a test

`;
        expect(convertSrtToVtt(srtData)).toBe(expectedVtt);
    });

    test('should handle SRT data with multiple lines of text', () => {
        const srtData = `
1
00:00:00,000 --> 00:00:02,500
Hello world
This is line 2

2
00:00:03,000 --> 00:00:05,123
This is a test
This is also line 2
`;
        const expectedVtt = `WEBVTT

00:00:00.000 --> 00:00:02.500
Hello world
This is line 2

00:00:03.000 --> 00:00:05.123
This is a test
This is also line 2

`;
        expect(convertSrtToVtt(srtData)).toBe(expectedVtt);
    });

    test('should handle empty SRT data', () => {
        const srtData = '';
        const expectedVtt = 'WEBVTT\n\n';
        expect(convertSrtToVtt(srtData)).toBe(expectedVtt);
    });

    test('should handle SRT data with only whitespace', () => {
        const srtData = '   \n\n   ';
        const expectedVtt = 'WEBVTT\n\n';
        expect(convertSrtToVtt(srtData)).toBe(expectedVtt);
    });

    test('should handle malformed SRT data gracefully', () => {
        const srtData = `
1
00:00:00,000 --> 00:00:02,500
Hello world

This is a malformed entry

2
00:00:03,000 --> 00:00:05,123
This is a test
`;
        const expectedVtt = `WEBVTT

00:00:00.000 --> 00:00:02.500
Hello world

00:00:03.000 --> 00:00:05.123
This is a test

`;
        expect(convertSrtToVtt(srtData)).toBe(expectedVtt);
    });
});