import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '@/components/AuthForm';
import api from '@/lib/api';

// AxiosError shape: only `isAxiosError: true` matters for axios.isAxiosError()
function makeAxiosError(opts: { response?: { data?: unknown; status?: number } } = {}) {
  return { isAxiosError: true, message: "axios error", ...opts };
}

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock axios
jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }, defaults: { baseURL: "", headers: { common: {} } } } }));
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('login mode', () => {
    it('renders login heading and button', () => {
      render(<AuthForm mode="login" />);
      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { access_token: 'test-token-123' },
      });

      render(<AuthForm mode="login" />);

      await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
      await userEvent.type(screen.getByPlaceholderText('Password'), 'testpass');

      fireEvent.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          { username: 'testuser', password: 'testpass' }
        );
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token-123');
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('shows alert on login failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Bad credentials'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AuthForm mode="login" />);

      await userEvent.type(screen.getByPlaceholderText('Username'), 'baduser');
      await userEvent.type(screen.getByPlaceholderText('Password'), 'badpass');

      fireEvent.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Login failed. Check credentials.');
      });

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('signup mode', () => {
    it('renders signup heading and button', () => {
      render(<AuthForm mode="signup" />);
      expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    it('handles successful signup', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<AuthForm mode="signup" />);

      await userEvent.type(screen.getByPlaceholderText('Username'), 'newuser');
      await userEvent.type(screen.getByPlaceholderText('Email'), 'newuser@test.com');
      await userEvent.type(screen.getByPlaceholderText('Password'), 'newpass');

      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith(
          expect.stringContaining('/auth/signup'),
          { username: 'newuser', password: 'newpass', email: 'newuser@test.com' }
        );
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('check your email'));
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      alertSpy.mockRestore();
    });

    it('shows alert on signup failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Username taken'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AuthForm mode="signup" />);

      await userEvent.type(screen.getByPlaceholderText('Username'), 'existinguser');
      await userEvent.type(screen.getByPlaceholderText('Email'), 'existing@test.com');
      await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');

      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Signup failed'));
      });

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('error-message resolution', () => {
    /* Regression: when the backend is unreachable (no `response` on the axios error),
     * AuthForm previously showed the credentials/signup fallback message, which is
     * misleading — the user could not fix it by changing their inputs.
     * The fix shows a connectivity message in that case. */

    type Mode = 'login' | 'signup';
    type Case = {
      mode: Mode;
      buttonName: string;
      error: unknown;
      expectedAlert: string;
      description: string;
    };

    const cases: Case[] = [
      {
        mode: 'login',
        buttonName: 'Login',
        error: makeAxiosError({ response: undefined }),
        expectedAlert: 'Cannot reach the server. Check that the backend is running.',
        description: 'login: network error shows connectivity message',
      },
      {
        mode: 'signup',
        buttonName: 'Sign Up',
        error: makeAxiosError({ response: undefined }),
        expectedAlert: 'Cannot reach the server. Check that the backend is running.',
        description: 'signup: network error shows connectivity message',
      },
      {
        mode: 'signup',
        buttonName: 'Sign Up',
        error: makeAxiosError({ response: { status: 400, data: { detail: 'Email already registered' } } }),
        expectedAlert: 'Email already registered',
        description: 'signup: backend 400 with detail surfaces the detail',
      },
      {
        mode: 'login',
        buttonName: 'Login',
        error: makeAxiosError({ response: { status: 401, data: { detail: 'Invalid credentials' } } }),
        expectedAlert: 'Invalid credentials',
        description: 'login: backend 401 with detail surfaces the detail',
      },
      {
        mode: 'signup',
        buttonName: 'Sign Up',
        error: makeAxiosError({ response: { status: 400, data: {} } }),
        expectedAlert: 'Signup failed. Try a different username or email.',
        description: 'signup: 4xx without detail falls back to generic signup message',
      },
      {
        mode: 'login',
        buttonName: 'Login',
        error: new Error('non-axios error'),
        expectedAlert: 'Login failed. Check credentials.',
        description: 'login: non-axios error falls back to generic login message',
      },
    ];

    test.each(cases)('$description', async ({ mode, buttonName, error, expectedAlert }) => {
      mockedApi.post.mockRejectedValueOnce(error);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<AuthForm mode={mode} />);

      await userEvent.type(screen.getByPlaceholderText('Username'), 'u');
      if (mode === 'signup') {
        await userEvent.type(screen.getByPlaceholderText('Email'), 'u@x.com');
      }
      await userEvent.type(screen.getByPlaceholderText('Password'), 'p');

      fireEvent.click(screen.getByRole('button', { name: buttonName }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expectedAlert);
      });

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
