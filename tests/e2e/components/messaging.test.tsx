import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationView } from '@/components/messaging/ConversationView';
import { MessageInbox } from '@/components/messaging/MessageInbox';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Send: () => <div data-testid="send-icon" />,
    Search: () => <div data-testid="search-icon" />,
    MoreVertical: () => <div data-testid="more-icon" />,
    Phone: () => <div data-testid="phone-icon" />,
    Video: () => <div data-testid="video-icon" />,
    Paperclip: () => <div data-testid="paperclip-icon" />,
    MessageSquare: () => <div data-testid="message-square-icon" />,
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: { user: { email: 'user1@example.com' } } }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Messaging Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('ConversationView', () => {
        const mockMessages = [
            { id: '1', sender: { email: 'user2@example.com', name: 'Other User' }, content: 'Hello', createdAt: new Date().toISOString() },
            { id: '2', sender: { email: 'user1@example.com', name: 'Me' }, content: 'Hi there', createdAt: new Date().toISOString() },
        ];

        const mockConversation = {
            id: 'conv1',
            participants: [{ id: 'user2', name: 'Other User', role: 'FOUNDER', avatar: 'AB' }]
        };

        it('renders messages after fetch', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ messages: mockMessages }),
            } as Response);

            render(
                <ConversationView
                    conversationId="conv1"
                    conversation={mockConversation}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Hello')).toBeInTheDocument();
                expect(screen.getByText('Hi there')).toBeInTheDocument();
            });

            await waitFor(() => {
                const elements = screen.getAllByText('Other User');
                expect(elements.length).toBeGreaterThan(0);
                expect(elements[0]).toBeInTheDocument();
            });
        });

        it('handles sending message', async () => {
            vi.mocked(global.fetch).mockImplementation((url) => {
                const urlString = url.toString();
                if (urlString.includes('/api/messages/send')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ id: '3', content: 'New message', createdAt: new Date().toISOString() })
                    } as Response);
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ messages: mockMessages })
                } as Response);
            });

            render(
                <ConversationView
                    conversationId="conv1"
                    conversation={mockConversation}
                />
            );

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText('Hello')).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('Type a message...');
            fireEvent.change(input, { target: { value: 'New message' } });

            const sendBtn = screen.getByTestId('send-icon').parentElement!;
            fireEvent.click(sendBtn);

            await waitFor(() => {
                expect(screen.getByText('New message')).toBeInTheDocument();
            });
        });
    });

    describe('MessageInbox', () => {
        const mockConversations = [
            {
                id: '1',
                participants: [{ id: 'user1', name: 'User 1', role: 'DEV', avatar: 'U1' }],
                lastMessage: { content: 'Last msg 1', createdAt: new Date().toISOString(), isFromMe: false },
                updatedAt: new Date().toISOString(),
                unread: 2
            },
            {
                id: '2',
                participants: [{ id: 'user2', name: 'User 2', role: 'INV', avatar: 'U2' }],
                lastMessage: { content: 'Last msg 2', createdAt: new Date().toISOString(), isFromMe: true },
                updatedAt: new Date().toISOString(),
                unread: 0
            },
        ];

        it('renders conversation list', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => mockConversations,
            } as Response);

            render(
                <MessageInbox
                    onSelectConversation={() => { }}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('User 1')).toBeInTheDocument();
                expect(screen.getByText('User 2')).toBeInTheDocument();
                expect(screen.getByText('Last msg 1')).toBeInTheDocument();
            });
        });

        it('handles selection', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => mockConversations,
            } as Response);

            const onSelect = vi.fn();
            render(
                <MessageInbox
                    onSelectConversation={onSelect}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('User 1')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('User 1'));
            expect(onSelect).toHaveBeenCalledWith('1');
        });
    });
});
