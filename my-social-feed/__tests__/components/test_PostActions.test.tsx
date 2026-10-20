import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostActions from '@/components/PostActions';

// Mock html2canvas dynamic import
jest.mock('html2canvas', () => {
  const mockCanvas = {
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockdata'),
  };
  return jest.fn().mockResolvedValue(mockCanvas);
});

// Mock HTMLCanvasElement.getContext for avatar replacement
const mockCanvasCtx = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  clip: jest.fn(),
  drawImage: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCanvasCtx);
HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,canvasdata');

// Mock getBoundingClientRect for image elements
HTMLImageElement.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
  width: 60,
  height: 60,
  top: 0,
  left: 0,
  bottom: 60,
  right: 60,
  x: 0,
  y: 0,
  toJSON: () => {},
});

const defaultProps = {
  postId: 1,
  index: 0,
  posterUsername: 'testuser',
  likedByMe: false,
  repostedByMe: false,
  savedByMe: false,
  counts: {
    likes: 10,
    reposts: 5,
    shares: 3,
    saves: 2,
    laughs: 4,
    replies: 7,
    quotes: 1,
    slop: 0,
  },
  hasMetadata: true,
  metadataExpanded: false,
  onToggleMetadata: jest.fn(),
  onToggleLike: jest.fn(),
  onRepost: jest.fn(),
  onShare: jest.fn(),
  onToggleSave: jest.fn().mockResolvedValue(true),
  onToggleLaugh: jest.fn(),
  captureElementId: 'post-1',
  onMarkSlop: jest.fn(),
  onReport: jest.fn(),
  onQuote: jest.fn(),
  onToggleReplies: jest.fn(),
};

