import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import RequireRole from './components/RequireRole';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/buyer/Onboarding';
import Dashboard from './pages/buyer/Dashboard';
import VisitDetail from './pages/buyer/VisitDetail';
import Sos from './pages/buyer/Sos';
import Book from './pages/buyer/Book';
import Billing from './pages/buyer/Billing';
import Messages from './pages/buyer/Messages';
import Timeline from './pages/buyer/Timeline';
import Console from './pages/caremanager/Console';
import FieldApp from './pages/caregiver/FieldApp';
import ParentApp from './pages/parent/ParentApp';
import AdminConsole from './pages/admin/AdminConsole';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return <Navigate to={user ? `/${user.role}` : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route path="/buyer" element={<RequireRole role="buyer"><Dashboard /></RequireRole>} />
              <Route path="/buyer/onboarding" element={<RequireRole role="buyer"><Onboarding /></RequireRole>} />
              <Route path="/buyer/visits/:id" element={<RequireRole role="buyer"><VisitDetail /></RequireRole>} />
              <Route path="/buyer/sos" element={<RequireRole role="buyer"><Sos /></RequireRole>} />
              <Route path="/buyer/book" element={<RequireRole role="buyer"><Book /></RequireRole>} />
              <Route path="/buyer/billing" element={<RequireRole role="buyer"><Billing /></RequireRole>} />
              <Route path="/buyer/messages" element={<RequireRole role="buyer"><Messages /></RequireRole>} />
              <Route path="/buyer/timeline" element={<RequireRole role="buyer"><Timeline /></RequireRole>} />

              <Route path="/care_manager" element={<RequireRole role="care_manager"><Console /></RequireRole>} />
              <Route path="/caregiver" element={<RequireRole role="caregiver"><FieldApp /></RequireRole>} />
              <Route path="/parent" element={<RequireRole role="parent"><ParentApp /></RequireRole>} />
              <Route path="/admin" element={<RequireRole role="admin"><AdminConsole /></RequireRole>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
