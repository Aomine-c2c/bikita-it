import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './page'
import { useRouter } from 'next/navigation'

// Mock the next/navigation useRouter
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the api library
vi.mock('@/lib/api', () => ({
  getApiBase: vi.fn(() => Promise.resolve('http://localhost:3000/api')),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    
    // Reset global fetch
    global.fetch = vi.fn()
  })

  it('renders login form elements', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: /Sign in to Xiphos/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    })

    render(<LoginPage />)
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects to home on successful login', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'fake-jwt-token' }),
    })

    render(<LoginPage />)
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'correctpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
