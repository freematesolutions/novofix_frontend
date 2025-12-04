import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Lazy-loaded pages for code-splitting
const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const RegisterClient = lazy(() => import('./pages/auth/RegisterClient.jsx'));
const RegisterProvider = lazy(() => import('./pages/auth/RegisterProvider.jsx'));
const Onboarding = lazy(() => import('./pages/provider/Onboarding.jsx'));
const Plan = lazy(() => import('./pages/provider/Plan.jsx'));
const Profile = lazy(() => import('./pages/account/Profile.jsx'));
const Services = lazy(() => import('./pages/provider/Services.jsx'));
const Jobs = lazy(() => import('./pages/provider/Jobs.jsx'));
const Inbox = lazy(() => import('./pages/provider/Inbox.jsx'));
const Calendar = lazy(() => import('./pages/provider/Calendar.jsx'));
const Referrals = lazy(() => import('./pages/provider/Referrals.jsx'));
const Portfolio = lazy(() => import('./pages/provider/Portfolio.jsx'));
const RequestDetail = lazy(() => import('./pages/provider/RequestDetail.jsx'));
const ClientRequests = lazy(() => import('./pages/client/Requests.jsx'));
const ClientRequestProposals = lazy(() => import('./pages/client/RequestProposals.jsx'));
const CreateRequest = lazy(() => import('./pages/client/CreateRequest.jsx'));
const Bookings = lazy(() => import('./pages/shared/Bookings.jsx'));
const Payment = lazy(() => import('./pages/payment/Payment.jsx'));
const Notifications = lazy(() => import('./pages/shared/Notifications.jsx'));
// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'));
const AdminModeration = lazy(() => import('./pages/admin/Moderation.jsx'));
const AdminRequests = lazy(() => import('./pages/admin/Requests.jsx'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings.jsx'));
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts.jsx'));

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <Header />
      <ErrorBoundary>
      <main id="main-content" role="main" tabIndex="-1" className="flex-1 container mx-auto px-4 py-6">
        <Suspense fallback={<div className="flex items-center gap-2 text-gray-600"><Spinner size="sm"/> Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/olvide-contrasena" element={<ForgotPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />
          <Route path="/registrarse" element={<RegisterClient />} />
          <Route path="/unete" element={<RegisterProvider />} />
          <Route path="/provider/onboarding" element={<Onboarding />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/empleos" element={<Jobs />} />
          <Route path="/empleos/:id" element={<RequestDetail />} />
          <Route path="/mensajes" element={<Inbox />} />
          <Route path="/portafolio" element={<Portfolio />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/referidos" element={<Referrals />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/mis-solicitudes" element={<ClientRequests />} />
          <Route path="/mis-solicitudes/nueva" element={<CreateRequest />} />
          <Route path="/mis-solicitudes/:id/propuestas" element={<ClientRequestProposals />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/notificaciones" element={<Notifications />} />
          <Route path="/payment/:intentId" element={<Payment />} />
          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/moderacion" element={<AdminModeration />} />
          <Route path="/admin/alertas" element={<AdminAlerts />} />
          <Route path="/admin/solicitudes" element={<AdminRequests />} />
          <Route path="/admin/reservas" element={<AdminBookings />} />
          <Route path="/admin/reportes" element={<AdminReports />} />
        </Routes>
        </Suspense>
      </main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}

export default App
