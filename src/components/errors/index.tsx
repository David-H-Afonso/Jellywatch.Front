import { useRouteError } from 'react-router-dom'

export const RouteError: React.FC = () => {
	const error = useRouteError()
	const message = error instanceof Error ? error.message : 'An unexpected error occurred'

	return (
		<div style={{ padding: '2rem', textAlign: 'center' }}>
			<h1>Something went wrong</h1>
			<p>{message}</p>
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
