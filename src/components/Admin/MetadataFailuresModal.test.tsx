import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MediaType } from '@/models/api/Enums'
import type { BulkMetadataFailureDto } from '@/services/AdminService/AdminService'
import i18n from '@/i18n'
import MetadataFailuresModal from './MetadataFailuresModal'

const failures: BulkMetadataFailureDto[] = [
	{
		mediaItemId: 101,
		seriesId: 11,
		movieId: null,
		mediaType: MediaType.Series,
		mediaTitle: 'Example Series',
		error: 'No metadata was returned.',
	},
	{
		mediaItemId: 202,
		seriesId: null,
		movieId: 22,
		mediaType: MediaType.Movie,
		mediaTitle: 'Example Movie',
		error: 'The metadata provider timed out.',
	},
]

describe('MetadataFailuresModal', () => {
	it('links failures to their detail pages and explains unavailable legacy details', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()

		render(
			<I18nextProvider i18n={i18n}>
				<MemoryRouter initialEntries={['/admin']}>
					<Routes>
						<Route
							path='/admin'
							element={
								<MetadataFailuresModal failures={failures} failedCount={3} onClose={onClose} />
							}
						/>
						<Route path='/series/:id' element={<p>Series detail page</p>} />
						<Route path='/movies/:id' element={<p>Movie detail page</p>} />
					</Routes>
				</MemoryRouter>
			</I18nextProvider>
		)

		expect(screen.getByRole('link', { name: 'Example Series' })).toHaveAttribute('href', '/series/11')
		expect(screen.getByRole('link', { name: 'Example Movie' })).toHaveAttribute('href', '/movies/22')
		expect(screen.getByText(/details are available for 2 of 3 failures/i)).toBeInTheDocument()

		await user.click(screen.getByRole('link', { name: 'Example Series' }))
		expect(await screen.findByText('Series detail page')).toBeInTheDocument()
		expect(onClose).toHaveBeenCalledOnce()
	})
})
