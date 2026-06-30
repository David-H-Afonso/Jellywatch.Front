import { vi, describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { MediaType } from '@/models/api/Enums'
import { getExternalSearchLink } from '@/utils/externalLinks'
import { ExternalManageLink } from './ExternalManageLink'

vi.mock('@/utils/externalLinks', () => ({
	getExternalSearchLink: vi.fn(),
	getExternalSearchLabel: vi.fn(() => 'Radarr'),
}))

const mockedGetLink = vi.mocked(getExternalSearchLink)

beforeEach(() => {
	mockedGetLink.mockReset()
})

describe('ExternalManageLink', () => {
	it('renders an external link when the service is configured', () => {
		mockedGetLink.mockReturnValue('http://localhost:7878/add/new?term=Dune')
		renderWithProviders(<ExternalManageLink mediaType={MediaType.Movie} title='Dune' />)

		const link = screen.getByRole('link')
		expect(link).toHaveAttribute('href', 'http://localhost:7878/add/new?term=Dune')
		expect(link).toHaveAttribute('target', '_blank')
		expect(link).toHaveAttribute('rel', 'noreferrer')
		expect(link.textContent).toContain('Radarr')
	})

	it('renders nothing when the service has no configured URL', () => {
		mockedGetLink.mockReturnValue(null)
		const { container } = renderWithProviders(
			<ExternalManageLink mediaType={MediaType.Series} title='Severance' />
		)

		expect(screen.queryByRole('link')).toBeNull()
		expect(container).toBeEmptyDOMElement()
	})

	it('applies the provided className', () => {
		mockedGetLink.mockReturnValue('http://localhost:8989/add/new?term=Severance')
		renderWithProviders(
			<ExternalManageLink
				mediaType={MediaType.Series}
				title='Severance'
				className='activity-page__external-link'
			/>
		)

		expect(screen.getByRole('link')).toHaveClass('activity-page__external-link')
	})
})
