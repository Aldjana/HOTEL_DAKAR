import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../utils/permissions';
import LoginPage from '../features/auth/pages/LoginPage';
import { useT } from '../i18n';

const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const PlanningPage = lazy(() => import('../features/planning/pages/PlanningPage'));
const ReservationsListPage = lazy(() => import('../features/reservations/pages/ReservationsListPage'));
const NewReservationPage = lazy(() => import('../features/reservations/pages/NewReservationPage'));
const EditReservationPage = lazy(() => import('../features/reservations/pages/EditReservationPage'));
const ReservationDetailsPage = lazy(() => import('../features/reservations/pages/ReservationDetailsPage'));
const CheckInPage = lazy(() => import('../features/reservations/pages/CheckInPage'));
const CheckOutPage = lazy(() => import('../features/reservations/pages/CheckOutPage'));
const RoomsListPage = lazy(() => import('../features/rooms/pages/RoomsListPage'));
const ClientsListPage = lazy(() => import('../features/clients/pages/ClientsListPage'));
const ClientDetailsPage = lazy(() => import('../features/clients/pages/ClientDetailsPage'));
const PaymentsPage = lazy(() => import('../features/payments/pages/PaymentsPage'));
const CashPage = lazy(() => import('../features/cash/pages/CashPage'));
const InvoicesListPage = lazy(() => import('../features/invoices/pages/InvoicesListPage'));
const InvoiceDetailsPage = lazy(() => import('../features/invoices/pages/InvoiceDetailsPage'));
const HousekeepingPage = lazy(() => import('../features/housekeeping/pages/HousekeepingPage'));
const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));

const Guard = ({ permission, children }) => <ProtectedRoute permission={permission}>{children}</ProtectedRoute>;

const Home = () => {
  const { user } = useAuth();
  return user?.role === 'housekeeping' ? <Navigate to={homeFor(user.role)} replace /> : <DashboardPage />;
};

const NotFound = () => {
  const { t } = useT();
  return (
  <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p className="m-0 text-6xl font-bold text-slate-300">404</p>
    <h2 className="mt-2 text-xl font-semibold text-slate-700">{t('Page introuvable')}</h2>
    <Link to="/" className="mt-4 rounded-lg bg-[#0D1520] px-4 py-2 text-sm font-semibold text-white no-underline">{t('Retour à l\'accueil')}</Link>
  </div>
  );
};

const PageFallback = () => {
  const { t } = useT();
  return <Spinner label={t('Chargement de la page…')} className="min-h-[50vh]" />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Guard permission="dashboard.read"><Home /></Guard>} />
          <Route path="/planning" element={<Guard permission="planning.read"><PlanningPage /></Guard>} />
          <Route path="/reservations" element={<Guard permission="reservations.read"><ReservationsListPage /></Guard>} />
          <Route path="/reservations/new" element={<Guard permission="reservations.write"><NewReservationPage /></Guard>} />
          <Route path="/reservations/:id" element={<Guard permission="reservations.read"><ReservationDetailsPage /></Guard>} />
          <Route path="/reservations/:id/edit" element={<Guard permission="reservations.write"><EditReservationPage /></Guard>} />
          <Route path="/reservations/:id/check-in" element={<Guard permission="reservations.write"><CheckInPage /></Guard>} />
          <Route path="/reservations/:id/check-out" element={<Guard permission="reservations.write"><CheckOutPage /></Guard>} />
          <Route path="/rooms" element={<Guard permission="rooms.read"><RoomsListPage /></Guard>} />
          <Route path="/rooms/:id" element={<Guard permission="rooms.read"><RoomsListPage /></Guard>} />
          <Route path="/clients" element={<Guard permission="clients.read"><ClientsListPage /></Guard>} />
          <Route path="/clients/:id" element={<Guard permission="clients.read"><ClientDetailsPage /></Guard>} />
          <Route path="/payments" element={<Guard permission="payments.read"><PaymentsPage /></Guard>} />
          <Route path="/cash" element={<Guard permission="cash.read"><CashPage /></Guard>} />
          <Route path="/invoices" element={<Guard permission="invoices.read"><InvoicesListPage /></Guard>} />
          <Route path="/invoices/:id" element={<Guard permission="invoices.read"><InvoiceDetailsPage /></Guard>} />
          <Route path="/housekeeping" element={<Guard permission="housekeeping.read"><HousekeepingPage /></Guard>} />
          <Route path="/reports" element={<Guard permission="reports.read"><ReportsPage /></Guard>} />
          <Route path="/settings" element={<Guard permission="settings.update"><SettingsPage /></Guard>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRoutes;
