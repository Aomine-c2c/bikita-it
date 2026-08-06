/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './page'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

// Mock the next/navigation useRouter
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the api library
vi.mock('@/lib/api', () => ({
  getApiBase: vi.fn(() => Promise.resolve('http://localhost:3000/api')),
  apiFetch: vi.fn(),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as unknown).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    
    // Reset apiFetch mock
    ;(apiFetch as unknown).mockReset()
  })

  it('renders login form elements', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: /Sign in to Pulse/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    ;(apiFetch as unknown).mockRejectedValueOnce(new Error('Invalid credentials'))

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
    ;(apiFetch as unknown).mockResolvedValueOnce({ access_token: 'fake-jwt-token' })

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
