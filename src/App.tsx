import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StickyMobileCTA } from './components/StickyMobileCTA';
import { CookieBanner } from './components/CookieBanner';
import { CallbackModal } from './components/CallbackModal';
import { EstimateModal } from './components/EstimateModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SEOHead } from './components/SEOHead';

import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { AboutPage } from './pages/AboutPage';
import { TeamPage } from './pages/TeamPage';
import { BookingPage } from './pages/BookingPage';
import { RoadsidePage } from './pages/RoadsidePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PrivacyPolicyPage, CookiePolicyPage, TermsConditionsPage, NotFoundPage } from './pages/LegalPages';

import { ServiceItem, TeamMember, Review, SiteSettings } from './types';
import { INITIAL_SERVICES, INITIAL_TEAM, INITIAL_REVIEWS, INITIAL_SETTINGS } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);

  // Modals & Sub-states
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [isEstimateOpen, setIsEstimateOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  const [bookingPreSelectedServiceId, setBookingPreSelectedServiceId] = useState<string | undefined>();
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceItem | null>(null);

  // Load server data on mount
  useEffect(() => {
    const loadServerData = async () => {
      try {
        const [sRes, tRes, rRes, setRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/team'),
          fetch('/api/reviews'),
          fetch('/api/settings')
        ]);
        if (sRes.ok) setServices(await sRes.json());
        if (tRes.ok) setTeam(await tRes.json());
        if (rRes.ok) setReviews(await rRes.json());
        if (setRes.ok) setSettings(await setRes.json());
      } catch (err) {
        console.error('Failed fetching server initial data, using fallback defaults', err);
      }
    };

    loadServerData();

    // Check existing admin token
    const token = localStorage.getItem('fg_admin_token');
    if (token) {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleOpenBooking = (serviceId?: string) => {
    if (serviceId) {
      setBookingPreSelectedServiceId(serviceId);
    }
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddReview = async (newRev: Partial<Review>) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRev)
      });
      if (res.ok) {
        const saved = await res.json();
        setReviews([saved, ...reviews]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('fg_admin_token');
    setIsAdminAuthenticated(false);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen flex flex-col font-['Plus_Jakarta_Sans'] bg-[#F8F9FA] text-[#17191D] selection:bg-[#D5004F] selection:text-white">
      <SEOHead
        title={
          activeTab === 'home'
            ? 'Friends Garage | Trusted Car Servicing & Repairs in Oranmore, Galway'
            : activeTab === 'services'
            ? 'Car Services, Diagnostics & Brakes | Friends Garage Oranmore'
            : activeTab === 'booking'
            ? 'Book Appointment Online | Friends Garage Oranmore, Galway'
            : activeTab === 'roadside'
            ? 'Emergency Roadside Assistance Galway & Oranmore | Friends Garage'
            : 'Friends Garage Oranmore Co. Galway'
        }
      />

      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBooking={handleOpenBooking}
        onOpenEstimate={() => setIsEstimateOpen(true)}
        onOpenCallback={() => setIsCallbackOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-grow">
        {activeTab === 'home' && (
          <HomePage
            services={services}
            team={team}
            reviews={reviews}
            settings={settings}
            setActiveTab={setActiveTab}
            onOpenBooking={handleOpenBooking}
            onOpenEstimate={() => setIsEstimateOpen(true)}
            onOpenCallback={() => setIsCallbackOpen(true)}
            onSelectServiceDetail={(service) => setSelectedServiceDetail(service)}
          />
        )}

        {activeTab === 'services' && (
          <ServicesPage
            services={services}
            onOpenBooking={handleOpenBooking}
            onOpenEstimate={() => setIsEstimateOpen(true)}
            selectedServiceDetail={selectedServiceDetail}
            setSelectedServiceDetail={setSelectedServiceDetail}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage
            settings={settings}
            setActiveTab={setActiveTab}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {activeTab === 'team' && (
          <TeamPage
            team={team}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {activeTab === 'booking' && (
          <BookingPage
            services={services}
            settings={settings}
            initialServiceId={bookingPreSelectedServiceId}
          />
        )}

        {activeTab === 'roadside' && (
          <RoadsidePage settings={settings} />
        )}

        {activeTab === 'reviews' && (
          <ReviewsPage
            reviews={reviews}
            onAddReview={handleAddReview}
          />
        )}

        {activeTab === 'contact' && (
          <ContactPage settings={settings} />
        )}

        {activeTab === 'privacy' && <PrivacyPolicyPage />}
        {activeTab === 'cookies' && <CookiePolicyPage />}
        {activeTab === 'terms' && <TermsConditionsPage />}

        {activeTab === 'admin' && (
          isAdminAuthenticated ? (
            <AdminDashboard onLogout={handleAdminLogout} />
          ) : (
            <div className="pt-32 pb-24 text-center space-y-4">
              <h2 className="text-xl font-bold font-['Sora']">Restricted Admin Area</h2>
              <p className="text-xs text-gray-600">Please authenticate as workshop staff to access this portal.</p>
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="px-6 py-2.5 bg-[#D5004F] text-white font-bold text-xs rounded-xl"
              >
                Open Login Window
              </button>
            </div>
          )
        )}

        {![
          'home', 'services', 'about', 'team', 'booking',
          'roadside', 'reviews', 'contact', 'privacy',
          'cookies', 'terms', 'admin'
        ].includes(activeTab) && (
          <NotFoundPage setActiveTab={setActiveTab} />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        settings={settings}
        setActiveTab={setActiveTab}
        onOpenAdminLogin={() => {
          if (isAdminAuthenticated) {
            setActiveTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onOpenBooking={handleOpenBooking}
      />

      {/* Sticky Mobile Quick Action Bar */}
      <StickyMobileCTA
        onOpenBooking={() => handleOpenBooking()}
        onOpenRoadside={() => { setActiveTab('roadside'); window.scrollTo(0,0); }}
        phone={settings.phone}
      />

      {/* GDPR Consent Banner */}
      <CookieBanner />

      {/* Modals */}
      <CallbackModal
        isOpen={isCallbackOpen}
        onClose={() => setIsCallbackOpen(false)}
      />

      <EstimateModal
        isOpen={isEstimateOpen}
        onClose={() => setIsEstimateOpen(false)}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
