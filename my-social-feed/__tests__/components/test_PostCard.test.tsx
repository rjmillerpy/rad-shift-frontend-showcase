import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostCard from '@/components/PostCard';
import type { Post } from '@/types/post';

// Mock next/dynamic to render components synchronously in tests
jest.mock('next/dynamic', () => (loader: () => Promise<any>) => {
  const Component = require('@/components/ImageGallery').default;
  return Component;
});

// Mock only external boundaries (next.js framework, not internal components)
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
});
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  text: 'Hello world',
  username: 'alice',
  likes: 5,
  reposts: 2,
  shares: 1,
  saves: 0,
  laughs: 0,
  unix_timestamp: 1700000000,
  ...overrides,
});

const defaultProps = {
  index: 0,
  token: 'test-token',
  onToggleLike: jest.fn(),
  onRepost: jest.fn(),
  onShare: jest.fn(),
  onToggleSave: jest.fn().mockResolvedValue(true),
  onToggleLaugh: jest.fn(),
  onMarkSlop: jest.fn(),
  onReport: jest.fn(),
  onQuote: jest.fn(),
  onFollowToggle: jest.fn(),
  onToggleReplies: jest.fn(),
  onFetchReplies: jest.fn(),
  openReplies: {},
  repliesByPost: {},
};