describe('PostActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons', () => {
    render(<PostActions {...defaultProps} />);
    expect(screen.getByTitle('Toggle metadata')).toBeInTheDocument();
    expect(screen.getByTitle('Repost')).toBeInTheDocument();
    expect(screen.getByTitle('Like')).toBeInTheDocument();
    expect(screen.getByTitle('Share')).toBeInTheDocument();
    expect(screen.getByTitle('Save (and download media/screenshot)')).toBeInTheDocument();
    expect(screen.getByTitle('Mark as Slop')).toBeInTheDocument();
    expect(screen.getByTitle('Quote')).toBeInTheDocument();
    expect(screen.getByTitle('Show replies')).toBeInTheDocument();
  });

  it('hides tag button when hasMetadata is false', () => {
    render(<PostActions {...defaultProps} hasMetadata={false} />);
    expect(screen.queryByTitle('Toggle metadata')).not.toBeInTheDocument();
  });

  it('hides like button when hideLike is true', () => {
    render(<PostActions {...defaultProps} hideLike />);
    expect(screen.queryByTitle('Like')).not.toBeInTheDocument();
  });

  it('hides repost button when hideRepost is true', () => {
    render(<PostActions {...defaultProps} hideRepost />);
    expect(screen.queryByTitle('Repost')).not.toBeInTheDocument();
  });

  it('hides share button when hideShare is true', () => {
    render(<PostActions {...defaultProps} hideShare />);
    expect(screen.queryByTitle('Share')).not.toBeInTheDocument();
  });

  it('hides save button when hideSave is true', () => {
    render(<PostActions {...defaultProps} hideSave />);
    expect(screen.queryByTitle('Save (and download media/screenshot)')).not.toBeInTheDocument();
  });

  it('hides slop button when hideSlop is true', () => {
    render(<PostActions {...defaultProps} hideSlop />);
    expect(screen.queryByTitle('Mark as Slop')).not.toBeInTheDocument();
  });

  it('hides quote button when hideQuote is true', () => {
    render(<PostActions {...defaultProps} hideQuote />);
    expect(screen.queryByTitle('Quote')).not.toBeInTheDocument();
  });

  it('hides quote button when onQuote is not provided', () => {
    render(<PostActions {...defaultProps} onQuote={undefined} />);
    expect(screen.queryByTitle('Quote')).not.toBeInTheDocument();
  });

  it('hides replies button when onToggleReplies is not provided', () => {
    render(<PostActions {...defaultProps} onToggleReplies={undefined} />);
    expect(screen.queryByTitle('Show replies')).not.toBeInTheDocument();
  });

  it('displays counts for all actions', () => {
    render(<PostActions {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument(); // likes
    expect(screen.getByText('4')).toBeInTheDocument();  // laughs
    expect(screen.getByText('5')).toBeInTheDocument();  // reposts
    expect(screen.getByText('3')).toBeInTheDocument();  // shares
    expect(screen.getByText('2')).toBeInTheDocument();  // saves
    expect(screen.getByText('7')).toBeInTheDocument();  // replies
    expect(screen.getByText('1')).toBeInTheDocument();  // quotes
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);  // slop
  });

  it('hides all counts when hideCounts is true', () => {
    render(<PostActions {...defaultProps} hideCounts />);
    expect(screen.queryByText('10')).not.toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('calls onToggleLike when like button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Like'));
    expect(defaultProps.onToggleLike).toHaveBeenCalledWith(1);
  });

  it('renders laugh button', () => {
    render(<PostActions {...defaultProps} />);
    expect(screen.getByTitle('Laugh')).toBeInTheDocument();
  });

  it('calls onToggleLaugh when laugh button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Laugh'));
    expect(defaultProps.onToggleLaugh).toHaveBeenCalledWith(1);
  });

  it('displays laugh count', () => {
    render(<PostActions {...defaultProps} />);
    expect(screen.getByText('4')).toBeInTheDocument(); // laughs count
  });

  it('hides laugh button when hideLaugh is true', () => {
    render(<PostActions {...defaultProps} hideLaugh />);
    expect(screen.queryByTitle('Laugh')).not.toBeInTheDocument();
  });

  it('calls onRepost when repost button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Repost'));
    expect(defaultProps.onRepost).toHaveBeenCalledWith(1);
  });

  it('calls onShare when share button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Share'));
    expect(defaultProps.onShare).toHaveBeenCalledWith(1);
  });

  it('calls onToggleSave when save button is clicked', async () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
    await waitFor(() => {
      expect(defaultProps.onToggleSave).toHaveBeenCalledWith(1);
    });
  });

  it('calls only onToggleSave (unsave) when already saved', async () => {
    const onToggleSave = jest.fn().mockResolvedValue(false);
    render(<PostActions {...defaultProps} savedByMe={true} onToggleSave={onToggleSave} />);
    fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
    await waitFor(() => {
      expect(onToggleSave).toHaveBeenCalledWith(1);
    });
  });

  it('opens slop modal when slop button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Mark as Slop'));
    expect(screen.getByText('Mark as Slop', { selector: 'h4' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('submits slop modal with selected reason', async () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Mark as Slop'));

    // Change the select to "Engagement Bait"
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Engagement Bait' } });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(defaultProps.onMarkSlop).toHaveBeenCalledWith(1, 'Engagement Bait');
    });
  });

  it('submits slop modal with "Other" reason and custom text', async () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Mark as Slop'));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Other' } });

    const input = screen.getByPlaceholderText('Describe...');
    expect(input).toBeInTheDocument();
    await userEvent.type(input, 'Custom reason');

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(defaultProps.onMarkSlop).toHaveBeenCalledWith(1, 'Other: Custom reason');
    });
  });

  it('closes slop modal when backdrop is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Mark as Slop'));
    expect(screen.getByText('Mark as Slop', { selector: 'h4' })).toBeInTheDocument();

    // Click the backdrop (the outer fixed div)
    const backdrop = screen.getByText('Mark as Slop', { selector: 'h4' }).closest('div[style*="position: fixed"]')!;
    fireEvent.pointerDown(backdrop);

    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('does not close slop modal when inner content is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Mark as Slop'));

    // Click inner content area (e.g., the heading)
    fireEvent.click(screen.getByText('Mark as Slop', { selector: 'h4' }));

    // Modal should still be open
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('calls onQuote when quote button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Quote'));
    expect(defaultProps.onQuote).toHaveBeenCalledWith(1);
  });

  it('calls onToggleReplies when replies button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Show replies'));
    expect(defaultProps.onToggleReplies).toHaveBeenCalledWith(1);
  });

  it('applies compact variant styles', () => {
    render(<PostActions {...defaultProps} variant="compact" />);
    const likeImg = screen.getByAltText('Like');
    expect(likeImg).toHaveAttribute('height', '28');
    expect(likeImg).toHaveAttribute('width', '28');
  });

  it('applies custom iconSize', () => {
    render(<PostActions {...defaultProps} iconSize={40} />);
    const likeImg = screen.getByAltText('Like');
    expect(likeImg).toHaveAttribute('height', '40');
    expect(likeImg).toHaveAttribute('width', '40');
  });

  it('calls onToggleMetadata when tag button is clicked', () => {
    render(<PostActions {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Toggle metadata'));
    expect(defaultProps.onToggleMetadata).toHaveBeenCalledWith(0);
  });

  it.each(['Like', 'Repost', 'Save', 'Tag'])('%s icon is tinted while hovered, and only then', (alt) => {
    render(<PostActions {...defaultProps} />);
    const icon = screen.getByAltText(alt);
    expect(icon.style.filter).toBe('none');
    fireEvent.mouseEnter(icon);
    expect(icon.style.filter).not.toBe('none');
    fireEvent.mouseLeave(icon);
    expect(icon.style.filter).toBe('none');
  });

  it('slop icon shows a pressed tint while held, then the hover tint', () => {
    render(<PostActions {...defaultProps} />);
    const icon = screen.getByAltText('Slop');
    fireEvent.mouseEnter(icon);
    const hoverTint = icon.style.filter;
    fireEvent.mouseDown(icon);
    expect(icon.style.filter).not.toBe(hoverTint);
    fireEvent.mouseUp(icon);
    expect(icon.style.filter).toBe(hoverTint);
    fireEvent.mouseLeave(icon);
    expect(icon.style.filter).toBe('none');
  });


  it('shows active state styles when likedByMe is true', () => {
    render(<PostActions {...defaultProps} likedByMe={true} />);
    const likeImg = screen.getByAltText('Like');
    const filter = likeImg.style.filter;
    expect(filter).toContain('saturate');
  });

  it('shows active state styles when repostedByMe is true', () => {
    render(<PostActions {...defaultProps} repostedByMe={true} />);
    const repostImg = screen.getByAltText('Repost');
    const filter = repostImg.style.filter;
    expect(filter).toContain('saturate');
  });

  it('shows active state styles when savedByMe is true', () => {
    render(<PostActions {...defaultProps} savedByMe={true} />);
    const saveImg = screen.getByAltText('Save');
    const filter = saveImg.style.filter;
    expect(filter).toContain('saturate');
  });

  it('shows active state styles when metadataExpanded is true', () => {
    render(<PostActions {...defaultProps} metadataExpanded={true} />);
    const tagImg = screen.getByAltText('Tag');
    const filter = tagImg.style.filter;
    expect(filter).toContain('saturate');
  });

  it('displays zero counts correctly', () => {
    render(
      <PostActions
        {...defaultProps}
        counts={{ likes: 0, reposts: 0, shares: 0, saves: 0, replies: 0, quotes: 0, slop: 0 }}
      />
    );
    // All zeros should be displayed
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(7);
  });

  describe('save/download flow', () => {
    it('triggers download for video when saving a post', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(true);
      const clickSpy = jest.fn();
      const removeSpy = jest.fn();

      // Create the capture target with an avatar image to exercise replaceAvatarsForCapture
      const div = document.createElement('div');
      div.id = 'post-1';
      const avatarImg = document.createElement('img');
      avatarImg.setAttribute('data-avatar', 'hex');
      avatarImg.src = 'http://example.com/avatar.png';
      // Simulate a loaded image
      Object.defineProperty(avatarImg, 'complete', { value: true });
      Object.defineProperty(avatarImg, 'naturalWidth', { value: 100 });
      div.appendChild(avatarImg);
      document.body.appendChild(div);

      // We need to mock createElement AFTER render, so let's render first
      render(
        <PostActions
          {...defaultProps}
          videoUrl="http://example.com/video.mp4"
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      // Now mock createElement for the download anchor
      const origCreate = document.createElement.bind(document);
      const createdAnchors: any[] = [];
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const anchor = origCreate('a');
          anchor.click = clickSpy;
          anchor.remove = removeSpy;
          createdAnchors.push(anchor);
          return anchor;
        }
        return origCreate(tag);
      });

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      await waitFor(() => {
        expect(onToggleSave).toHaveBeenCalledWith(1);
      });

      // Allow async download flow to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(clickSpy).toHaveBeenCalled();
      const downloadAnchor = createdAnchors.find((a) => a.href.includes('/api/download'));
      expect(downloadAnchor).toBeTruthy();
      expect(downloadAnchor.download).toContain('post_1_testuser.mp4');

      jest.restoreAllMocks();
      div.remove();
    });

    it('triggers download for audio when saving a post (no video)', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(true);
      const clickSpy = jest.fn();

      const div = document.createElement('div');
      div.id = 'post-1';
      document.body.appendChild(div);

      render(
        <PostActions
          {...defaultProps}
          audioUrl="http://example.com/song.mp3"
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      const origCreate = document.createElement.bind(document);
      const createdAnchors: any[] = [];
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const anchor = origCreate('a');
          anchor.click = clickSpy;
          anchor.remove = jest.fn();
          createdAnchors.push(anchor);
          return anchor;
        }
        return origCreate(tag);
      });

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(onToggleSave).toHaveBeenCalledWith(1);
      expect(clickSpy).toHaveBeenCalled();
      const downloadAnchor = createdAnchors.find((a) => a.href.includes('/api/download'));
      expect(downloadAnchor).toBeTruthy();
      expect(downloadAnchor.download).toContain('post_1_testuser.mp3');

      jest.restoreAllMocks();
      div.remove();
    });

    it('does not download when onToggleSave returns false', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(false);

      render(
        <PostActions
          {...defaultProps}
          videoUrl="http://example.com/video.mp4"
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      await waitFor(() => {
        expect(onToggleSave).toHaveBeenCalledWith(1);
      });
    });

    it('uses fallback extension when video URL has no extension', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(true);

      const div = document.createElement('div');
      div.id = 'post-1';
      document.body.appendChild(div);

      render(
        <PostActions
          {...defaultProps}
          videoUrl="http://example.com/video"
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      const origCreate = document.createElement.bind(document);
      const createdAnchors: any[] = [];
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const anchor = origCreate('a');
          anchor.click = jest.fn();
          anchor.remove = jest.fn();
          createdAnchors.push(anchor);
          return anchor;
        }
        return origCreate(tag);
      });

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const downloadAnchor = createdAnchors.find((a) => a.href.includes('/api/download'));
      expect(downloadAnchor).toBeTruthy();
      expect(downloadAnchor.download).toContain('.mp4'); // fallback

      jest.restoreAllMocks();
      div.remove();
    });
  });

  describe('screenshot capture with image loading', () => {
    it('handles incomplete images by waiting for load', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(true);

      // Create a capture target with an image that is NOT yet loaded
      const div = document.createElement('div');
      div.id = 'post-1';
      const img = document.createElement('img');
      img.src = 'http://example.com/slow.png';
      Object.defineProperty(img, 'complete', { value: false, configurable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
      div.appendChild(img);
      document.body.appendChild(div);

      render(
        <PostActions
          {...defaultProps}
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      // Simulate the image finishing loading
      if (img.onload) (img.onload as Function)(new Event('load'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(onToggleSave).toHaveBeenCalledWith(1);

      div.remove();
    });

    it('handles image load error gracefully during capture', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(true);

      const div = document.createElement('div');
      div.id = 'post-1';
      const img = document.createElement('img');
      img.src = 'http://example.com/broken.png';
      Object.defineProperty(img, 'complete', { value: false, configurable: true });
      Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
      div.appendChild(img);
      document.body.appendChild(div);

      render(
        <PostActions
          {...defaultProps}
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      // Simulate image error
      if (img.onerror) (img.onerror as Function)(new Event('error'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(onToggleSave).toHaveBeenCalledWith(1);

      div.remove();
    });

    it('handles avatar image that needs imageLoaded wait', async () => {
      const onToggleSave = jest.fn().mockResolvedValue(true);

      const div = document.createElement('div');
      div.id = 'post-1';
      const avatarImg = document.createElement('img');
      avatarImg.setAttribute('data-avatar', 'hex');
      avatarImg.src = 'http://example.com/avatar.png';
      // Image is NOT complete yet
      Object.defineProperty(avatarImg, 'complete', { value: false, configurable: true });
      Object.defineProperty(avatarImg, 'naturalWidth', { value: 0, configurable: true });
      div.appendChild(avatarImg);
      document.body.appendChild(div);

      render(
        <PostActions
          {...defaultProps}
          onToggleSave={onToggleSave}
          savedByMe={false}
        />
      );

      await act(async () => {
        fireEvent.click(screen.getByTitle('Save (and download media/screenshot)'));
      });

      // Simulate the avatar loading
      if (avatarImg.onload) (avatarImg.onload as Function)(new Event('load'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(onToggleSave).toHaveBeenCalledWith(1);
      div.remove();
    });
  });

  describe('report button and modal', () => {
    it('renders report button by default', () => {
      render(<PostActions {...defaultProps} />);
      expect(screen.getByTitle('Report')).toBeInTheDocument();
    });

    it('hides report button when hideReport is true', () => {
      render(<PostActions {...defaultProps} hideReport />);
      expect(screen.queryByTitle('Report')).not.toBeInTheDocument();
    });

    it('opens report modal when report button is clicked', () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));
      expect(screen.getByText('Report Post')).toBeInTheDocument();
      expect(screen.getByText('Submit Report')).toBeInTheDocument();
    });

    it('shows report reason dropdown with serious options', () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));
      const select = screen.getAllByRole('combobox')[0]; // first select is slop if open, but report modal has its own
      // Report modal should have these options
      expect(screen.getByText('Harassment or Bullying')).toBeInTheDocument();
      expect(screen.getByText('Hate Speech')).toBeInTheDocument();
      expect(screen.getByText('Violence or Threats')).toBeInTheDocument();
      expect(screen.getByText('CSAM / Child Safety')).toBeInTheDocument();
      expect(screen.getByText('Illegal Activity')).toBeInTheDocument();
    });

    it('submits report with selected reason', async () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));

      // Change reason
      const selects = screen.getAllByRole('combobox');
      const reportSelect = selects[selects.length - 1]; // last combobox is the report one
      fireEvent.change(reportSelect, { target: { value: 'Hate Speech' } });

      fireEvent.click(screen.getByText('Submit Report'));

      await waitFor(() => {
        expect(defaultProps.onReport).toHaveBeenCalledWith(1, 'Hate Speech');
      });
    });

    it('submits report with additional details', async () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));

      const textarea = screen.getByPlaceholderText(/Provide context/);
      await userEvent.type(textarea, 'Threatening my family');

      fireEvent.click(screen.getByText('Submit Report'));

      await waitFor(() => {
        expect(defaultProps.onReport).toHaveBeenCalledWith(
          1, 'Harassment or Bullying: Threatening my family'
        );
      });
    });

    it('requires details when "Other" is selected', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[selects.length - 1], { target: { value: 'Other' } });

      // Submit without details
      fireEvent.click(screen.getByText('Submit Report'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please provide details for your report.');
        expect(defaultProps.onReport).not.toHaveBeenCalled();
      });
      alertSpy.mockRestore();
    });

    it('closes report modal when backdrop is clicked', () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));
      expect(screen.getByText('Report Post')).toBeInTheDocument();

      const backdrop = screen.getByText('Report Post').closest('div[style*="position: fixed"]')!;
      fireEvent.pointerDown(backdrop);

      expect(screen.queryByText('Submit Report')).not.toBeInTheDocument();
    });

    it('does not close report modal when inner content is clicked', () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));

      fireEvent.click(screen.getByText('Report Post'));
      expect(screen.getByText('Submit Report')).toBeInTheDocument();
    });

    it('handles hover on report button', () => {
      render(<PostActions {...defaultProps} />);
      const reportImg = screen.getByAltText('Report');
      fireEvent.mouseEnter(reportImg);
      expect(reportImg.style.filter).toContain('sepia');
      fireEvent.mouseLeave(reportImg);
      expect(reportImg.style.filter).toBe('none');
    });

    it('report icon shows a pressed tint only while held', () => {
      render(<PostActions {...defaultProps} />);
      const reportImg = screen.getByAltText('Report');
      fireEvent.mouseDown(reportImg);
      expect(reportImg.style.filter).not.toBe('none');
      fireEvent.mouseUp(reportImg);
      expect(reportImg.style.filter).toBe('none');
    });

    it('shows warning text about false reports', () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));
      expect(screen.getByText(/False reports may result in/)).toBeInTheDocument();
    });

    it('resets form after submission', async () => {
      render(<PostActions {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Report'));

      const textarea = screen.getByPlaceholderText(/Provide context/);
      await userEvent.type(textarea, 'Some details');
      fireEvent.click(screen.getByText('Submit Report'));

      await waitFor(() => {
        expect(defaultProps.onReport).toHaveBeenCalled();
        // Modal should be closed after async submission
        expect(screen.queryByText('Submit Report')).not.toBeInTheDocument();
      });
    });
  });
});
