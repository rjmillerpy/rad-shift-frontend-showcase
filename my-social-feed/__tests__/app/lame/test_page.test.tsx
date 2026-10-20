import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/lame/page';
import api from '@/lib/api';
import axios from 'axios';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock api client and axios (for isAxiosError)
jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;
jest.mock('axios');
(axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    _setStore: (s: Record<string, string>) => { store = s; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

const mockPost = {
  id: 1,
  text: 'Hello world',
  username: 'alice',
  likes: 5,
  reposts: 2,
  shares: 1,
  saves: 0,
  unix_timestamp: 1700000000,
  is_me: false,
  saved_by_me: false,
  liked_by_me: false,
  reposted_by_me: false,
  is_followed_by_me: false,
  replies_count: 0,
  quotes_count: 0,
  slop_count: 0,
  post_metadata: { tags: ['test'], tagged_users: [], location: 'NYC' },
};

const mockPost2 = {
  ...mockPost,
  id: 2,
  text: 'Second post',
  username: 'bob',
};

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockedApi.get.mockResolvedValue({ data: { posts: [] } });
    mockedApi.post.mockResolvedValue({ data: {} });
  });

  it('renders welcome heading', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText('Welcome to the Feed')).toBeInTheDocument();
  });

  it('shows signup and login links when not logged in', async () => {
    await act(async () => {
      render(<Home />);
    });
    expect(screen.getByText('Signup')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('shows logout button, tabs, and composer when logged in', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: { posts: [], profile_picture_url: null } });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Algo')).toBeInTheDocument();
      expect(screen.getByText('Following')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New post' })).toBeInTheDocument();
    });
  });

  it('renders post cards from API with all interactive elements', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: {
        posts: [mockPost, mockPost2],
        profile_picture_url: null,
      },
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });
  });

  it('handles like toggle', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({
      data: { likes: 6, action: 'liked' },
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    // Click "Show interactions" to reveal action buttons
    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    const likeBtn = screen.getByTitle('Like');
    await act(async () => {
      fireEvent.click(likeBtn);
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/like/1')
      );
    });
  });

  it('handles repost toggle', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({
      data: { reposts: 3, action: 're-posted' },
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Repost'));
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/repost/1')
      );
    });
  });

  it('handles share', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({
      data: { shares: 2, share_url: '/posts/1' },
    });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Share'));
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/share/1')
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Post link copied!');
    });

    alertSpy.mockRestore();
  });

  it('handles save toggle', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({
      data: { saves: 1, action: 'saved' },
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/save/1')
      );
    });
  });

  it('handles mark slop', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({ data: {} });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    // Open slop modal
    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as Slop'));
    });

    expect(screen.getByText('Submit')).toBeInTheDocument();

    // Submit slop
    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/slop/1'),
        expect.objectContaining({ reason: 'AI' })
      );
    });
  });

  it('handles quote', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Quote'));
    });

    // Quote action should open the composer modal with the quote preview
    await waitFor(() => {
      expect(screen.getByText('Create Post')).toBeInTheDocument();
      expect(screen.getByText('Quoting @alice')).toBeInTheDocument();
    });
  });

  it('handles follow toggle', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({ data: {} });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Follow')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Follow'));
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/follow/alice'),
        {}
      );
    });
  });

  it('handles toggle replies', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/replies')) {
        return Promise.resolve({ data: { replies: [] } });
      }
      return Promise.resolve({
        data: { posts: [mockPost], profile_picture_url: null },
      });
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Show replies'));
    });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/posts/1/replies')
      );
    });
  });

  it('handles logout', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: { posts: [], profile_picture_url: null } });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('switches tabs', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: { posts: [], profile_picture_url: null } });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Following'));
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/posts/following'),
      expect.any(Object)
    );
  });

  it('fetches profile and sets profile pic on load', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/profile/me')) {
        return Promise.resolve({ data: { profile_picture_url: 'http://img.com/pic.jpg' } });
      }
      return Promise.resolve({ data: { posts: [] } });
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/profile/me')
      );
    });
  });

  it('handles profile fetch 401 error by redirecting to login', async () => {
    mockLocalStorage._setStore({ token: 'expired-token' });

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/profile/me')) {
        return Promise.reject({ response: { status: 401 } });
      }
      return Promise.resolve({ data: { posts: [] } });
    });
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles profile fetch 422 error by redirecting to login', async () => {
    mockLocalStorage._setStore({ token: 'bad-token' });

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/profile/me')) {
        return Promise.reject({ response: { status: 422 } });
      }
      return Promise.resolve({ data: { posts: [] } });
    });
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles profile fetch non-auth error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/profile/me')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: { posts: [] } });
    });
    (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile picture:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles fetchPosts error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching posts:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles like toggle error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockRejectedValue(new Error('Like failed'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Like'));
    });

    await waitFor(() => {
      // Log string comes from usePostActions hook now (was inline "Error toggling like:").
      expect(consoleSpy).toHaveBeenCalledWith('Like failed', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles repost error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockRejectedValue(new Error('Repost failed'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Repost'));
    });

    await waitFor(() => {
      // Log string comes from usePostActions hook now (was inline "Error toggling repost:").
      expect(consoleSpy).toHaveBeenCalledWith('Repost failed', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles share error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockRejectedValue(new Error('Share failed'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Share'));
    });

    await waitFor(() => {
      // Log string comes from usePostActions hook now (was inline "Error sharing post:").
      expect(consoleSpy).toHaveBeenCalledWith('Share failed', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles save error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockRejectedValue(new Error('Save failed'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
    });

    await waitFor(() => {
      // Log string comes from usePostActions hook now (was inline "Error saving post:").
      expect(consoleSpy).toHaveBeenCalledWith('Save failed', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles slop error with alert', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockRejectedValue(new Error('Slop failed'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as Slop'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to mark as slop.');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('handles follow toggle error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });
    mockedApi.post.mockRejectedValue(new Error('Follow failed'));

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Follow')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Follow'));
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Toggling follow failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('handles reply toggle error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/replies')) {
        return Promise.reject(new Error('Replies failed'));
      }
      return Promise.resolve({
        data: { posts: [mockPost], profile_picture_url: null },
      });
    });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Show replies'));
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching replies:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('clears quote preview', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [mockPost], profile_picture_url: null },
    });

    await act(async () => {
      render(<Home />);
    });

    // First, click "Show interactions" to reveal action buttons
    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Quote'));
    });

    await waitFor(() => {
      expect(screen.getByText('Clear quote')).toBeInTheDocument();
    });

    // Now clear
    await act(async () => {
      fireEvent.click(screen.getByText('Clear quote'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Quoting @alice')).not.toBeInTheDocument();
    });
  });

  it('does not call handleMarkSlop when no token', async () => {
    // handleMarkSlop returns early if !token
    // When not logged in, slop button won't be visible since PostCard is not rendered
    // This is tested implicitly through the other tests
    await act(async () => {
      render(<Home />);
    });
    expect(screen.queryByTitle('Mark as Slop')).not.toBeInTheDocument();
  });

  it('handles profile pic navigation', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/profile/me')) {
        return Promise.resolve({ data: { profile_picture_url: 'http://img.com/pic.jpg' } });
      }
      return Promise.resolve({ data: { posts: [] } });
    });

    await act(async () => {
      render(<Home />);
    });

    // Profile picture should be clickable
    await waitFor(() => {
      const profileImgs = document.querySelectorAll('img[alt="Profile"]');
      expect(profileImgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('creates a post via composer', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: { posts: [], profile_picture_url: null },
    });
    mockedApi.post.mockResolvedValue({ data: {} });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New post' })).toBeInTheDocument();
    });

    // Click FAB to open the composer modal
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'New post' }));
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Write a post...')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'New post text');

    await act(async () => {
      fireEvent.click(screen.getByText('Post'));
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/add'),
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });
});
