import { type PropsWithChildren, type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { createTestStore, type TestStore } from './createTestStore'
import type { RootState } from '@/store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
	preloadedState?: Partial<RootState>
	store?: TestStore
	route?: string
}

export const renderWithProviders = (
	ui: ReactElement,
	{
		preloadedState,
		store = createTestStore(preloadedState),
		route = '/',
		...renderOptions
	}: ExtendedRenderOptions = {}
) => {
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>
			<I18nextProvider i18n={i18n}>
				<MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
			</I18nextProvider>
		</Provider>
	)

	return {
		store,
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
	}
}
