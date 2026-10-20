describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should export default API_URL when NEXT_PUBLIC_API_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const { API_URL } = require('@/lib/config');
    expect(API_URL).toBe('http://localhost:5000');
  });

  it('should use NEXT_PUBLIC_API_URL env var when set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.example.com';
    const { API_URL } = require('@/lib/config');
    expect(API_URL).toBe('https://custom-api.example.com');
  });

  it('server code uses API_INTERNAL_URL when set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    process.env.API_INTERNAL_URL = 'http://backend:5000';
    const { API_URL, SERVER_API_URL } = require('@/lib/config');
    expect(SERVER_API_URL).toBe('http://backend:5000');
    expect(API_URL).toBe('https://api.example.com');
  });

  it('server code falls back to the public API URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    delete process.env.API_INTERNAL_URL;
    const { SERVER_API_URL } = require('@/lib/config');
    expect(SERVER_API_URL).toBe('https://api.example.com');
  });

  it('should export DEFAULT_AVATAR', () => {
    const { DEFAULT_AVATAR } = require('@/lib/config');
    expect(DEFAULT_AVATAR).toBe('https://ui-avatars.com/api/?name=User');
  });
});
