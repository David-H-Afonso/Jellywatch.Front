import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { RouterProvider } from 'react-router-dom'
import { store, persistor } from './store'
import { router } from '@/navigation/router'
import { initCustomFetch } from '@/utils/customFetch'
import { forceLogout } from '@/store/features/auth/authSlice'
import '@/i18n'
import './App.scss'

initCustomFetch(store, persistor, forceLogout)

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<PersistGate loading={<div>Loading...</div>} persistor={persistor}>
				<RouterProvider router={router} />
			</PersistGate>
		</Provider>
	</StrictMode>
)
