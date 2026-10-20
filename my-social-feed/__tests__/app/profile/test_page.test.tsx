import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/app/profile/page';
import api from '@/lib/api';

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children);
});

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

const mockProfile = {
  username: 'testuser',
  bio: 'Hello bio',
  profile_picture_url: 'http://img.com/pic.jpg',
  posts: [
    {
      id: 1,
      text: 'My first post',
      username: 'testuser',
      likes: 2,
      reposts: 0,
      shares: 1,
      saves: 0,
      laughs: 0,
      unix_timestamp: 1700000000,
      image_url: 'http://img.com/post.jpg',
      video_url: null,
      audio_url: null,
      profile_picture_url: null,
      post_metadata: { tags: ['tag1'], tagged_users: ['bob'], location: 'NYC' },
      replies_count: 0,
      quotes_count: 0,
      slop_count: 0,
    },
  ],
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  it('shows login prompt when not logged in', async () => {
    await act(async () => {
      render(<ProfilePage />);
    });
    expect(screen.getByText(/Please/)).toBeInTheDocument();
    expect(screen.getByText('log in')).toBeInTheDocument();
  });

  it('renders profile data when logged in', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Your Profile')).toBeInTheDocument();
      expect(screen.getByText('My first post')).toBeInTheDocument();
    });
  });

  it('renders profile picture when available', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      const imgs = screen.getAllByAltText('Profile');
      expect(imgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows tab buttons (Posts, Saved, Drafts)', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('posts')).toBeInTheDocument();
      expect(screen.getByText('saved')).toBeInTheDocument();
      expect(screen.getByText('drafts')).toBeInTheDocument();
    });
  });

  it('switches to Saved tab', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: { ...mockProfile, posts: [] } });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('saved')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('saved'));
    });

    expect(screen.getByText('No saved posts yet.')).toBeInTheDocument();
  });

  it('switches to Drafts tab', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: { ...mockProfile, posts: [] } });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('drafts')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('drafts'));
    });

    expect(screen.getByText('No drafts yet.')).toBeInTheDocument();
  });

  it('shows "No posts yet." when posts are empty', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: { ...mockProfile, posts: [] } });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('No posts yet.')).toBeInTheDocument();
    });
  });

  it('handles bio update', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });
    mockedApi.put.mockResolvedValue({ data: {} });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Update Bio')).toBeInTheDocument();
    });

    const textarea = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'New bio text' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Update Bio'));
    });

    expect(mockedApi.put).toHaveBeenCalledWith(
      expect.stringContaining('/profile/me'),
      { bio: 'New bio text' }
    );
  });

  it('handles image upload', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });
    mockedApi.post.mockResolvedValue({ data: {} });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-data'], 'avatar.png', { type: 'image/png' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Upload'));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringContaining('/profile/me/upload-profile-pic'),
      expect.any(FormData),
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "multipart/form-data" }) })
    );
  });

  it('renders post image in posts tab', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      const postImg = screen.getByAltText('Post');
      expect(postImg).toBeInTheDocument();
    });
  });

  it('toggles metadata expansion on a post via PostCard', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    // Reveal PostActions first
    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    // Now toggle metadata
    await act(async () => {
      fireEvent.click(screen.getByTitle('Toggle metadata'));
    });

    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
  });

  it('renders saved posts in saved tab', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });

    // Profile fetch returns empty posts, saved fetch returns a post
    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/posts/saved')) {
        return Promise.resolve({
          data: {
            posts: [
              { id: 10, text: 'Saved post here', username: 'alice', likes: 0, reposts: 0, shares: 0, saves: 1, laughs: 0, unix_timestamp: 1700000000, image_url: null, video_url: null, audio_url: null, profile_picture_url: null, post_metadata: {}, replies_count: 0, quotes_count: 0, slop_count: 0 },
            ],
          },
        });
      }
      if (url.includes('/posts/drafts')) {
        return Promise.resolve({ data: { drafts: [] } });
      }
      return Promise.resolve({ data: { ...mockProfile, posts: [] } });
    });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('saved')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('saved'));
    });

    await waitFor(() => {
      expect(screen.getByText('Saved post here')).toBeInTheDocument();
    });
  });

  it('renders drafts and publishes them', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });

    mockedApi.get.mockImplementation((url: string) => {
      if (url.includes('/posts/drafts')) {
        return Promise.resolve({
          data: {
            drafts: [
              { id: 20, text: 'Draft post', username: 'testuser', likes: 0, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000, image_url: null, video_url: null, audio_url: null },
            ],
          },
        });
      }
      if (url.includes('/posts/saved')) {
        return Promise.resolve({ data: { posts: [] } });
      }
      return Promise.resolve({ data: { ...mockProfile, posts: [] } });
    });
    mockedApi.post.mockResolvedValue({ data: {} });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('drafts')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('drafts'));
    });

    await waitFor(() => {
      expect(screen.getByText('Draft post')).toBeInTheDocument();
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Publish'));
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.stringContaining('/posts/drafts/publish/20'),
      {}
    );
  });

  it('handles profile fetch error gracefully', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.get.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('renders video and audio in posts', async () => {
    mockLocalStorage._setStore({ token: 'my-token' });
    mockedApi.get.mockResolvedValue({
      data: {
        ...mockProfile,
        posts: [
          {
            id: 5,
            text: 'Media post',
            username: 'testuser',
            likes: 0,
            reposts: 0,
            shares: 0,
            saves: 0,
            laughs: 0,
            unix_timestamp: 1700000000,
            video_url: 'http://vid.com/v.mp4',
            audio_url: 'http://aud.com/a.mp3',
            image_url: null,
            profile_picture_url: null,
            post_metadata: {},
            replies_count: 0,
            quotes_count: 0,
            slop_count: 0,
          },
        ],
      },
    });

    await act(async () => {
      render(<ProfilePage />);
    });

    await waitFor(() => {
      expect(document.querySelector('video')).toBeInTheDocument();
      expect(document.querySelector('audio')).toBeInTheDocument();
    });
  });
});
