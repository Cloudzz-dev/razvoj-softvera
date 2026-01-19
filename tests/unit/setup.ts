import '@testing-library/jest-dom';
import { vi } from 'vitest';

process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.RESEND_API_KEY = 're_test_123';

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

vi.mock('next-auth', () => ({
    default: vi.fn(),
    getServerSession: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
    useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
    signIn: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
}));

// Mock LocalStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
