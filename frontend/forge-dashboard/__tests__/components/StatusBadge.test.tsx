import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders pending status with yellow color', () => {
    render(<StatusBadge status="pending" />)
    const badge = screen.getByText('pending')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-yellow-100')
  })

  it('renders completed status with green color', () => {
    render(<StatusBadge status="completed" />)
    const badge = screen.getByText('completed')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-green-100')
  })

  it('renders failed status with red color', () => {
    render(<StatusBadge status="failed" />)
    const badge = screen.getByText('failed')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-red-100')
  })

  it('renders processing status with blue color', () => {
    render(<StatusBadge status="processing" />)
    const badge = screen.getByText('processing')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-blue-100')
  })

  it('normalizes status to lowercase', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('renders unknown status with default gray color', () => {
    render(<StatusBadge status="unknown" />)
    const badge = screen.getByText('unknown')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-gray-100')
  })
})
