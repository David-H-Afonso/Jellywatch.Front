import { useNavigate, useRouteError } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { forceLogout } from '@/store/features/auth/authSlice'
import { purgePersistedState } from '@/utils/customFetch'

export const RouteError: React.FC = () => {
	const error = useRouteError()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const message = error instanceof Error ? error.message : 'An unexpected error occurred'

	const handleResetSession = () => {
		dispatch(forceLogout())
		purgePersistedState()
		sessionStorage.clear()
		try {
			localStorage.clear()
		} catch {
			/* ignore */
		}
		navigate('/login', { replace: true })
	}

	return (
		<div style={{ padding: '2rem', textAlign: 'center' }}>
			<h1>Something went wrong</h1>
			<p>{message}</p>
			<button type='button' onClick={handleResetSession}>
				Volver al inicio de sesión
			</button>
		</div>
	)
}

export const NotFound: React.FC = () => {
	return (
		<div style={{ padding: '2rem', textAlign: 'center' }}>
			<h1>404</h1>
			<p>Page not found</p>
		</div>
	)
}
