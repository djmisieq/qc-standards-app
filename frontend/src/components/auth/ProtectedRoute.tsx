import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'qc_engineer' | 'production_leader' | 'qc_operator' | 'viewer'
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access if a requiredRole is specified
  if (requiredRole && user && user.role !== requiredRole) {
    if (user.role === 'admin') {
      // Admins can access everything
      return <>{children}</>
    }
    
    // Role-based redirect
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
