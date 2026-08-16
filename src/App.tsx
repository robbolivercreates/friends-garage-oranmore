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

      {/* Global Navbar (hidden in the staff portal — app chrome, not marketing) */}
      {activeTab !== 'admin' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenBooking={handleOpenBooking}
          onOpenEstimate={() => setIsEstimateOpen(true)}
          onOpenCallback={() => setIsCallbackOpen(true)}
        />
      )}

      {/* Slim staff chrome when in the portal */}
      {activeTab === 'admin' && (
        <header className="fixed top-0 inset-x-0 z-50 bg-ink-950/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={() => { setActiveTab('home'); window.scrollTo(0, 0); }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M22.7 6.3a1 1 0 0 0-1.4 0L19 8.6l-2.3-.7-.7-2.3a1 1 0 0 0-1.3-.6 6.5 6.5 0 0 0-8 8L3 16.7A2.1 2.1 0 1 0 6 19.7l3.7-3.7a6.5 6.5 0 0 0 8-8 1 1 0 0 0-.6-1.3L15 7.4l2.3-2.3a1 1 0 0 0 0-1.4z" transform="scale(0.9)"/></svg>
              </div>
              <span className="font-display font-bold text-white text-sm tracking-tight">
                FRIENDS<span className="text-brand-500">.</span>GARAGE
                <span className="text-ink-300 font-semibold text-xs ml-2 uppercase tracking-widest">Staff Portal</span>
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('home'); window.scrollTo(0, 0); }}
              className="text-xs font-semibold text-ink-300 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              ← View public site
            </button>
          </div>
        </header>
      )}

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

      {/* Global Footer (hidden in the staff portal) */}
      {activeTab !== 'admin' && (
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
      )}

      {/* Sticky Mobile Quick Action Bar (hidden in the staff portal) */}
      {activeTab !== 'admin' && (
        <StickyMobileCTA
          onOpenBooking={() => handleOpenBooking()}
          onOpenRoadside={() => { setActiveTab('roadside'); window.scrollTo(0,0); }}
          phone={settings.phone}
        />
      )}

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
