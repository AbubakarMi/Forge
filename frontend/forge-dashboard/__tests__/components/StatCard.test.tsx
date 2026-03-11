import { render, screen } from '@testing-library/react'
import StatCard from '@/components/ui/StatCard'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(
      <StatCard
        title="Total"
        value="42"
        icon={<span>ic</span>}
        color="bg-blue-500"
      />
    )
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(
      <StatCard
        title="Test"
        value="10"
        icon={<span data-testid="stat-icon">ic</span>}
        color="bg-green-500"
      />
    )
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument()
  })

  it('renders trend when provided', () => {
    render(
      <StatCard
        title="Revenue"
        value="$1000"
        icon={<span>ic</span>}
        color="bg-blue-500"
        trend="+12%"
        trendUp={true}
      />
    )
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })

  it('does not render trend when not provided', () => {
    const { container } = render(
      <StatCard
        title="Count"
        value="5"
        icon={<span>ic</span>}
        color="bg-blue-500"
      />
    )
    // Only title and value paragraphs should exist
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2)
  })

  it('applies trend color based on trendUp prop', () => {
    const { rerender } = render(
      <StatCard
        title="Test"
        value="10"
        icon={<span>ic</span>}
        color="bg-blue-500"
        trend="+5%"
        trendUp={true}
      />
    )
    expect(screen.getByText('+5%').className).toContain('text-green-600')

    rerender(
      <StatCard
        title="Test"
        value="10"
        icon={<span>ic</span>}
        color="bg-blue-500"
        trend="-5%"
        trendUp={false}
      />
    )
    expect(screen.getByText('-5%').className).toContain('text-red-600')
  })
})
