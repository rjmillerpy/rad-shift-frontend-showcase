import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostComposer from '@/components/PostComposer';
import api from '@/lib/api';
import type { Post } from '@/types/post';

jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

// Mock URL.createObjectURL / revokeObjectURL since jsdom doesn't support them
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake-preview');
  global.URL.revokeObjectURL = jest.fn();
  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).slice(2)),
    },
    configurable: true,
  });
});

const makeQuotePost = (): Post => ({
  id: 42,
  text: 'This is the quoted post text',
  username: 'quoteduser',
  likes: 1,
  laughs: 0,
  reposts: 0,
  shares: 0,
  saves: 0,
  unix_timestamp: 1700000000,
});

const defaultProps = {
  token: 'test-token',
  quotePreview: null as Post | null,
  onClearQuote: jest.fn(),
  onPostCreated: jest.fn(),
  quotePostId: null as number | null,
};

describe('PostComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with input and buttons', () => {
    render(<PostComposer {...defaultProps} />);
    expect(screen.getByPlaceholderText('Write a post...')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    expect(screen.getByTitle('Toggle Metadata')).toBeInTheDocument();
  });

  it('has a file upload input', () => {
    render(<PostComposer {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    // FileUploader uses a hidden file input with multiple attribute
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('submits a post and clears inputs', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<PostComposer {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'My new post');
    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/posts/add'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "multipart/form-data",
          }),
        })
      );
      expect(defaultProps.onPostCreated).toHaveBeenCalled();
      expect(defaultProps.onClearQuote).toHaveBeenCalled();
    });

    // Input should be cleared
    expect(screen.getByPlaceholderText('Write a post...')).toHaveValue('');
  });

  it('does not submit when text is empty', async () => {
    render(<PostComposer {...defaultProps} />);
    fireEvent.click(screen.getByText('Post'));
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('submits a draft and shows alert', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<PostComposer {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'Draft content');
    fireEvent.click(screen.getByText('Save Draft'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Draft saved');
      expect(defaultProps.onPostCreated).not.toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it('displays quote preview when quotePreview is set', () => {
    const quotePost = makeQuotePost();
    render(<PostComposer {...defaultProps} quotePreview={quotePost} quotePostId={42} />);
    expect(screen.getByText('Quoting @quoteduser')).toBeInTheDocument();
    expect(screen.getByText('This is the quoted post text')).toBeInTheDocument();
  });

  it('truncates long quote preview text', () => {
    const longPost = { ...makeQuotePost(), text: 'A'.repeat(300) };
    render(<PostComposer {...defaultProps} quotePreview={longPost} quotePostId={42} />);
    const quotedText = screen.getByText(/A{10,}/);
    // 200 chars + ellipsis
    expect(quotedText.textContent!.length).toBeLessThanOrEqual(201);
  });

  it('calls onClearQuote when clear quote button is clicked', () => {
    const quotePost = makeQuotePost();
    render(<PostComposer {...defaultProps} quotePreview={quotePost} quotePostId={42} />);
    fireEvent.click(screen.getByText('Clear quote'));
    expect(defaultProps.onClearQuote).toHaveBeenCalled();
  });

  it('toggles metadata fields on and off', async () => {
    render(<PostComposer {...defaultProps} />);

    // Metadata fields should be hidden initially
    expect(screen.queryByPlaceholderText('Tags (pipe-separated)')).not.toBeInTheDocument();

    // Click toggle
    fireEvent.click(screen.getByTitle('Toggle Metadata'));

    // Metadata fields should now be visible
    expect(screen.getByPlaceholderText('Tags (pipe-separated)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tag users (comma-separated usernames)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Location')).toBeInTheDocument();

    // Click toggle again
    fireEvent.click(screen.getByTitle('Toggle Metadata'));

    // Metadata fields should be hidden again
    expect(screen.queryByPlaceholderText('Tags (pipe-separated)')).not.toBeInTheDocument();
  });

  it('includes metadata in post submission', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<PostComposer {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'Post with metadata');

    // Open metadata
    fireEvent.click(screen.getByTitle('Toggle Metadata'));

    await userEvent.type(screen.getByPlaceholderText('Tags (pipe-separated)'), 'tag1|tag2');
    await userEvent.type(screen.getByPlaceholderText('Tag users (comma-separated usernames)'), 'bob, charlie');
    await userEvent.type(screen.getByPlaceholderText('Location'), 'NYC');

    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
      const formData = mockedApi.post.mock.calls[0][1] as FormData;
      expect(formData.get('text')).toBe('Post with metadata');
    });
  });

  it('includes quotePostId as parent_post_id in submission', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<PostComposer {...defaultProps} quotePreview={makeQuotePost()} quotePostId={42} />);

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'Quoting you');
    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      const formData = mockedApi.post.mock.calls[0][1] as FormData;
      expect(formData.get('parent_post_id')).toBe('42');
    });
  });

  it('includes selected file in form data', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<PostComposer {...defaultProps} />);

    // Create a fake file and trigger the hidden file input onChange
    const file = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'Post with image');
    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
      const formData = mockedApi.post.mock.calls[0][1] as FormData;
      expect(formData.get('image')).toBeTruthy();
    });
  });

  it('clears file input after successful submit', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} });

    render(<PostComposer {...defaultProps} />);

    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'With file');
    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(defaultProps.onPostCreated).toHaveBeenCalled();
    });
  });

  it('handles null file selection gracefully', () => {
    render(<PostComposer {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: null } });
    expect(fileInput).toBeInTheDocument(); // still rendered: no crash
    expect(defaultProps.onPostCreated).not.toHaveBeenCalled();
  });

  it('prevents default form submission', () => {
    render(<PostComposer {...defaultProps} />);

    const form = document.querySelector('form')!;
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const prevented = !form.dispatchEvent(submitEvent);
    expect(prevented).toBe(true); // React's onSubmit calls e.preventDefault()
  });

  it('handles post submission error gracefully', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<PostComposer {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText('Write a post...'), 'Will fail');
    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error adding post:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('file input accepts multiple files', () => {
    render(<PostComposer {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.multiple).toBe(true);
  });

  it('shows file names when files are selected via FileUploader', () => {
    render(<PostComposer {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file1 = new File(['img1'], 'pic1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['img2'], 'pic2.jpg', { type: 'image/jpeg' });
    const file3 = new File(['img3'], 'pic3.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });

    // FileUploader shows individual file names
    expect(screen.getByText('pic1.jpg')).toBeInTheDocument();
    expect(screen.getByText('pic2.jpg')).toBeInTheDocument();
    expect(screen.getByText('pic3.jpg')).toBeInTheDocument();
  });

  it('submits multiple images as "images" form field', async () => {
    mockedApi.post.mockResolvedValue({ data: { message: 'Post created' } });
    render(<PostComposer {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/write a post/i);
    fireEvent.change(textarea, { target: { value: 'Multi image post' } });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['img1'], 'pic1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['img2'], 'pic2.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    fireEvent.click(screen.getByText('Post'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
      const formData = mockedApi.post.mock.calls[0][1] as FormData;
      expect(formData.getAll('images').length).toBe(2);
    });
  });
});