describe('PostCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders post text and username', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('renders profile picture with polygon clip path', () => {
    render(<PostCard post={makePost({ profile_picture_url: 'http://img.com/pic.jpg' })} {...defaultProps} />);
    const img = screen.getByAltText('Profile');
    expect(img).toHaveStyle({
      clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
    });
  });

  it('uses default avatar when no profile picture', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    const img = screen.getByAltText('Profile');
    expect(img.getAttribute('src')).toContain('image-proxy');
  });

  it('renders image media', () => {
    render(<PostCard post={makePost({ image_url: 'http://img.com/pic.jpg' })} {...defaultProps} />);
    const img = screen.getByAltText('Post');
    expect(img).toBeInTheDocument();
  });

  it('renders video media', () => {
    render(<PostCard post={makePost({ video_url: 'http://vid.com/video.mp4' })} {...defaultProps} />);
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('renders audio media', () => {
    render(<PostCard post={makePost({ audio_url: 'http://audio.com/song.mp3' })} {...defaultProps} />);
    const audio = document.querySelector('audio');
    expect(audio).toBeInTheDocument();
  });

  it('renders quoted post', () => {
    const post = makePost({
      quoted_post: { id: 2, username: 'bob', text: 'Original post text' },
    });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByText('Quoting @bob')).toBeInTheDocument();
    expect(screen.getByText(/Original post text/)).toBeInTheDocument();
  });

  it('truncates long quoted post text', () => {
    const longText = 'A'.repeat(200);
    const post = makePost({
      quoted_post: { id: 2, username: 'bob', text: longText },
    });
    render(<PostCard post={post} {...defaultProps} />);
    // Should be truncated with ellipsis
    const quotedContent = screen.getByText(/A{10,}/);
    expect(quotedContent.textContent!.length).toBeLessThan(200);
  });

  it('renders follow button for other users when token exists', () => {
    const post = makePost({ is_me: false, is_followed_by_me: false });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByTitle('Follow')).toBeInTheDocument();
  });

  it('renders unfollow button when already followed', () => {
    const post = makePost({ is_me: false, is_followed_by_me: true });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByTitle('Unfollow')).toBeInTheDocument();
  });

  it('does not render follow button for own posts', () => {
    const post = makePost({ is_me: true });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.queryByTitle('Follow')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Unfollow')).not.toBeInTheDocument();
  });

  it('does not render follow button when no token', () => {
    const post = makePost({ is_me: false });
    render(<PostCard post={post} {...defaultProps} token={null} />);
    expect(screen.queryByTitle('Follow')).not.toBeInTheDocument();
  });

  it('calls onFollowToggle when follow button is clicked', () => {
    const post = makePost({ is_me: false, is_followed_by_me: false });
    render(<PostCard post={post} {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Follow'));
    expect(defaultProps.onFollowToggle).toHaveBeenCalledWith('alice', false);
  });

  it('renders reposted by info', () => {
    const post = makePost({ reposted_by: ['bob', 'charlie'] });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByText('Reposted by bob, charlie')).toBeInTheDocument();
  });

  it('renders metadata when toggled', () => {
    const post = makePost({
      post_metadata: {
        tags: ['tag1', 'tag2'],
        tagged_users: ['bob'],
        location: 'New York',
      },
    });

    // Metadata hidden initially — click Show interactions then Toggle metadata to reveal
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.queryByText('Tags:')).not.toBeInTheDocument();
    // Reveal PostActions, then toggle metadata
    fireEvent.click(screen.getByText('Show interactions'));
    fireEvent.click(screen.getByTitle('Toggle metadata'));
    expect(screen.getByText('Tags:')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    // unix_timestamp 1700000000 = some date
    const dateStr = new Date(1700000000 * 1000).toLocaleString();
    expect(screen.getByText(dateStr)).toBeInTheDocument();
  });

  it('renders "Show interactions" toggle button', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    expect(screen.getByText('Show interactions')).toBeInTheDocument();
    // Real PostActions should be hidden by default
    expect(screen.queryByTitle('Like')).not.toBeInTheDocument();
  });

  it('reveals real PostActions when "Show interactions" is clicked', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Show interactions'));
    // Real PostActions renders actual action buttons
    expect(screen.getByTitle('Like')).toBeInTheDocument();
    expect(screen.getByTitle('Repost')).toBeInTheDocument();
    expect(screen.getByText('Hide interactions')).toBeInTheDocument();
  });

  it('hides PostActions when "Hide interactions" is clicked', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Show interactions'));
    expect(screen.getByTitle('Like')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hide interactions'));
    expect(screen.queryByTitle('Like')).not.toBeInTheDocument();
  });

  it('renders ReplyThread for open replies', () => {
    render(<PostCard post={makePost()} {...defaultProps}
      openReplies={{ 1: true }}
      repliesByPost={{ 1: [] }}
    />);
    // Real ReplyThread shows "No replies yet." when empty and open
    expect(screen.getByText('No replies yet.')).toBeInTheDocument();
  });

  it('links username to profile page', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    const links = screen.getAllByRole('link');
    const profileLink = links.find(l => l.getAttribute('href') === '/profile/alice');
    expect(profileLink).toBeTruthy();
  });

  // ── Hover state tests ──────────────────────────────────────────────

  it('post text is wrapped in link to post detail', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    const textEl = screen.getByText('Hello world');
    const link = textEl.closest('a');
    expect(link).toHaveAttribute('href', '/post/1');
  });

  it('post text hover changes background', async () => {
    const user = userEvent.setup();
    render(<PostCard post={makePost()} {...defaultProps} />);
    const textEl = screen.getByText('Hello world');
    const link = textEl.closest('a')!;

    await user.hover(link);
    expect(textEl.style.background).toBe('rgb(240, 240, 240)');

    await user.unhover(link);
    expect(textEl.style.background).toBe('transparent');
  });

  it('quoted post hover changes background', async () => {
    const user = userEvent.setup();
    const post = makePost({
      quoted_post: { id: 2, username: 'bob', text: 'Original post text' },
    });
    render(<PostCard post={post} {...defaultProps} />);

    const quoteLink = screen.getByText(/Quoting @bob/).closest('a')!;
    await user.hover(quoteLink);
    await user.unhover(quoteLink);
    expect(screen.getByText(/Original post text/)).toBeInTheDocument();
  });

  it('quoted post link click does not propagate', () => {
    const post = makePost({
      quoted_post: { id: 2, username: 'bob', text: 'Original' },
    });
    render(<PostCard post={post} {...defaultProps} />);

    const quoteLink = screen.getByText(/Quoting @bob/).closest('a')!;
    fireEvent.click(quoteLink);
    expect(quoteLink).toHaveAttribute('href', '/post/2');
  });

  // ── Interaction handler tests ─────────────────────────────────────

  it('calls onToggleLike when like button is clicked', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Show interactions'));
    fireEvent.click(screen.getByTitle('Like'));
    expect(defaultProps.onToggleLike).toHaveBeenCalledWith(1);
  });

  it('calls onToggleLaugh when laugh button is clicked', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Show interactions'));
    fireEvent.click(screen.getByTitle('Laugh'));
    expect(defaultProps.onToggleLaugh).toHaveBeenCalledWith(1);
  });

  it('calls onRepost when repost button is clicked', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Show interactions'));
    fireEvent.click(screen.getByTitle('Repost'));
    expect(defaultProps.onRepost).toHaveBeenCalledWith(1);
  });

  it('calls onToggleReplies when reply button is clicked', () => {
    render(<PostCard post={makePost()} {...defaultProps} />);
    fireEvent.click(screen.getByText('Show interactions'));
    fireEvent.click(screen.getByTitle('Show replies'));
    expect(defaultProps.onToggleReplies).toHaveBeenCalledWith(1);
  });

  // ── Image gallery tests ───────────────────────────────────────────

  it('renders image gallery for multi-image posts', () => {
    const post = makePost({
      image_url: 'http://img.com/1.jpg',
      image_urls: ['http://img.com/1.jpg', 'http://img.com/2.jpg', 'http://img.com/3.jpg'],
    });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });

  it('renders single image for single-image posts', () => {
    const post = makePost({
      image_url: 'http://img.com/pic.jpg',
      image_urls: ['http://img.com/pic.jpg'],
    });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    expect(screen.getByAltText('Post')).toBeInTheDocument();
  });

  it('renders single image when image_urls is absent', () => {
    const post = makePost({ image_url: 'http://img.com/pic.jpg' });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    expect(screen.getByAltText('Post')).toBeInTheDocument();
  });

  // ── Scraped-post source badge + link card ─────────────────────────

  it('renders the source badge when source is present but no link_card', () => {
    const post = makePost({
      post_metadata: {
        source: {
          platform: 'reddit',
          name: 'r/python',
          url: 'https://reddit.com/r/python',
          label: 'Reddit · r/python',
        },
      },
    });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByText('Reddit · r/python')).toBeInTheDocument();
  });

  it('suppresses the standalone source badge when a link_card is present', () => {
    /* The themed LinkCard header already attributes the source, so the
     * separate PostSourceBadge would be visually redundant. */
    const post = makePost({
      post_metadata: {
        source: {
          platform: 'reddit',
          name: 'r/python',
          url: 'https://reddit.com/r/python',
          label: 'Reddit · r/python',
        },
        link_card: {
          url: 'https://reddit.com/r/python/comments/1',
          title: 'A great post',
          hostname: 'reddit.com',
        },
      },
    });
    render(<PostCard post={post} {...defaultProps} />);
    // The literal "Reddit · r/python" label only existed in the standalone badge
    expect(screen.queryByText('Reddit · r/python')).not.toBeInTheDocument();
    // The link card still surfaces the source name "r/python" in its themed header
    expect(screen.getByText('r/python')).toBeInTheDocument();
  });

  it('renders the link card with themed header when post_metadata.link_card is present', () => {
    const post = makePost({
      post_metadata: {
        source: {
          platform: 'web',
          name: 'Ycomb News',
          url: 'https://news.ycombinator.com',
          label: 'Ycomb News',
        },
        link_card: {
          url: 'https://news.ycombinator.com/item?id=1',
          title: 'A great submission',
          hostname: 'news.ycombinator.com',
          image: null,
        },
      },
    });
    render(<PostCard post={post} {...defaultProps} />);
    expect(screen.getByText('A great submission')).toBeInTheDocument();
    // HN theme badge letter
    expect(screen.getByText('Y')).toBeInTheDocument();
    expect(screen.getByText(/Open on Hacker News/)).toBeInTheDocument();
  });

  it('moves post text inside the link card and does not render it standalone', () => {
    /* Regression: scraped posts used to render the body as a separate <p>
     * above the link card, producing a "wall of text + card" duplication.
     * Now the body lives inside the card. */
    const post = makePost({
      text: 'A clean summary body that should appear inside the card.',
      post_metadata: {
        source: {
          platform: 'reddit',
          name: 'r/python',
          url: 'https://reddit.com/r/python',
          label: 'Reddit · r/python',
        },
        link_card: {
          url: 'https://reddit.com/r/python/comments/1',
          title: 'A clean summary body that should appear inside the card.',
          hostname: 'reddit.com',
        },
      },
    });
    render(<PostCard post={post} {...defaultProps} />);
    // Body text only appears once — inside the card; not duplicated outside.
    const matches = screen.queryAllByText('A clean summary body that should appear inside the card.');
    expect(matches.length).toBeLessThanOrEqual(2); // once as card title, once as card body if title === body
    // The body is rendered inside an anchor (the card link), not inside a <p> outside it.
    const bodyEl = matches[matches.length - 1];
    expect(bodyEl.closest('a[href*="reddit.com/r/python/comments/1"]')).not.toBeNull();
  });

  it('still renders post text as a standalone <p> for non-scraped posts', () => {
    const post = makePost({ text: 'Regular user post' });
    render(<PostCard post={post} {...defaultProps} />);
    const text = screen.getByText('Regular user post');
    // Plain user posts wrap the text in a Link to /post/{id}, NOT a source link
    expect(text.closest('a[href^="/post/"]')).not.toBeNull();
  });

  it('omits source badge and link card for plain user posts', () => {
    const post = makePost({ post_metadata: { tags: ['hello'] } });
    render(<PostCard post={post} {...defaultProps} />);
    // Sanity: post still renders
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    // No source label or hostname text leaked into the DOM
    expect(screen.queryByText(/Reddit ·/)).not.toBeInTheDocument();
  });
});
