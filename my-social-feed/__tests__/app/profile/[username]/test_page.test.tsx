import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import UserProfilePage from '@/app/profile/[username]/page';
import api from '@/lib/api';

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ username: 'alice' }),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children);
});

const mockProfile = {
  username: 'alice',
  bio: 'Alice bio',
  profile_picture_url: 'http://img.com/alice.jpg',
  posts: [
    {
      id: 1,
      text: 'Alice first post',
      username: 'alice',
      likes: 5, reposts: 2, shares: 1, saves: 0, laughs: 0,
      unix_timestamp: 1700000000,
      image_url: null, video_url: null, audio_url: null,
      profile_picture_url: null,
      post_metadata: { tags: ['hello'], tagged_users: [], location: 'LA' },
      replies_count: 0, quotes_count: 0, slop_count: 0,
    },
    {
      id: 2,
      text: 'Alice second post',
      username: 'alice',
      likes: 3, reposts: 0, shares: 0, saves: 0, laughs: 0,
      unix_timestamp: 1700000001,
      image_url: 'http://img.com/post2.jpg',
      video_url: 'http://vid.com/post2.mp4',
      audio_url: 'http://aud.com/post2.mp3',
      profile_picture_url: null,
      post_metadata: {},
      replies_count: 0, quotes_count: 0, slop_count: 0,
    },
  ],
};

describe('UserProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state before profile loads', async () => {
    mockedApi.get.mockReturnValue(new Promise(() => {})); // never resolves
    await act(async () => {
      render(<UserProfilePage />);
    });
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('renders user profile data', async () => {
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/alice.*Profile/)).toBeInTheDocument();
      expect(screen.getByText('Alice bio')).toBeInTheDocument();
    });
  });

  it('renders profile picture', async () => {
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      const imgs = screen.getAllByAltText('Profile');
      // The first Profile image is the large profile pic
      expect(imgs[0]).toHaveAttribute('src', 'http://img.com/alice.jpg');
    });
  });

  it('renders "No bio available." when bio is empty', async () => {
    mockedApi.get.mockResolvedValue({ data: { ...mockProfile, bio: '' } });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('No bio available.')).toBeInTheDocument();
    });
  });

  it('renders posts', async () => {
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Alice first post')).toBeInTheDocument();
      expect(screen.getByText('Alice second post')).toBeInTheDocument();
    });
  });

  it('renders "No posts yet." when no posts', async () => {
    mockedApi.get.mockResolvedValue({ data: { ...mockProfile, posts: [] } });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('No posts yet.')).toBeInTheDocument();
    });
  });

  it('renders media (image, video, audio) in posts', async () => {
    mockedApi.get.mockResolvedValue({ data: mockProfile });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByAltText('Post')).toBeInTheDocument();
      expect(document.querySelector('video')).toBeInTheDocument();
      expect(document.querySelector('audio')).toBeInTheDocument();
    });
  });

  it('toggles metadata expansion via PostCard', async () => {
    localStorage.setItem('token', 'test-token');
    // Use only the first post (which has metadata)
    mockedApi.get.mockResolvedValue({
      data: { ...mockProfile, posts: [mockProfile.posts[0]] },
    });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Show interactions')).toBeInTheDocument();
    });

    // Reveal PostActions
    await act(async () => {
      fireEvent.click(screen.getByText('Show interactions'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Toggle metadata'));
    });

    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.get.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('does not render large profile picture when not available', async () => {
    mockedApi.get.mockResolvedValue({
      data: { ...mockProfile, profile_picture_url: null, posts: [] },
    });

    await act(async () => {
      render(<UserProfilePage />);
    });

    await waitFor(() => {
      // No large profile pic at top (150x150), only PostCard avatars may exist
      const imgs = screen.queryAllByAltText('Profile');
      const largePic = imgs.find((img) => img.getAttribute('style')?.includes('150px'));
      expect(largePic).toBeUndefined();
    });
  });
});
