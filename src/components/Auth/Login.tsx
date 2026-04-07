import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser } from '@/store/features/auth/authSlice'
import { selectAuthLoading, selectAuthError } from '@/store/features/auth/selector'
import { invalidateMovieCache } from '@/store/features/movies'
import { invalidateCache as invalidateSeriesCache } from '@/store/features/series'
import { triggerMineSync } from '@/services/AdminService/AdminService'
import './Login.scss'

export const Login: React.FC = () => {
	const dispatch = useAppDispatch()
	const loading = useAppSelector(selectAuthLoading)
	const error = useAppSelector(selectAuthError)

	const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_JELLYFIN_DEFAULT_URL ?? '')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const result = await dispatch(loginUser({ serverUrl, username, password }))
		if (loginUser.fulfilled.match(result)) {
			triggerMineSync().catch(() => {})
			dispatch(invalidateMovieCache())
			dispatch(invalidateSeriesCache())
		}
	}

	return (
		<div className='login-page'>
			<div className='login-card'>
				<h1 className='login-title'>Jellywatch</h1>
				<p className='login-subtitle'>Connect to your Jellyfin server</p>

				<form onSubmit={handleSubmit} className='login-form'>
					<div className='form-group'>
						<label htmlFor='serverUrl'>Server URL</label>
						<input
							id='serverUrl'
							type='url'
							value={serverUrl}
							onChange={(e) => setServerUrl(e.target.value)}
							placeholder='http://your-jellyfin:8096'
							required
							autoFocus
						/>
					</div>

					<div className='form-group'>
						<label htmlFor='username'>Username</label>
						<input
							id='username'
							type='text'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder='Jellyfin username'
							required
						/>
					</div>

					<div className='form-group'>
						<label htmlFor='password'>Password</label>
						<input
							id='password'
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder='Password'
						/>
					</div>

					{error && <div className='login-error'>{error}</div>}

					<button type='submit' className='login-btn' disabled={loading}>
						{loading ? 'Connecting...' : 'Sign In'}
					</button>
				</form>
			</div>
		</div>
	)
}
