import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HealthMapsAuthProvider } from './context/HealthMapsAuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Health Maps Pages
import HealthMapsLogin from './pages/HealthMapsLogin';
import HealthMapsRegister from './pages/HealthMapsRegister';
import HealthMapsClientDashboard from './pages/HealthMapsClientDashboard';
import HealthMapsAdminDashboard from './pages/HealthMapsAdminDashboard';

// Route Protection
import { HealthMapsClientRoute, HealthMapsAdminRoute, HealthMapsRoleBasedRedirect } from './components/HealthMapsRoleBasedRoutes';

function HealthMapsApp() {
  console.log('Health Maps App rendering');
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HealthMapsAuthProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<HealthMapsLogin />} />
                <Route path="/register" element={<HealthMapsRegister />} />
                
                {/* Role-based redirect root */}
                <Route path="/auth-redirect" element={<HealthMapsRoleBasedRedirect />} />
                
                {/* Client Dashboard Routes - Protected for Clients Only */}
                <Route path="/dashboard" element={
                  <HealthMapsClientRoute>
                    <HealthMapsClientDashboard />
                  </HealthMapsClientRoute>
                } />
                
                {/* Admin Dashboard Routes - Protected for Admin Only */}
                <Route path="/admin" element={
                  <HealthMapsAdminRoute>
                    <HealthMapsAdminDashboard />
                  </HealthMapsAdminRoute>
                } />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Router>
        </HealthMapsAuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default HealthMapsApp;
