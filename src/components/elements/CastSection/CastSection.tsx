import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { CastMemberDto } from '@/models/api'
import './CastSection.scss'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'

interface Props {
	fetchCredits: () => Promise<CastMemberDto[]>
	mediaId: number
}

export const CastSection: React.FC<Props> = ({ fetchCredits, mediaId }) => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [cast, setCast] = useState<CastMemberDto[]>([])
	const [loading, setLoading] = useState(true)

	// Drag-to-scroll
	const scrollRef = useRef<HTMLDivElement>(null)
	const isDragging = useRef(false)
	const didDrag = useRef(false)
	const startX = useRef(0)
	const scrollLeft = useRef(0)
	const DRAG_THRESHOLD = 5

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			if (!isDragging.current) return
			e.preventDefault()
			const el = scrollRef.current
			if (!el) return
			const dx = e.pageX - startX.current
			if (Math.abs(dx) > DRAG_THRESHOLD) {
				didDrag.current = true
				el.style.cursor = 'grabbing'
			}
			el.scrollLeft = scrollLeft.current - dx
		}
		const onMouseUp = () => {
			if (!isDragging.current) return
			isDragging.current = false
			const el = scrollRef.current
			if (el) {
				el.style.cursor = ''
				el.style.removeProperty('user-select')
			}
		}
		globalThis.addEventListener('mousemove', onMouseMove)
		globalThis.addEventListener('mouseup', onMouseUp)
		return () => {
			globalThis.removeEventListener('mousemove', onMouseMove)
			globalThis.removeEventListener('mouseup', onMouseUp)
		}
	}, [])

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		const el = scrollRef.current
		if (!el) return
		isDragging.current = true
		didDrag.current = false
		startX.current = e.pageX
		scrollLeft.current = el.scrollLeft
		el.style.userSelect = 'none'
	}, [])

	const handleCardClick = useCallback(
		(e: React.MouseEvent, tmdbPersonId: number) => {
			if (didDrag.current) {
				e.preventDefault()
				e.stopPropagation()
				didDrag.current = false
				return
			}
			navigate(`/person/${tmdbPersonId}`)
		},
		[navigate]
	)

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		fetchCredits()
			.then((data) => {
				if (!cancelled) setCast(data)
			})
			.catch(() => {
				/* silently ignore */
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [mediaId])

	if (loading || cast.length === 0) return null

	return (
		<div className='cast-section'>
			<h2 className='cast-section__title'>{t('cast.title')}</h2>
			<div className='cast-section__list' ref={scrollRef} onMouseDown={onMouseDown}>
				{cast.map((member) => (
					<div
						key={member.tmdbPersonId}
						className='cast-section__card'
						onClick={(e) => handleCardClick(e, member.tmdbPersonId)}
						role='button'
						tabIndex={0}>
						{member.profilePath ? (
							<img
								className='cast-section__photo'
								src={`${TMDB_IMAGE_BASE}${member.profilePath}`}
								alt={member.name}
								loading='lazy'
								draggable={false}
							/>
						) : (
							<div className='cast-section__photo cast-section__photo--fallback'>
								<span>👤</span>
							</div>
						)}
						<div className='cast-section__info'>
							<span className='cast-section__name'>{member.name}</span>
							{member.character && (
								<span className='cast-section__character'>{member.character}</span>
							)}
							{member.totalEpisodeCount != null && member.totalEpisodeCount > 0 && (
								<span className='cast-section__episodes'>
									{member.totalEpisodeCount} {t('cast.episodes')}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
