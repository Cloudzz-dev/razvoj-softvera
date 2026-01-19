import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/unit/setup.ts'],
        include: [
            'tests/unit/**/*.test.ts',
            'tests/unit/**/*.test.tsx',
            'tests/integration/**/*.test.ts',
            'tests/integration/**/*.test.tsx',
            'tests/e2e/**/*.test.ts',
            'tests/e2e/**/*.test.tsx',
        ],
        exclude: ['node_modules', 'dist', '.next', '.git'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary'],
            include: ['lib/**/*.ts', 'components/**/*.tsx', 'app/**/*.ts', 'app/**/*.tsx'],
            exclude: ['node_modules', 'tests', '.next', 'dist'],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '.'),
        },
    },
});
