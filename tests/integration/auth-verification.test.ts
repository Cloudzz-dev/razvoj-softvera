import { describe, it, expect, vi, beforeEach } from 'vitest';


// Set required env var before importing route
process.env.NEXTAUTH_SECRET = 'test-secret';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

// Mock next-auth and providers
vi.mock("next-auth", () => ({
    default: vi.fn(),
}));

vi.mock("next-auth/providers/credentials", () => ({
    default: (config: any) => ({
        ...config,
        id: "credentials",
        name: "Email",
        type: "credentials",
    }),
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
        compare: vi.fn().mockResolvedValue(true),
    },
}));

describe('Auth Verification Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject login if email is not verified', async () => {
        // Import authOptions dynamically to ensure mocks are applied
        const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
        const { prisma } = await import('@/lib/prisma');


        // Extract the authorize function from CredentialsProvider
        // It's the 3rd provider in the list
        const credentialsProvider: any = authOptions.providers.find(
            (p: any) => p.id === 'credentials' || p.name === 'Email'
        );

        expect(credentialsProvider).toBeDefined();

        const authorize = credentialsProvider.authorize;

        // Mock user data
        const mockUser = {
            id: 'user-1',
            email: 'test@example.com',
            password: 'hashed_password',
            emailVerified: null, // Not verified
            name: 'Test User',
            role: 'DEVELOPER',
        };

        // Mock Prisma response
        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
        // bcrypt.compare is already mocked to return true by default

        // Attempt login
        const credentials = {
            email: 'test@example.com',
            password: 'password123',
        };

        // Expect it to throw "Email not verified"
        await expect(authorize(credentials)).rejects.toThrow('Email not verified');
    });

    it('should allow login if email is verified', async () => {
        const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
        const { prisma } = await import('@/lib/prisma');

        const credentialsProvider: any = authOptions.providers.find(
            (p: any) => p.id === 'credentials' || p.name === 'Email'
        );
        const authorize = credentialsProvider.authorize;

        const mockUser = {
            id: 'user-1',
            email: 'test@example.com',
            password: 'hashed_password',
            emailVerified: new Date(), // Verified
            name: 'Test User',
            role: 'DEVELOPER',
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

        const credentials = {
            email: 'test@example.com',
            password: 'password123',
        };

        const result = await authorize(credentials);

        expect(result).toEqual({
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
        });
    });
});
