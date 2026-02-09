import { Routes, Route, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useMemo, useRef } from 'react';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';
import Spinner from './components/ui/Spinner.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import { useAuth } from './state/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

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
const ProviderReviews = lazy(() => import('./pages/provider/Reviews.jsx'));
const RequestDetail = lazy(() => import('./pages/provider/RequestDetail.jsx'));
const ClientRequests = lazy(() => import('./pages/client/Requests.jsx'));
const ClientRequestProposals = lazy(() => import('./pages/client/RequestProposals.jsx'));
const CreateRequest = lazy(() => import('./pages/client/CreateRequest.jsx'));
const ClientMessages = lazy(() => import('./pages/client/Messages.jsx'));
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
  const { pendingVerification, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const historyStackRef = useRef([]);
  const isHandlingPopRef = useRef(false);
  const hasPushedGuardRef = useRef(false);
  const isMobileDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);
  // Ocultar header SOLO en /verificar-email si hay verificación pendiente o usuario no verificado
  const isVerifyRoute = location.pathname.startsWith('/verificar-email');
  const hideHeader = isVerifyRoute && (pendingVerification || (user && user.emailVerified !== true));

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    if (!isHandlingPopRef.current) {
      const stack = historyStackRef.current;
      if (stack[stack.length - 1] !== path) {
        stack.push(path);
        if (stack.length > 50) {
          stack.shift();
        }
      }
    }
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!isMobileDevice) return;

    if (!hasPushedGuardRef.current) {
      hasPushedGuardRef.current = true;
      const guardPath = `${location.pathname}${location.search}${location.hash}`;
      navigate(guardPath, {
        replace: false,
        state: { ...(location.state || {}), __appGuard: true }
      });
    }

    const handlePopState = () => {
      const stack = historyStackRef.current;
      if (stack.length > 1) {
        stack.pop();
        const prev = stack[stack.length - 1];
        isHandlingPopRef.current = true;
        navigate(prev, { replace: true });
        setTimeout(() => {
          isHandlingPopRef.current = false;
        }, 0);
      } else {
        isHandlingPopRef.current = true;
        navigate('/', { replace: true });
        setTimeout(() => {
          isHandlingPopRef.current = false;
        }, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobileDevice, location.pathname, location.search, location.hash, location.state, navigate]);
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      {!hideHeader && <Header />}
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
          <Route path="/registro-proveedor" element={<RegisterProvider />} />
          <Route path="/provider/onboarding" element={<Onboarding />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/empleos" element={<Jobs />} />
          <Route path="/empleos/:id" element={<RequestDetail />} />
          <Route path="/mensajes" element={<Inbox />} />
          <Route path="/portafolio" element={<Portfolio />} />
          <Route path="/resenas" element={<ProviderReviews />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/referidos" element={<Referrals />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/mis-solicitudes" element={<ClientRequests />} />
          <Route path="/mis-solicitudes/nueva" element={<CreateRequest />} />
          <Route path="/mis-solicitudes/:id/propuestas" element={<ClientRequestProposals />} />
          <Route path="/mis-mensajes" element={<ClientMessages />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/notificaciones" element={<Notifications />} />
          <Route path="/payment/:intentId" element={<Payment />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
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
