// filepath: /workspaces/json-to-vtt-caprinosol/src/main.test.ts
import { formatTime, convertJsonToVtt } from './app';

describe('formatTime', () => {
    it('should format time correctly', () => {
        expect(formatTime(0)).toBe('00:00:00.000');
        expect(formatTime(3661.123)).toBe('01:01:01.123');
    });
});

describe('convertJsonToVtt', () => {
    it('should convert JSON to VTT correctly', () => {
        const jsonData = {
            chunks: [
                { timestamp: [0, 2.5], text: 'Subtitle text here' },
                { start: 3, end: 5.5, text: 'Another subtitle' },
            ],
        };

        const expectedVtt = `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Subtitle text here

2
00:00:03.000 --> 00:00:05.500
Another subtitle

`;
        expect(convertJsonToVtt(jsonData)).toBe(expectedVtt);
    });

});