import { describe, it, expect } from 'vitest'

describe('Smoke test', () => {
	it('Vitest is working', () => {
		expect(1 + 1).toBe(2)
	})

	it('jest-dom matchers are available', () => {
		const div = document.createElement('div')
		div.textContent = 'Jellywatch'
		document.body.appendChild(div)
		expect(div).toBeInTheDocument()
		document.body.removeChild(div)
	})
})
