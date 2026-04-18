import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/EnhancedAuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Public Pages
import Home from './pages/Home';
import HomeDashboard from './components/HomeDashboard';
import MainDashboard from './pages/MainDashboard';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import HealthMaps from './pages/HealthMaps';

// Auth Components
import Login from './pages/Login';
import Register from './pages/Register';
import OptimizedAdminLogin from './components/OptimizedAdminLogin';
import AdminLogin from './pages/AdminLogin';

// Dashboard Components
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Profile from './pages/Profile';
import InstantAnalysis from './pages/InstantAnalysis';
import ClubHealthMap from './pages/ClubHealthMap';

// Admin Components
import AdminDashboardHome from './pages/AdminDashboardHome';
import AdminManageClubs from './pages/AdminManageClubs';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import CompleteAdminDashboard from './pages/CompleteAdminDashboard';
import SimpleAdminDashboard from './components/SimpleAdminDashboard';
import UploadSection from './pages/UploadSection';

// Route Protection
import { ClientRoute, AdminRoute, RoleBasedRedirect } from './components/RoleBasedRoutes';

function App() {
  console.log('App rendering');
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomeDashboard />} />
                <Route path="/home" element={<Home />} />
                <Route path="/healthmaps" element={<HealthMaps />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-login" element={<OptimizedAdminLogin />} />
                <Route path="/admin-signin" element={<AdminLogin />} />
                
                {/* Role-based redirect root */}
                <Route path="/auth-redirect" element={<RoleBasedRedirect />} />
                
                {/* Admin Dashboard Routes - Protected for Admin Only */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }>
                  <Route index element={<CompleteAdminDashboard />} />
                  <Route path="dashboard" element={<CompleteAdminDashboard />} />
                  <Route path="users" element={<CompleteAdminDashboard />} />
                  <Route path="clubs" element={<AdminManageClubs />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="upload" element={<UploadSection />} />
                </Route>
                <Route path="/admin/dashboard" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                
                {/* Client Dashboard Routes - Temporarily simplified for testing */}
                <Route path="/dashboard" element={
                  <ClientRoute>
                    <DashboardHome />
                  </ClientRoute>
                } />
                <Route path="/dashboard/profile" element={
                  <ClientRoute>
                    <Profile />
                  </ClientRoute>
                } />
                <Route path="/dashboard/instant-analysis" element={
                  <ClientRoute>
                    <InstantAnalysis />
                  </ClientRoute>
                } />
                <Route path="/dashboard/health-map" element={
                  <ClientRoute>
                    <ClubHealthMap />
                  </ClientRoute>
                } />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
