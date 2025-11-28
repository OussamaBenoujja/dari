import { createBrowserRouter, Outlet } from 'react-router-dom'
import RootLayout from '../layouts/RootLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import WorkspaceLayout from '../layouts/WorkspaceLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import RequireAuth from '../components/auth/RequireAuth.jsx'
import RequireRole from '../components/auth/RequireRole.jsx'

import HomePage from '../pages/public/Home.jsx'
import SearchPage from '../pages/public/Search.jsx'
import ListingDetailPage from '../pages/public/ListingDetail.jsx'

import LoginPage from '../pages/auth/Login.jsx'
import RegisterPage from '../pages/auth/Register.jsx'
import VerifyEmailPage from '../pages/auth/VerifyEmail.jsx'
import TwoFactorPage from '../pages/auth/TwoFactor.jsx'
import ResetPasswordPage from '../pages/auth/ResetPassword.jsx'
import SsoCallbackPage from '../pages/auth/SsoCallback.jsx'

import MyListingsPage from '../pages/workspace/MyListings.jsx'
import CreateListingPage from '../pages/workspace/CreateListing.jsx'
import LeadsPage from '../pages/workspace/Leads.jsx'
import NotificationsCenterPage from '../pages/workspace/Notifications.jsx'
import FinancingPage from '../pages/workspace/Financing.jsx'
import ProfilePage from '../pages/workspace/Profile.jsx'
import SubscriptionsPage from '../pages/workspace/Subscriptions.jsx'
import DaretGroupsPage from '../pages/workspace/daret/Groups.jsx'
import DaretGroupDetailPage from '../pages/workspace/daret/GroupDetail.jsx'
import DaretHistoryPage from '../pages/workspace/daret/History.jsx'
import DaretTicketsPage from '../pages/workspace/daret/Tickets.jsx'

import AdminDashboardPage from '../pages/admin/Dashboard.jsx'
import ModerationPage from '../pages/admin/Moderation.jsx'
import PlansPage from '../pages/admin/Plans.jsx'
import KycPage from '../pages/admin/Kyc.jsx'
import SystemParamsPage from '../pages/admin/SystemParams.jsx'

import ForbiddenPage from '../pages/system/Forbidden.jsx'
import NotFoundPage from '../pages/system/NotFound.jsx'
import ErrorBoundaryPage from '../pages/system/ErrorBoundary.jsx'
import MaintenancePage from '../pages/system/Maintenance.jsx'
import CookiesConsentPage from '../pages/system/Cookies.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'listings/:listingId', element: <ListingDetailPage /> },
        ],
      },
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'verify-email', element: <VerifyEmailPage /> },
          { path: '2fa', element: <TwoFactorPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'sso/callback', element: <SsoCallbackPage /> },
        ],
      },
      {
        path: 'workspace',
        element: (
          <RequireAuth>
            <WorkspaceLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <MyListingsPage /> },
          { path: 'my-listings', element: <MyListingsPage /> },
          { path: 'create-listing', element: <CreateListingPage /> },
          { path: 'leads', element: <LeadsPage /> },
          { path: 'notifications', element: <NotificationsCenterPage /> },
          { path: 'financing', element: <FinancingPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'subscriptions', element: <SubscriptionsPage /> },
          {
            path: 'daret',
            element: <Outlet />,
            children: [
              { index: true, element: <DaretGroupsPage /> },
              { path: 'groups/:groupId', element: <DaretGroupDetailPage /> },
              { path: 'history', element: <DaretHistoryPage /> },
              { path: 'tickets', element: <DaretTicketsPage /> },
            ],
          },
        ],
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <RequireRole roles={['admin']}>
              <AdminLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'moderation', element: <ModerationPage /> },
          { path: 'plans', element: <PlansPage /> },
          { path: 'kyc', element: <KycPage /> },
          { path: 'system', element: <SystemParamsPage /> },
        ],
      },
      {
        path: 'system',
        element: <PublicLayout />,
        children: [
          { path: 'maintenance', element: <MaintenancePage /> },
          { path: 'cookies', element: <CookiesConsentPage /> },
        ],
      },
      { path: '403', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
