import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import Login from './Login';
import { authAPI } from '../../services/authAPI';

// Mock the authAPI
jest.mock('../../services/authAPI', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  test('should render login form with demo credentials', () => {
    renderWithProviders(<Login />);

    // Check if form elements are rendered
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '记住我' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();

    // Check if demo credentials are pre-filled
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin123')).toBeInTheDocument();
  });

  test('should handle successful login with remember me', async () => {
    // Mock successful API response
    const mockResponse = {
      user: { id: '1', username: 'admin', displayName: 'Administrator', role: 'admin' },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };
    authAPI.login.mockResolvedValue(mockResponse);

    renderWithProviders(<Login />);

    // Fill in the form
    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const rememberCheckbox = screen.getByRole('checkbox', { name: '记住我' });
    const submitButton = screen.getByRole('button', { name: '登录' });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(rememberCheckbox);
    fireEvent.click(submitButton);

    // Wait for API call and check if localStorage was called
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
    });

    // Check if tokens were stored in localStorage (remember me checked)
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
  });

  test('should handle successful login without remember me', async () => {
    // Mock successful API response
    const mockResponse = {
      user: { id: '1', username: 'admin', displayName: 'Administrator', role: 'admin' },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };
    authAPI.login.mockResolvedValue(mockResponse);

    renderWithProviders(<Login />);

    // Fill in the form (don't check remember me)
    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByRole('button', { name: '登录' });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      });
    });

    // Check if token was stored in sessionStorage (remember me not checked)
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
  });

  test('should handle login failure', async () => {
    // Mock API failure
    const mockError = new Error('Invalid credentials');
    mockError.response = { data: { message: '用户名或密码错误' } };
    authAPI.login.mockRejectedValue(mockError);

    renderWithProviders(<Login />);

    // Fill in the form
    const usernameInput = screen.getByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    const submitButton = screen.getByRole('button', { name: '登录' });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('用户名或密码错误')).toBeInTheDocument();
    });

    // Verify API was called
    expect(authAPI.login).toHaveBeenCalledWith({
      username: 'wronguser',
      password: 'wrongpass',
    });
  });

  test('should show validation errors for empty fields', async () => {
    renderWithProviders(<Login />);

    const submitButton = screen.getByRole('button', { name: '登录' });
    fireEvent.click(submitButton);

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText('请输入用户名!')).toBeInTheDocument();
      expect(screen.getByText('请输入密码!')).toBeInTheDocument();
    });

    // API should not be called
    expect(authAPI.login).not.toHaveBeenCalled();
  });
});