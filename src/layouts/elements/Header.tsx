import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutUser } from '@/store/features/auth/authSlice'
import { selectCurrentUser, selectIsAdmin } from '@/store/features/auth/selector'
import { LanguageSwitcher } from '@/components/elements'
import './Header.scss'

export const Header: React.FC = () => {
	const { t } = useTranslation()
	const location = useLocation()
	const dispatch = useAppDispatch()
	const user = useAppSelector(selectCurrentUser)
	const isAdmin = useAppSelector(selectIsAdmin)
	const [menuOpen, setMenuOpen] = useState(false)

	// Close menu on route change
	useEffect(() => {
		setMenuOpen(false)
	}, [location.pathname])

	const handleLogout = () => {
		dispatch(logoutUser())
	}

	const isActive = (path: string) =>
		path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

	return (
		<header className='app-header'>
			<div className='header-content'>
				<Link to='/' className='header-logo'>
					Jellywatch
				</Link>
				<button
					className={`header-hamburger ${menuOpen ? 'header-hamburger--open' : ''}`}
					onClick={() => setMenuOpen(!menuOpen)}
					aria-label='Toggle menu'>
					<span />
					<span />
					<span />
				</button>
				<nav className={`header-nav ${menuOpen ? 'header-nav--open' : ''}`}>
					<Link to='/' className={`nav-link ${isActive('/') ? 'active' : ''}`}>
						{t('nav.dashboard')}
					</Link>
					<Link to='/series' className={`nav-link ${isActive('/series') ? 'active' : ''}`}>
						{t('nav.series')}
					</Link>
					<Link to='/movies' className={`nav-link ${isActive('/movies') ? 'active' : ''}`}>
						{t('nav.movies')}
					</Link>
					<Link to='/activity' className={`nav-link ${isActive('/activity') ? 'active' : ''}`}>
						{t('nav.activity')}
					</Link>
					<Link to='/wrapped' className={`nav-link ${isActive('/wrapped') ? 'active' : ''}`}>
						{t('nav.wrapped')}
					</Link>
					<Link to='/calendar' className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}>
						{t('nav.calendar')}
					</Link>
					<Link to='/data' className={`nav-link ${isActive('/data') ? 'active' : ''}`}>
						{t('nav.data')}
					</Link>
					{isAdmin && (
						<Link
							to='/backup-schedule'
							className={`nav-link ${isActive('/backup-schedule') ? 'active' : ''}`}>
							{t('nav.backupSchedule')}
						</Link>
					)}
					{isAdmin && (
						<Link to='/admin' className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
							{t('nav.admin')}
						</Link>
					)}
					<div className='header-user header-user--mobile'>
						<LanguageSwitcher />
						{user && <span className='user-name'>{user.username}</span>}
						<button className='logout-btn' onClick={handleLogout} title={t('auth.logout')}>
							<svg
								viewBox='0 0 24 24'
								width='16'
								height='16'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
								<polyline points='16 17 21 12 16 7' />
								<line x1='21' y1='12' x2='9' y2='12' />
							</svg>
						</button>
					</div>
				</nav>
				<div className='header-user header-user--desktop'>
					<LanguageSwitcher />
					{user && <span className='user-name'>{user.username}</span>}
					<button className='logout-btn' onClick={handleLogout} title={t('auth.logout')}>
						<svg
							viewBox='0 0 24 24'
							width='16'
							height='16'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
							<polyline points='16 17 21 12 16 7' />
							<line x1='21' y1='12' x2='9' y2='12' />
						</svg>
					</button>
				</div>
			</div>
			{menuOpen && <div className='header-backdrop' onClick={() => setMenuOpen(false)} />}
		</header>
	)
}
