import React, { useState } from 'react'
import './StarRating.scss'

interface Props {
	/** Backend value 1–10 (or null for no rating) */
	value: number | null
	onChange: (rating: number | null) => void
	disabled?: boolean
	saving?: boolean
	/** Optional label shown before stars (e.g. "Season:"). Omit for no label. */
	label?: string
	/** Whether to show the numeric value (e.g. "4.5/5") next to stars. Defaults to false. */
	showValue?: boolean
}

type FillState = 'empty' | 'half' | 'full'

interface StarProps {
	fill: FillState
	index: number
}

const StarSvg: React.FC<StarProps> = ({ fill, index }) => {
	const clipId = `sr-clip-${index}`
	const path =
		'M12 2l2.73 5.53 6.11.89-4.42 4.31 1.04 6.07L12 15.9l-5.46 2.9 1.04-6.07L3.16 8.42l6.11-.89L12 2z'
	return (
		<svg viewBox='0 0 24 24' width='22' height='22' className='star-svg'>
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
	label,
	showValue = false,
}) => {
	const [hovered, setHovered] = useState<number | null>(null)

	// Convert backend 1-10 to display 0.5-5
	const displayValue = value !== null ? value / 2 : null
	const display = hovered ?? displayValue

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
		const backendValue = selected * 2
		onChange(value === backendValue ? null : backendValue)
	}

	return (
		<div className='star-rating'>
			{label && <span className='star-rating__label'>{label}</span>}
			<div className='star-rating__stars' onMouseLeave={() => setHovered(null)}>
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type='button'
						className='star-rating__star'
						onMouseMove={(e) => handleMouseMove(e, star)}
						onClick={(e) => handleClick(e, star)}
						disabled={disabled || saving}
						aria-label={`${star}`}>
						<StarSvg fill={getFill(star)} index={star} />
					</button>
				))}
			</div>
			{showValue && displayValue !== null && (
				<span className='star-rating__value'>
					{displayValue % 1 === 0 ? displayValue.toFixed(0) : displayValue.toFixed(1)}/5
				</span>
			)}
			{saving && <span className='star-rating__saving'>✓</span>}
		</div>
	)
}
