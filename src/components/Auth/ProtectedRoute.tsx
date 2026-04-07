import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated } from '@/store/features/auth/selector'

interface ProtectedRouteProps {
	children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const isAuthenticated = useAppSelector(selectIsAuthenticated)

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />
	}

	return <>{children}</>
}
