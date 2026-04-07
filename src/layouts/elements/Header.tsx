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
					{isAdmin && (
						<Link to='/admin' className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
							{t('nav.admin')}
						</Link>
					)}
					<div className='header-user header-user--mobile'>
						<LanguageSwitcher />
						{user && <span className='user-name'>{user.username}</span>}
						<button className='logout-btn' onClick={handleLogout}>
							{t('auth.logout')}
						</button>
					</div>
				</nav>
				<div className='header-user header-user--desktop'>
					<LanguageSwitcher />
					{user && <span className='user-name'>{user.username}</span>}
					<button className='logout-btn' onClick={handleLogout}>
						{t('auth.logout')}
					</button>
				</div>
			</div>
			{menuOpen && <div className='header-backdrop' onClick={() => setMenuOpen(false)} />}
		</header>
	)
}
