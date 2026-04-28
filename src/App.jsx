import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import MobileBottomNav from './components/layout/MobileBottomNav.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';
import { PageSkeleton } from './components/ui/SkeletonLoader.jsx';
import RouteSeo from './components/seo/RouteSeo.jsx';
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
const MyReviews = lazy(() => import('./pages/client/MyReviews.jsx'));
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
// Legal & info pages
const TermsOfService = lazy(() => import('./pages/shared/TermsOfService.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/shared/PrivacyPolicy.jsx'));
const AboutUs = lazy(() => import('./pages/shared/AboutUs.jsx'));
// Public SEO landings (Phase 6) — additive, do not affect existing flows
const CategoryLanding = lazy(() => import('./pages/shared/CategoryLanding.jsx'));
const ProviderPublicProfile = lazy(() => import('./pages/shared/ProviderPublicProfile.jsx'));

function App() {
  const { pendingVerification, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Ocultar header SOLO en /verificar-email si hay verificación pendiente o usuario no verificado
  const isVerifyRoute = location.pathname.startsWith('/verificar-email');
  const hideHeader = isVerifyRoute && (pendingVerification || (user && user.emailVerified !== true));

  // Add bottom padding on mobile when bottom-nav is visible (authenticated non-admin, non-hidden routes)
  const isHiddenRoute = ['/login','/registrarse','/unete','/registro-proveedor','/verificar-email','/olvide-contrasena','/restablecer-contrasena'].some(r => location.pathname.startsWith(r));
  const showBottomNav = user && !isHiddenRoute;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">{t('common.skipToContent')}</a>
      {/* Per-route SEO defaults (title, description, OG, canonical, hreflang, robots, BreadcrumbList JSON-LD).
          Pages may render their own <Seo /> to override with dynamic data. */}
      <RouteSeo />
      {!hideHeader && <Header />}
      <ErrorBoundary>
      {/*
        Main wrapper: intentionally WITHOUT `container mx-auto px-4 py-6`.
        Each page manages its own max-width and horizontal padding so that
        mobile layouts aren't double-padded (outer 16px + inner 16px = 32px
        of wasted horizontal space). Hero/gradient pages can now render
        edge-to-edge on mobile for a more modern, premium feel.
      */}
      <main id="main-content" role="main" tabIndex="-1" className={`flex-1 w-full${showBottomNav ? ' pb-24 md:pb-0' : ''}`}>
        <Suspense fallback={<PageSkeleton />}>
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
          <Route path="/mis-resenas" element={<MyReviews />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/notificaciones" element={<Notifications />} />
          <Route path="/payment/:intentId" element={<Payment />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          {/* Legal & info pages */}
          <Route path="/terminos" element={<TermsOfService />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/sobre-nosotros" element={<AboutUs />} />
          {/* Public SEO landings (Phase 6) */}
          <Route path="/categorias/:slug" element={<CategoryLanding />} />
          <Route path="/profesional/:id" element={<ProviderPublicProfile />} />
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
      <MobileBottomNav />
      <Footer />
    </div>
  );
}

export default App
