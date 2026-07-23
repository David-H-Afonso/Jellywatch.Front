import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/features/auth/selector'
import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import {
	householdScopeDetails,
	parseHouseholdAuthorizationRequest,
} from './householdAuthorizationRequest'
import './HouseholdAuthorize.scss'

interface AuthorizeResponse {
	redirectUri: string
}

export default function HouseholdAuthorize() {
	const location = useLocation()
	const user = useAppSelector(selectCurrentUser)
	const request = useMemo(() => parseHouseholdAuthorizationRequest(location.search), [location.search])
	const [profileId, setProfileId] = useState<number | null>(user?.profiles[0]?.id ?? null)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const submitDecision = async (approved: boolean) => {
		if (!request || (approved && profileId == null)) return
		setSubmitting(true)
		setError(null)
		try {
			const response = await customFetch<AuthorizeResponse>(
				environment.apiRoutes.integrations.householdAuthorize,
				{
					method: 'POST',
					body: {
						...request,
						profileId: approved ? profileId : null,
						approved,
					},
				}
			)
			globalThis.location.assign(response.redirectUri)
		} catch {
			setError('Jellywatch could not complete this authorization request. Please try again.')
			setSubmitting(false)
		}
	}

	if (!request) {
		return (
			<main className='household-consent-page'>
				<section className='household-consent-card' aria-labelledby='invalid-request-title'>
					<p className='household-consent-eyebrow'>Household connection</p>
					<h1 id='invalid-request-title'>Invalid authorization request</h1>
					<p>The request is incomplete or asks for unsupported access. Return to Household and try again.</p>
				</section>
			</main>
		)
	}

	return (
		<main className='household-consent-page'>
			<section className='household-consent-card' aria-labelledby='consent-title'>
				<header>
					<div className='household-consent-mark' aria-hidden='true'>H</div>
					<div>
						<p className='household-consent-eyebrow'>Household connection</p>
						<h1 id='consent-title'>Connect Household to Jellywatch?</h1>
					</div>
				</header>

				<p className='household-consent-account'>
					Signed in as <strong>{user?.username}</strong>. Household will only access the profile you choose.
				</p>

				<fieldset className='household-profile-picker'>
					<legend>Choose a Jellywatch profile</legend>
					{user?.profiles.map((profile) => (
						<label key={profile.id} className={profileId === profile.id ? 'is-selected' : ''}>
							<input
								type='radio'
								name='household-profile'
								value={profile.id}
								checked={profileId === profile.id}
								onChange={() => setProfileId(profile.id)}
							/>
							<span>{profile.displayName}</span>
						</label>
					))}
				</fieldset>

				<div className='household-scope-list'>
					<h2>Household is requesting</h2>
					<ul>
						{request.scopes.map((scope) => (
							<li key={scope}>
								<span aria-hidden='true'>✓</span>
								<div><strong>{householdScopeDetails[scope][0]}</strong><small>{householdScopeDetails[scope][1]}</small></div>
							</li>
						))}
					</ul>
				</div>

				<p className='household-consent-note'>You can revoke this connection later. Your Jellyfin password is never shared with Household.</p>
				{error && <p className='household-consent-error' role='alert'>{error}</p>}

				<div className='household-consent-actions'>
					<button type='button' className='deny' disabled={submitting} onClick={() => void submitDecision(false)}>Deny</button>
					<button type='button' className='approve' disabled={submitting || profileId == null} onClick={() => void submitDecision(true)}>
						{submitting ? 'Connecting…' : 'Approve connection'}
					</button>
				</div>
			</section>
		</main>
	)
}
