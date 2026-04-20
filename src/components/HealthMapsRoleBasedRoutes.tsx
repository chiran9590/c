import React from 'react';
import { Navigate } from 'react-router-dom';
import { useHealthMapsAuth } from '../context/HealthMapsAuthContext';

interface ClientRouteProps {
  children: React.ReactNode;
}

interface AdminRouteProps {
  children: React.ReactNode;
}

export const HealthMapsClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  const { user, loading, role } = useHealthMapsAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export const HealthMapsAdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, role } = useHealthMapsAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const HealthMapsRoleBasedRedirect: React.FC = () => {
  const { user, loading, role } = useHealthMapsAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};
