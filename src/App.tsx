import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { ClassroomPage } from './pages/ClassroomPage';
import { AccountPage } from './pages/AccountPage';
import { UnitArrangementPage } from './pages/UnitArrangementPage';
import { LiftTrackerPage } from './pages/LiftTrackerPage';
import { TrafficStatusPage } from './pages/TrafficStatusPage';
import { ParkingPage } from './pages/ParkingPage';
import { LibrarySeatsPage } from './pages/LibrarySeatsPage';
import { CanteenSeatsPage } from './pages/CanteenSeatsPage';
import { EmergencyContactsPage } from './pages/EmergencyContactsPage';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/classrooms" element={<ClassroomPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/unit-arrangement" element={<UnitArrangementPage />} />
        <Route path="/lift-tracker" element={<LiftTrackerPage />} />
        <Route path="/traffic-status" element={<TrafficStatusPage />} />
        <Route path="/parking" element={<ParkingPage />} />
        <Route path="/library-seats" element={<LibrarySeatsPage />} />
        <Route path="/canteen-seats" element={<CanteenSeatsPage />} />
        <Route path="/emergency-contacts" element={<EmergencyContactsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
