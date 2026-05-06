import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { selectActiveProfileId, selectIsAdmin } from '@/store/features/auth/selector'
import { exportData, importPreview, importData } from '@/services/StatsService/StatsService'
import { getProfileBlocks, unblockMediaForProfile } from '@/services/ProfileService/ProfileService'
import { getAdminProfileBlocks } from '@/services/AdminService/AdminService'
import { MediaType } from '@/models/api/Enums'
import type {
	ImportPreviewDto,
	ImportResultDto,
	ProfileBlockedItemDto,
	AdminProfileBlockDto,
} from '@/models/api'
import './DataManager.scss'

const DataManager: React.FC = () => {
	const { t, i18n } = useTranslation()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const isAdmin = useAppSelector(selectIsAdmin)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [preview, setPreview] = useState<ImportPreviewDto | null>(null)
	const [result, setResult] = useState<ImportResultDto | null>(null)
	const [file, setFile] = useState<File | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [skipDuplicates, setSkipDuplicates] = useState(true)
	const [overwriteDates, setOverwriteDates] = useState(false)
	const [exporting, setExporting] = useState(false)

	const [blocks, setBlocks] = useState<ProfileBlockedItemDto[] | AdminProfileBlockDto[] | null>(
		null
	)
	const [blocksLoading, setBlocksLoading] = useState(false)
	const [blocksError, setBlocksError] = useState<string | null>(null)
	const [adminProfileFilter, setAdminProfileFilter] = useState<number | null>(null)

	const loadBlocks = async () => {
		if (!activeProfileId) return
		setBlocksLoading(true)
		setBlocksError(null)
		try {
			if (isAdmin) {
				const data = await getAdminProfileBlocks()
				setBlocks(data)
			} else {
				const data = await getProfileBlocks(activeProfileId)
				setBlocks(data)
			}
		} catch (err: unknown) {
			setBlocksError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setBlocksLoading(false)
		}
	}

	useEffect(() => {
		if (activeProfileId) {
			void loadBlocks()
		}
	}, [activeProfileId, isAdmin])

	const handleUnblock = async (unblockProfileId: number, mediaItemId: number) => {
		await unblockMediaForProfile(unblockProfileId, mediaItemId)
		void loadBlocks()
	}

	const handleExport = async () => {
		if (!activeProfileId) return
		setExporting(true)
		try {
			await exportData(activeProfileId)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setExporting(false)
		}
	}

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (!selectedFile || !activeProfileId) return

		setFile(selectedFile)
		setPreview(null)
		setResult(null)
		setError(null)
		setLoading(true)

		try {
			const data = await importPreview(activeProfileId, selectedFile)
			setPreview(data)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setLoading(false)
		}
	}

	const handleImport = async () => {
		if (!file || !activeProfileId) return

		setLoading(true)
		setError(null)

		try {
			const data = await importData(activeProfileId, file, skipDuplicates, overwriteDates)
			setResult(data)
			setPreview(null)
			setFile(null)
			if (fileInputRef.current) fileInputRef.current.value = ''
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setLoading(false)
		}
	}

	const handleReset = () => {
		setPreview(null)
		setResult(null)
		setFile(null)
		setError(null)
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	if (!activeProfileId) {
		return (
			<div className='data-manager'>
				<h1 className='data-manager__title'>{t('dataManager.title')}</h1>
				<p>{t('profile.selectProfile')}</p>
			</div>
		)
	}

	return (
		<div className='data-manager'>
			<h1 className='data-manager__title'>{t('dataManager.title')}</h1>

			{/* Export */}
			<section className='data-manager__section'>
				<h2 className='data-manager__section-title'>{t('dataManager.export')}</h2>
				<p className='data-manager__description'>{t('dataManager.exportDescription')}</p>

				<button
					className='data-manager__btn data-manager__btn--primary'
					onClick={handleExport}
					disabled={exporting}>
					{exporting ? t('common.loading') : t('dataManager.downloadCsv')}
				</button>
			</section>

			{/* Import */}
			<section className='data-manager__section'>
				<h2 className='data-manager__section-title'>{t('dataManager.import')}</h2>
				<p className='data-manager__description'>{t('dataManager.importDescription')}</p>

				<input
					ref={fileInputRef}
					type='file'
					accept='.csv'
					onChange={handleFileSelect}
					className='data-manager__file-input'
				/>

				{loading && <p className='data-manager__loading'>{t('common.loading')}</p>}
				{error && <p className='data-manager__error'>{error}</p>}

				{/* Preview */}
				{preview && !result && (
					<div className='data-manager__preview'>
						<h3 className='data-manager__preview-title'>{t('dataManager.preview')}</h3>
						<div className='data-manager__preview-stats'>
							<span>
								{t('dataManager.totalRows')}: <strong>{preview.totalRows}</strong>
							</span>
							<span>
								{t('dataManager.validRows')}: <strong>{preview.validRows}</strong>
							</span>
							<span>
								{t('dataManager.duplicateRows')}: <strong>{preview.duplicateRows}</strong>
							</span>
							{preview.notFoundRows > 0 && (
								<span className='data-manager__warning'>
									{t('dataManager.notFoundRows')}: <strong>{preview.notFoundRows}</strong>
								</span>
							)}
						</div>

						{preview.errors.length > 0 && (
							<div className='data-manager__preview-errors'>
								<h4>{t('dataManager.errors')}</h4>
								<ul>
									{preview.errors.map((err, i) => (
										<li key={i}>{err}</li>
									))}
								</ul>
							</div>
						)}

						{preview.rows.length > 0 && (
							<div className='data-manager__preview-table-wrap'>
								<table className='data-manager__preview-table'>
									<thead>
										<tr>
											<th>{t('dataManager.colType')}</th>
											<th>{t('dataManager.colTitle')}</th>
											<th>{t('dataManager.colState')}</th>
											<th>{t('dataManager.colRating')}</th>
											<th>{t('dataManager.colStatus')}</th>
										</tr>
									</thead>
									<tbody>
										{preview.rows.map((row, i) => (
											<tr
												key={i}
												className={
													row.isNotFound
														? 'data-manager__row--not-found'
														: row.willBeAdded
															? 'data-manager__row--will-add'
															: row.isDuplicate
																? 'data-manager__row--duplicate'
																: ''
												}>
												<td>{row.type}</td>
												<td>
													{row.title}
													{row.seasonNumber != null && (
														<span className='data-manager__episode-info'>
															{' '}
															S{row.seasonNumber}E{row.episodeNumber}
														</span>
													)}
												</td>
												<td>{row.state}</td>
												<td>{row.rating ?? '—'}</td>
												<td>
													{row.isNotFound
														? t('dataManager.notFound')
														: row.willBeAdded
															? t('dataManager.willBeAdded')
															: row.isDuplicate
																? t('dataManager.duplicate')
																: t('dataManager.new')}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						<div className='data-manager__import-controls'>
							<label className='data-manager__checkbox'>
								<input
									type='checkbox'
									checked={skipDuplicates}
									onChange={(e) => setSkipDuplicates(e.target.checked)}
								/>
								{t('dataManager.skipDuplicates')}
							</label>
							<label className='data-manager__checkbox'>
								<input
									type='checkbox'
									checked={overwriteDates}
									onChange={(e) => setOverwriteDates(e.target.checked)}
								/>
								{t('dataManager.overwriteDates')}
							</label>
							<div className='data-manager__import-actions'>
								<button
									className='data-manager__btn data-manager__btn--secondary'
									onClick={handleReset}>
									{t('common.cancel')}
								</button>
								<button
									className='data-manager__btn data-manager__btn--primary'
									onClick={handleImport}
									disabled={loading || preview.validRows === 0}>
									{t('dataManager.importButton', { count: preview.validRows })}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Result */}
				{result && (
					<div className='data-manager__result'>
						<h3 className='data-manager__result-title'>{t('dataManager.importComplete')}</h3>
						<div className='data-manager__result-stats'>
							<span>
								{t('dataManager.imported')}: <strong>{result.imported}</strong>
							</span>
							<span>
								{t('dataManager.skipped')}: <strong>{result.skipped}</strong>
							</span>
						</div>
						{result.errors.length > 0 && (
							<div className='data-manager__result-errors'>
								<h4>{t('dataManager.errors')}</h4>
								<ul>
									{result.errors.map((err, i) => (
										<li key={i}>{err}</li>
									))}
								</ul>
							</div>
						)}
						<button
							className='data-manager__btn data-manager__btn--secondary'
							onClick={handleReset}>
							{t('dataManager.importAnother')}
						</button>
					</div>
				)}
			</section>

			{/* Blocked content */}
			<section className='data-manager__section'>
				<h2 className='data-manager__section-title'>{t('dataManager.blacklist')}</h2>
				<p className='data-manager__description'>{t('dataManager.blacklistDescription')}</p>

				{isAdmin && blocks && (
					<div className='data-manager__blacklist-filter'>
						<label className='data-manager__blacklist-label'>
							{t('dataManager.blacklistProfile')}:{' '}
						</label>
						<select
							value={adminProfileFilter ?? ''}
							onChange={(e) =>
								setAdminProfileFilter(e.target.value ? Number(e.target.value) : null)
							}
							className='data-manager__blacklist-select'>
							<option value=''>{t('dataManager.blacklistAllProfiles')}</option>
							{[
								...new Map(
									(blocks as AdminProfileBlockDto[]).map((b) => [b.profileId, b.profileName])
								).entries(),
							].map(([pid, pname]) => (
								<option key={pid} value={pid}>
									{pname}
								</option>
							))}
						</select>
					</div>
				)}

				{blocksLoading && (
					<p className='data-manager__loading'>{t('dataManager.blacklistLoading')}</p>
				)}
				{blocksError && <p className='data-manager__error'>{blocksError}</p>}

				{blocks && !blocksLoading && (
					<div className='data-manager__blacklist-table-wrap'>
						{(() => {
							const filtered = isAdmin
								? (blocks as AdminProfileBlockDto[]).filter(
										(b) => adminProfileFilter === null || b.profileId === adminProfileFilter
									)
								: (blocks as ProfileBlockedItemDto[])
							if (filtered.length === 0) {
								return (
									<p className='data-manager__blacklist-empty'>{t('dataManager.blacklistEmpty')}</p>
								)
							}
							return (
								<table className='data-manager__preview-table'>
									<thead>
										<tr>
											{isAdmin && <th>{t('dataManager.colProfile')}</th>}
											<th>{t('dataManager.colTitle')}</th>
											<th>{t('dataManager.colType')}</th>
											<th>{t('dataManager.colBlocked')}</th>
											<th />
										</tr>
									</thead>
									<tbody>
										{filtered.map((b) => {
											const isAdminBlock = 'profileId' in b
											const displayTitle =
												i18n.language === 'es' && b.spanishTitle ? b.spanishTitle : b.title
											const blockProfileId = isAdminBlock
												? (b as AdminProfileBlockDto).profileId
												: activeProfileId!
											return (
												<tr key={b.id}>
													{isAdmin && <td>{(b as AdminProfileBlockDto).profileName}</td>}
													<td>{displayTitle}</td>
													<td>{b.mediaType === MediaType.Movie ? '🎬' : '📺'}</td>
													<td>{new Date(b.blockedAt).toLocaleDateString(i18n.language)}</td>
													<td>
														<button
															className='data-manager__btn data-manager__btn--danger'
															onClick={() => void handleUnblock(blockProfileId, b.mediaItemId)}>
															{t('admin.unblockMedia')}
														</button>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							)
						})()}
					</div>
				)}
			</section>
		</div>
	)
}

export default DataManager
