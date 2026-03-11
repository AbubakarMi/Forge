import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ui/ProgressBar'

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ProgressBar success={50} failed={20} pending={30} />
    )
    expect(container).toBeTruthy()
  })

  it('handles all zeros gracefully', () => {
    const { container } = render(
      <ProgressBar success={0} failed={0} pending={0} />
    )
    expect(container).toBeTruthy()
  })

  it('displays correct labels', () => {
    render(<ProgressBar success={10} failed={5} pending={3} />)
    expect(screen.getByText(/Success: 10/)).toBeInTheDocument()
    expect(screen.getByText(/Failed: 5/)).toBeInTheDocument()
    expect(screen.getByText(/Pending: 3/)).toBeInTheDocument()
  })

  it('renders segments with correct title attributes', () => {
    const { container } = render(
      <ProgressBar success={50} failed={25} pending={25} />
    )
    const successBar = container.querySelector('[title^="Success"]')
    const failedBar = container.querySelector('[title^="Failed"]')
    const pendingBar = container.querySelector('[title^="Pending"]')
    expect(successBar).toBeTruthy()
    expect(failedBar).toBeTruthy()
    expect(pendingBar).toBeTruthy()
  })

  it('does not render segments when count is zero', () => {
    const { container } = render(
      <ProgressBar success={100} failed={0} pending={0} />
    )
    expect(container.querySelector('[title^="Success"]')).toBeTruthy()
    expect(container.querySelector('[title^="Failed"]')).toBeNull()
    expect(container.querySelector('[title^="Pending"]')).toBeNull()
  })
})
