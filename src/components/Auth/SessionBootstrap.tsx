import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCurrentUser } from '@/store/features/auth/authSlice'
import { selectAuthToken } from '@/store/features/auth/selector'

interface SessionBootstrapProps {
	children: React.ReactNode
}

export const SessionBootstrap: React.FC<SessionBootstrapProps> = ({ children }) => {
	const dispatch = useAppDispatch()
	const token = useAppSelector(selectAuthToken)
	const checkedInitialSession = useRef(false)
	const [checkingSession, setCheckingSession] = useState(true)

	useEffect(() => {
		if (checkedInitialSession.current) return
		checkedInitialSession.current = true

		if (!token) {
			setCheckingSession(false)
			return
		}

		let cancelled = false

		dispatch(fetchCurrentUser())
			.unwrap()
			.catch(() => {
				/* customFetch/authSlice handle expired or invalid sessions */
			})
			.finally(() => {
				if (!cancelled) setCheckingSession(false)
			})

		return () => {
			cancelled = true
		}
	}, [dispatch, token])

	if (checkingSession) return <div>Loading...</div>

	return <>{children}</>
}
