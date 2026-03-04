import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Login } from './Login';
import { vi } from 'vitest';
import React from 'react';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockRefreshUser = vi.fn();

// Mock useAuth directly
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    refreshUser: mockRefreshUser,
  }),
}));

const renderLogin = () => {
  return render(
    <Login />
  );
};

// Helper function to fill form
const fillForm = (password: string) => {
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0], { target: { value: 'Test' } }); // Nombre
  fireEvent.change(inputs[1], { target: { value: 'Mazarrasa' } }); // Apellido 1
  fireEvent.change(inputs[2], { target: { value: 'Dos' } }); // Apellido 2
  fireEvent.change(inputs[3], { target: { value: 'Tres' } }); // Apellido 3
  fireEvent.change(inputs[4], { target: { value: 'Cuatro' } }); // Apellido 4

  fireEvent.change(screen.getByPlaceholderText(/Padre y Madre/i), { target: { value: 'Padres' } }); // Parents names

  // Date input doesn't have textbox role
  const dateInput = document.querySelector('input[type="date"]');
  if (dateInput) {
    fireEvent.change(dateInput, { target: { value: '2000-01-01' } });
  }

  // Email input
  const emailInput = document.querySelector('input[type="email"]');
  if (emailInput) {
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  }

  fireEvent.change(screen.getByPlaceholderText(/Ej: clave123/i), { target: { value: password } });
};

describe('Login component validatePassword logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn(); // Mock alert to test validatePassword output
    window.confirm = vi.fn().mockReturnValue(true); // Mock confirm to bypass Maz check

    // Mock fetch for register
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login form by default', () => {
    renderLogin();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('fails registration when password is less than 6 characters', async () => {
    renderLogin();

    // Switch to register form
    fireEvent.click(screen.getByText('Solicitar Registro'));

    fillForm('12345');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    // Check alert was called with validation error
    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("La contraseña debe tener mínimo 6 caracteres y ser alfanumérica (solo letras y números).");
    });

    // Ensure register was not called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('fails registration when password contains non-alphanumeric characters', async () => {
    renderLogin();

    // Switch to register form
    fireEvent.click(screen.getByText('Solicitar Registro'));

    fillForm('clave!123');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    // Check alert was called with validation error
    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("La contraseña debe tener mínimo 6 caracteres y ser alfanumérica (solo letras y números).");
    });

    // Ensure register was not called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('succeeds registration with valid password', async () => {
    renderLogin();

    // Switch to register form
    fireEvent.click(screen.getByText('Solicitar Registro'));

    fillForm('clave123');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    // Wait for the mock register to be called, proving validation passed
    await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
    });

    // Assert the exact alert for success
    expect(window.alert).toHaveBeenCalledWith('Registro completado. Su cuenta está pendiente de aprobación por un administrador.');
  });
});
