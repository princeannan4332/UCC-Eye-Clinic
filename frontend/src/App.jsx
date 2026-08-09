import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AssistantDashboard from './pages/AssistantDashboard';
import NavigationTourPage from './pages/NavigationTourPage';
import VoiceTranslationPage from './pages/VoiceTranslationPage';

function AppContent() {
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive initial page from URL path or stored session
  const getPageFromPath = (path) => {
    const p = path.toLowerCase().replace(/\/$/, '');
    if (p === '/services') return 'services';
    if (p === '/about') return 'about';
    if (p === '/contact') return 'contact';
    if (p === '/login') return 'login';
    if (p === '/signup') return 'signup';
    if (p === '/onboarding') return 'onboarding';
    if (p === '/portal' || p === '/dashboard') return 'portal';
    if (p === '/home' || p === '/landing' || p === '') return 'home';
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState(() => {
    const pageFromUrl = getPageFromPath(window.location.pathname);
    if (pageFromUrl && pageFromUrl !== 'home') return pageFromUrl;
    const savedPage = localStorage.getItem('optiflow_current_page');
    if (savedPage) return savedPage;
    return 'home';
  });

  // Keep browser history/URL path in sync
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync page state when user logs in or out and enforce onboarding completion guard
  useEffect(() => {
    if (profile) {
      if (profile.role === 'student' && !profile.onboarding_completed) {
        if (currentPage !== 'onboarding' && currentPage !== 'home' && currentPage !== 'services' && currentPage !== 'about' && currentPage !== 'contact') {
          setCurrentPage('onboarding');
          if (window.location.pathname !== '/onboarding') {
            window.history.pushState(null, '', '/onboarding');
          }
        }
      } else if (currentPage === 'login' || currentPage === 'signup') {
        setCurrentPage('portal');
        window.history.pushState(null, '', '/portal');
      }
    } else if (!profile && ['portal', 'dashboard', 'onboarding', 'student-booking', 'student-track', 'admin-capacity', 'admin-bookings', 'doctor-dashboard', 'doctor-assistant-tracker'].includes(currentPage)) {
      setCurrentPage('login');
      window.history.pushState(null, '', '/login');
    }
  }, [profile, currentPage]);

  const handleNavigate = (page, params = {}) => {
    // If user is a patient and has not completed onboarding, force redirection to onboarding
    if (profile && profile.role === 'student' && !profile.onboarding_completed) {
      if (page !== 'home' && page !== 'landing' && page !== 'services' && page !== 'about' && page !== 'contact') {
        page = 'onboarding';
      }
    }

    // If user is already logged in, route them away from auth pages
    if (profile && (page === 'login' || page === 'signup')) {
      if (!profile.onboarding_completed && profile.role === 'student') {
        page = 'onboarding';
      } else {
        page = 'portal';
      }
    }

    let targetPage = page;
    let path = '/home';

    if (page === 'home' || page === 'landing') {
      targetPage = 'home';
      path = '/home';
    } else if (page === 'services') {
      path = '/services';
    } else if (page === 'about') {
      path = '/about';
    } else if (page === 'contact') {
      path = '/contact';
    } else if (page === 'login') {
      path = '/login';
    } else if (page === 'signup') {
      path = '/signup';
    } else if (page === 'onboarding') {
      path = '/onboarding';
    } else if (page === 'portal' || page === 'dashboard') {
      targetPage = 'portal';
      path = '/portal';
    } else if (page === 'doctor-dashboard') {
      targetPage = 'doctor-dashboard';
      path = '/portal';
    } else if (page === 'doctor-assistant-tracker') {
      targetPage = 'doctor-assistant-tracker';
      path = '/portal';
    } else {
      path = `/${page}`;
    }

    setCurrentPage(targetPage);
    localStorage.setItem('optiflow_current_page', targetPage);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;

      case 'services':
        return <ServicesPage onNavigate={handleNavigate} />;

      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;

      case 'contact':
        return <ContactPage onNavigate={handleNavigate} />;

      case 'login':
      case 'signup':
        return <AuthPage onNavigate={handleNavigate} />;

      case 'onboarding':
        return <OnboardingPage onNavigate={handleNavigate} />;

      case 'portal':
      case 'dashboard':
        if (profile?.role === 'superadmin') {
          return <SuperAdminDashboard onNavigate={handleNavigate} />;
        }
        if (profile?.role === 'doctor_assistant') {
          return <AssistantDashboard onNavigate={handleNavigate} />;
        }
        if (profile?.role === 'admin') {
          return <AdminDashboard activeTab="bookings" onNavigate={handleNavigate} />;
        }
        if (profile?.role === 'doctor') {
          return <DoctorDashboard activeTab="dashboard" onNavigate={handleNavigate} />;
        }
        if (profile?.role === 'student' && !profile?.onboarding_completed) {
          return <OnboardingPage onNavigate={handleNavigate} />;
        }
        return <StudentDashboard activeTab="dashboard" onNavigate={handleNavigate} />;

      case 'doctor-dashboard':
        if (profile?.role === 'doctor') {
          return <DoctorDashboard activeTab="consultations" onNavigate={handleNavigate} />;
        }
        return <DoctorDashboard activeTab="consultations" onNavigate={handleNavigate} />;

      case 'doctor-assistant-tracker':
        return <DoctorDashboard activeTab="assistant-tracker" onNavigate={handleNavigate} />;

      case 'student-booking':
        if (profile?.role === 'student' && !profile?.onboarding_completed) {
          return <OnboardingPage onNavigate={handleNavigate} />;
        }
        return <StudentDashboard activeTab="booking" onNavigate={handleNavigate} />;

      case 'student-track':
        if (profile?.role === 'student' && !profile?.onboarding_completed) {
          return <OnboardingPage onNavigate={handleNavigate} />;
        }
        return <StudentDashboard activeTab="track" onNavigate={handleNavigate} />;

      case 'admin-capacity':
        return <AdminDashboard activeTab="capacity" onNavigate={handleNavigate} />;

      case 'admin-bookings':
        return <AdminDashboard activeTab="bookings" onNavigate={handleNavigate} />;

      case 'navigation-tour':
        return <NavigationTourPage />;

      case 'voice-translation':
        return <VoiceTranslationPage />;

      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const isPortalLayout = [
    'portal',
    'dashboard',
    'doctor-dashboard',
    'doctor-assistant-tracker',
    'student-booking',
    'student-track',
    'admin-capacity',
    'admin-bookings',
    'navigation-tour',
    'voice-translation'
  ].includes(currentPage);

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col font-sans">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {isPortalLayout ? (
        <div className="flex-1 flex w-full">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px]">
            {renderPage()}
          </main>
        </div>
      ) : (

        <main className="flex-1">
          {renderPage()}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
