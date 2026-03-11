import { render, screen } from '@testing-library/react'
import EmptyState from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="No data"
        description="Nothing to show"
      />
    )
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByText('Nothing to show')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(
      <EmptyState
        icon={<span data-testid="test-icon">icon</span>}
        title="Empty"
        description="Desc"
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="Empty"
        description="Desc"
        action={<button>Do something</button>}
      />
    )
    expect(screen.getByText('Do something')).toBeInTheDocument()
  })

  it('does not render action section when not provided', () => {
    const { container } = render(
      <EmptyState
        icon={<span>icon</span>}
        title="Empty"
        description="Desc"
      />
    )
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})
