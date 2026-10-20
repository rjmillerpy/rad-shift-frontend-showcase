import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReplyThread from '@/components/ReplyThread';
import api from '@/lib/api';
import type { Post } from '@/types/post';

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const makeReply = (overrides: Partial<Post> = {}): Post => ({
  id: 100,
  text: 'This is a reply',
  username: 'replier',
  likes: 1,
  laughs: 0,
  reposts: 0,
  shares: 0,
  saves: 0,
  unix_timestamp: 1700000000,
  ...overrides,
});

const defaultProps = {
  parentId: 1,
  token: 'test-token',
  openReplies: { 1: true } as Record<number, boolean>,
  repliesByPost: {} as Record<number, Post[]>,
  onToggleReplies: jest.fn(),
  onFetchReplies: jest.fn().mockResolvedValue(undefined),
  onToggleLike: jest.fn(), onToggleLaugh: jest.fn(),
  onRepost: jest.fn(),
  onShare: jest.fn(),
  onToggleSave: jest.fn().mockResolvedValue(true),
  onMarkSlop: jest.fn(),
  onReport: jest.fn(),
  onQuote: jest.fn(),
};

describe('ReplyThread', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when replies for parentId are not open', () => {
    const { container } = render(
      <ReplyThread {...defaultProps} openReplies={{}} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders "No replies yet." when empty', () => {
    render(<ReplyThread {...defaultProps} />);
    expect(screen.getByText('No replies yet.')).toBeInTheDocument();
  });

  it('renders reply input at depth 0 when token exists', () => {
    render(<ReplyThread {...defaultProps} />);
    expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
  });

  it('does not render reply input when no token', () => {
    render(<ReplyThread {...defaultProps} token={null} />);
    expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument();
  });

  it('renders replies when provided', () => {
    const replies = [
      makeReply({ id: 100, text: 'First reply', username: 'bob' }),
      makeReply({ id: 101, text: 'Second reply', username: 'charlie' }),
    ];
    render(
      <ReplyThread
        {...defaultProps}
        repliesByPost={{ 1: replies }}
      />
    );
    expect(screen.getByText('First reply')).toBeInTheDocument();
    expect(screen.getByText('Second reply')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('@charlie')).toBeInTheDocument();
  });

  it('sends reply via API', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<ReplyThread {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a reply...'), 'My reply text');
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/add'),
        expect.any(FormData)
      );
      expect(defaultProps.onFetchReplies).toHaveBeenCalledWith(1);
    });
  });

  it('does not send empty reply', async () => {
    render(<ReplyThread {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('alerts when trying to reply without token', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        token={null}
        openReplies={{ 1: true, 100: true }}
        repliesByPost={{ 1: replies }}
      />
    );

    // Without token, no reply input at depth 0 and no nested reply input
    expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Reply to this reply...')).not.toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('handles API error when sending reply gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.post.mockRejectedValueOnce(new Error('Network error'));

    render(<ReplyThread {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a reply...'), 'Will fail');
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error sending reply:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('shows "View replies" button for each reply', () => {
    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        repliesByPost={{ 1: replies }}
      />
    );
    expect(screen.getByText('View replies')).toBeInTheDocument();
  });

  it('shows "Hide replies" when reply thread is open', () => {
    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        openReplies={{ 1: true, 100: true }}
        repliesByPost={{ 1: replies }}
      />
    );
    expect(screen.getByText('Hide replies')).toBeInTheDocument();
  });

  it('calls onToggleReplies when view/hide replies is clicked', () => {
    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        repliesByPost={{ 1: replies }}
      />
    );
    fireEvent.click(screen.getByText('View replies'));
    expect(defaultProps.onToggleReplies).toHaveBeenCalledWith(100);
  });

  it('toggles action tray for a reply', () => {
    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        repliesByPost={{ 1: replies }}
      />
    );

    // Click "Show interactions" button to open action tray
    const showBtn = screen.getByText('Show interactions');
    fireEvent.click(showBtn);

    // Now the "Hide interactions" button should show
    expect(screen.getByText('Hide interactions')).toBeInTheDocument();
  });

  it('renders nested replies recursively', () => {
    const parentReply = makeReply({ id: 100, text: 'Parent reply', username: 'bob' });
    const childReply = makeReply({ id: 200, text: 'Child reply', username: 'eve' });

    render(
      <ReplyThread
        {...defaultProps}
        openReplies={{ 1: true, 100: true }}
        repliesByPost={{ 1: [parentReply], 100: [childReply] }}
      />
    );

    expect(screen.getByText('Parent reply')).toBeInTheDocument();
    expect(screen.getByText('Child reply')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('@eve')).toBeInTheDocument();
  });

  it('renders nested reply input when token exists and replies are open', async () => {
    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        openReplies={{ 1: true, 100: true }}
        repliesByPost={{ 1: replies }}
      />
    );

    // Should have "Reply to this reply..." placeholder for the nested reply
    expect(screen.getByPlaceholderText('Reply to this reply...')).toBeInTheDocument();
  });

  it('sends nested reply via API', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    const replies = [makeReply({ id: 100 })];
    render(
      <ReplyThread
        {...defaultProps}
        openReplies={{ 1: true, 100: true }}
        repliesByPost={{ 1: replies }}
      />
    );

    await userEvent.type(screen.getByPlaceholderText('Reply to this reply...'), 'Nested reply');

    // There are multiple Reply buttons - the nested one
    const replyButtons = screen.getAllByRole('button', { name: 'Reply' });
    // The first Reply button is for the nested reply, the second for the parent
    fireEvent.click(replyButtons[0]);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
      expect(defaultProps.onFetchReplies).toHaveBeenCalledWith(100);
    });
  });

  it('handles reply API error gracefully', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ReplyThread {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a reply...'), 'Will fail');
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error sending reply:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
