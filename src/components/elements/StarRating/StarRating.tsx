import React, { useId, useState } from 'react'
import { formatUserRating } from '@/utils'
import './StarRating.scss'

interface Props {
	/** Backend value 0–10 in 0.5 steps (or null for no rating) */
	value: number | null
	onChange: (rating: number | null) => void
	disabled?: boolean
	saving?: boolean
	/** Number of stars used by the control while still representing a 0-10 score. */
	starCount?: number
	/** Optional label shown before stars (e.g. "Season:"). Omit for no label. */
	label?: string
	/** Whether to show the numeric value (e.g. "8.5/10") next to stars. Defaults to false. */
	showValue?: boolean
}

type FillState = 'empty' | 'half' | 'full'

interface StarProps {
	fill: FillState
}

const StarSvg: React.FC<StarProps> = ({ fill }) => {
	const clipId = useId()
	const path =
		'M12 2l2.73 5.53 6.11.89-4.42 4.31 1.04 6.07L12 15.9l-5.46 2.9 1.04-6.07L3.16 8.42l6.11-.89L12 2z'
	return (
		<svg viewBox='0 0 24 24' className='star-svg'>
			{fill === 'half' && (
				<defs>
					<clipPath id={clipId}>
						<rect x='0' y='0' width='12' height='24' />
					</clipPath>
				</defs>
			)}
			<path d={path} className='star-svg__bg' />
			{fill !== 'empty' && (
				<path
					d={path}
					className='star-svg__fill'
					clipPath={fill === 'half' ? `url(#${clipId})` : undefined}
				/>
			)}
		</svg>
	)
}

export const StarRating: React.FC<Props> = ({
	value,
	onChange,
	disabled = false,
	saving = false,
	starCount = 10,
	label,
	showValue = false,
}) => {
	const [hovered, setHovered] = useState<number | null>(null)
	const scorePerStar = 10 / starCount

	const display = hovered ?? (value !== null ? value / scorePerStar : null)

	const getFill = (star: number): FillState => {
		if (display === null) return 'empty'
		if (display >= star) return 'full'
		if (display >= star - 0.5) return 'half'
		return 'empty'
	}

	const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, star: number) => {
		if (disabled) return
		const rect = e.currentTarget.getBoundingClientRect()
		const x = e.clientX - rect.left
		setHovered(x < rect.width / 2 ? star - 0.5 : star)
	}

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>, star: number) => {
		if (disabled) return
		const rect = e.currentTarget.getBoundingClientRect()
		const x = e.clientX - rect.left
		const selected = x < rect.width / 2 ? star - 0.5 : star
		const nextValue = selected * scorePerStar
		onChange(value === nextValue ? null : nextValue)
	}

	return (
		<div className='star-rating'>
			{label && <span className='star-rating__label'>{label}</span>}
			<div className='star-rating__stars' onMouseLeave={() => setHovered(null)}>
				{Array.from({ length: starCount }, (_, index) => index + 1).map((star) => (
					<button
						key={star}
						type='button'
						className='star-rating__star'
						onMouseMove={(e) => handleMouseMove(e, star)}
						onClick={(e) => handleClick(e, star)}
						disabled={disabled || saving}
						aria-label={formatUserRating(star * scorePerStar)}>
						<StarSvg fill={getFill(star)} />
					</button>
				))}
			</div>
			{showValue && value !== null && <span className='star-rating__value'>{formatUserRating(value)}</span>}
			{saving && <span className='star-rating__saving'>✓</span>}
		</div>
	)
}
