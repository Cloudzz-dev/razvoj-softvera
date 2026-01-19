import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, sanitizeMessage } from '@/lib/sanitize';

/**
 * Test Suite: XSS Prevention via DOMPurify Sanitization
 * 
 * Verifies that all sanitization functions properly prevent XSS attacks
 * by stripping dangerous HTML tags, scripts, and event handlers.
 * 
 * Security Issue: Unsanitized user input can lead to Cross-Site Scripting (XSS) attacks,
 * allowing attackers to inject malicious scripts into the application.
 */

describe('XSS Prevention - DOMPurify Sanitization', () => {
    describe('sanitizeHtml', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("xss")</script>Hello World';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('<script>');
            expect(output).not.toContain('alert');
            expect(output).toBe('Hello World');
        });

        it('should remove script tags with various casings', () => {
            const input = '<ScRiPt>alert("xss")</ScRiPt>Safe text';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('ScRiPt');
            expect(output).not.toContain('alert');
            expect(output).toBe('Safe text');
        });

        it('should remove inline event handlers', () => {
            const input = '<div onclick="alert(\'xss\')">Click me</div>';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('onclick');
            expect(output).not.toContain('alert');
        });

        it('should remove iframe tags', () => {
            const input = '<iframe src="evil.com"></iframe>Text';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('<iframe');
            expect(output).not.toContain('evil.com');
            expect(output).toBe('Text');
        });

        it('should remove embed tags', () => {
            const input = '<embed src="malware.exe">Content';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('<embed');
            expect(output).not.toContain('malware.exe');
            expect(output).toBe('Content');
        });

        it('should remove object tags', () => {
            const input = '<object data="malicious.swf"></object>Text';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('<object');
            expect(output).not.toContain('malicious');
            expect(output).toBe('Text');
        });

        it('should remove all HTML tags (ALLOWED_TAGS is empty)', () => {
            const input = '<div><p>Text <strong>bold</strong></p></div>';
            const output = sanitizeHtml(input);

            // No HTML tags should remain
            expect(output).not.toContain('<div>');
            expect(output).not.toContain('<p>');
            expect(output).not.toContain('<strong>');
            expect(output).toBe('Text bold');
        });

        it('should handle javascript: protocol in links', () => {
            const input = '<a href="javascript:alert(\'xss\')">Click</a>';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('javascript:');
            expect(output).not.toContain('alert');
        });

        it('should handle data: URIs', () => {
            const input = '<img src="data:text/html,<script>alert(\'xss\')</script>">';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('data:');
            expect(output).not.toContain('<script>');
        });

        it('should remove onerror handlers', () => {
            const input = '<img src="x" onerror="alert(\'xss\')">';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('onerror');
            expect(output).not.toContain('alert');
        });
    });

    describe('sanitizeText', () => {
        it('should remove HTML and trim whitespace', () => {
            const input = '  <div>Hello</div>  ';
            const output = sanitizeText(input);

            expect(output).toBe('Hello');
            expect(output).not.toContain('<div>');
        });

        it('should remove script tags from text', () => {
            const input = '<script>alert("xss")</script>Clean text';
            const output = sanitizeText(input);

            expect(output).toBe('Clean text');
            expect(output).not.toContain('<script>');
            expect(output).not.toContain('alert');
        });

        it('should trim leading and trailing whitespace', () => {
            const input = '\n\n   Text with spaces   \n\n';
            const output = sanitizeText(input);

            expect(output).toBe('Text with spaces');
        });

        it('should handle empty strings', () => {
            const input = '';
            const output = sanitizeText(input);

            expect(output).toBe('');
        });

        it('should handle only whitespace', () => {
            const input = '   \n\n\t   ';
            const output = sanitizeText(input);

            expect(output).toBe('');
        });

        it('should handle mixed HTML and text', () => {
            const input = 'Start <b>bold <i>italic</i></b> end';
            const output = sanitizeText(input);

            expect(output).toBe('Start bold italic end');
        });
    });

    describe('sanitizeMessage', () => {
        it('should remove all HTML tags from messages', () => {
            const input = 'Hello <b>World</b>';
            const output = sanitizeMessage(input);

            expect(output).not.toContain('<b>');
            expect(output).toBe('Hello World');
        });

        it('should remove script tags from messages', () => {
            const input = 'Message <script>alert("xss")</script> content';
            const output = sanitizeMessage(input);

            expect(output).not.toContain('<script>');
            expect(output).not.toContain('alert');
            expect(output).toBe('Message  content');
        });

        it('should trim whitespace from messages', () => {
            const input = '  Message content  ';
            const output = sanitizeMessage(input);

            expect(output).toBe('Message content');
        });

        it('should handle messages with only HTML tags', () => {
            const input = '<div><p></p></div>';
            const output = sanitizeMessage(input);

            expect(output).toBe('');
        });

        it('should remove event handlers from messages', () => {
            const input = '<span onmouseover="alert(\'xss\')">Hover me</span>';
            const output = sanitizeMessage(input);

            expect(output).not.toContain('onmouseover');
            expect(output).not.toContain('alert');
            expect(output).toBe('Hover me');
        });

        it('should handle messages with newlines', () => {
            const input = 'Line 1\nLine 2\nLine 3';
            const output = sanitizeMessage(input);

            // Newlines should be preserved
            expect(output).toContain('Line 1');
            expect(output).toContain('Line 2');
            expect(output).toContain('Line 3');
        });

        it('should remove HTML but preserve structure in multiline messages', () => {
            const input = 'Line 1 <b>bold</b>\nLine 2 <i>italic</i>';
            const output = sanitizeMessage(input);

            expect(output).not.toContain('<b>');
            expect(output).not.toContain('<i>');
            expect(output).toContain('bold');
            expect(output).toContain('italic');
        });
    });

    describe('Advanced XSS Vectors', () => {
        it('should handle encoded script tags', () => {
            const input = '&lt;script&gt;alert("xss")&lt;/script&gt;Text';
            const output = sanitizeText(input);

            // DOMPurify should handle encoded entities - output should be safe (no unescaped <script>)
            expect(output).not.toContain('<script>');
        });

        it('should handle SVG-based XSS', () => {
            const input = '<svg onload="alert(\'xss\')"></svg>';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('onload');
            expect(output).not.toContain('alert');
        });

        it('should handle nested script tags', () => {
            const input = '<div><div><script>alert("nested")</script></div></div>';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('<script>');
            expect(output).not.toContain('alert');
        });

        it('should handle style tags with expressions', () => {
            const input = '<style>body{background:url("javascript:alert(\'xss\')")}</style>';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('javascript:');
            expect(output).not.toContain('alert');
        });

        it('should handle meta refresh redirects', () => {
            const input = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'xss\')">';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('javascript:');
            expect(output).not.toContain('alert');
        });

        it('should handle form action XSS', () => {
            const input = '<form action="javascript:alert(\'xss\')"><input type="submit"></form>';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('javascript:');
            expect(output).not.toContain('alert');
        });

        it('should handle base64 encoded XSS', () => {
            const input = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=">';
            const output = sanitizeHtml(input);

            expect(output).not.toContain('base64');
            expect(output).not.toContain('<img');
        });
    });

    describe('Edge Cases', () => {
        it('should handle null-like values gracefully', () => {
            // DOMPurify will convert these to strings
            expect(() => sanitizeText('')).not.toThrow();
        });

        it('should handle very long input strings', () => {
            const longString = 'a'.repeat(10000) + '<script>alert("xss")</script>';
            const output = sanitizeHtml(longString);

            expect(output).not.toContain('<script>');
            expect(output.length).toBeGreaterThan(9000);
        });

        it('should handle unicode characters', () => {
            const input = '你好 <script>alert("xss")</script> 世界';
            const output = sanitizeText(input);

            expect(output).toBe('你好  世界');
            expect(output).not.toContain('<script>');
        });

        it('should handle emoji', () => {
            const input = 'Hello 👋 <script>alert("xss")</script> World 🌍';
            const output = sanitizeText(input);

            expect(output).toContain('👋');
            expect(output).toContain('🌍');
            expect(output).not.toContain('<script>');
        });
    });
});
