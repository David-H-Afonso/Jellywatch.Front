import React from 'react'
import { createHashRouter } from 'react-router-dom'
import { AppLayout, EmptyLayout } from '@/layouts'
import Dashboard from '@/components/Dashboard/Dashboard'
import SeriesList from '@/components/Series/SeriesList/SeriesList'
import SeriesDetail from '@/components/Series/SeriesDetail/SeriesDetail'
import MoviesList from '@/components/Movies/MoviesList/MoviesList'
import MovieDetail from '@/components/Movies/MovieDetail/MovieDetail'
import Activity from '@/components/Activity/Activity'
import Wrapped from '@/components/Wrapped/Wrapped'
import Calendar from '@/components/Calendar/Calendar'
import DataManager from '@/components/DataManager/DataManager'
const BackupSchedule = React.lazy(() => import('@/components/DataManager/BackupSchedule'))
const BackupScheduleAdmin = React.lazy(() => import('@/components/DataManager/BackupScheduleAdmin'))
import { Login, ProtectedRoute, PublicRoute } from '@/components/Auth'
import { RouteError, NotFound } from '@/components/errors'

const Admin = React.lazy(() => import('@/components/Admin/Admin'))
const Person = React.lazy(() => import('@/components/Person/Person'))

const protectedRoute = (element: React.ReactNode) => (
	<ProtectedRoute>
		<AppLayout>{element}</AppLayout>
	</ProtectedRoute>
)

export const router = createHashRouter([
	{
		path: '/login',
		element: (
			<PublicRoute>
				<EmptyLayout>
					<Login />
				</EmptyLayout>
			</PublicRoute>
		),
		errorElement: <RouteError />,
	},
	{
		path: '/',
		element: protectedRoute(<Dashboard />),
		errorElement: <RouteError />,
	},
	{
		path: '/series',
		element: protectedRoute(<SeriesList />),
		errorElement: <RouteError />,
	},
	{
		path: '/series/:id',
		element: protectedRoute(<SeriesDetail />),
		errorElement: <RouteError />,
	},
	{
		path: '/movies',
		element: protectedRoute(<MoviesList />),
		errorElement: <RouteError />,
	},
	{
		path: '/movies/:id',
		element: protectedRoute(<MovieDetail />),
		errorElement: <RouteError />,
	},
	{
		path: '/activity',
		element: protectedRoute(<Activity />),
		errorElement: <RouteError />,
	},
	{
		path: '/wrapped',
		element: protectedRoute(<Wrapped />),
		errorElement: <RouteError />,
	},
	{
		path: '/calendar',
		element: protectedRoute(<Calendar />),
		errorElement: <RouteError />,
	},
	{
		path: '/data',
		element: protectedRoute(<DataManager />),
		errorElement: <RouteError />,
	},
	{
		path: '/backup-schedule',
		element: protectedRoute(
			<React.Suspense fallback={<div>Loading...</div>}>
				<BackupSchedule />
			</React.Suspense>
		),
		errorElement: <RouteError />,
	},
	{
		path: '/backup-schedule-admin',
		element: protectedRoute(
			<React.Suspense fallback={<div>Loading...</div>}>
				<BackupScheduleAdmin />
			</React.Suspense>
		),
		errorElement: <RouteError />,
	},
	{
		path: '/person/:tmdbPersonId',
		element: protectedRoute(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Person />
			</React.Suspense>
		),
		errorElement: <RouteError />,
	},
	{
		path: '/admin',
		element: protectedRoute(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Admin />
			</React.Suspense>
		),
		errorElement: <RouteError />,
	},
	{
		path: '*',
		element: (
			<EmptyLayout>
				<NotFound />
			</EmptyLayout>
		),
	},
])
