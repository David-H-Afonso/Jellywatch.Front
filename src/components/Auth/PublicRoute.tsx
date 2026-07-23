import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated } from '@/store/features/auth/selector'

interface PublicRouteProps {
	children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
	const isAuthenticated = useAppSelector(selectIsAuthenticated)
	const location = useLocation()
	const returnTo = (location.state as { returnTo?: unknown } | null)?.returnTo
	const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/'

	if (isAuthenticated) {
		return <Navigate to={safeReturnTo} replace />
	}

	return <>{children}</>
}
