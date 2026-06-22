import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import html from '../utils/html';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return html`<${Loader} />`;
  }

  if (!user) {
    return html`<${Navigate} to="/login" replace />`;
  }

  if (adminOnly && !isAdmin) {
    return html`<${Navigate} to="/dashboard" replace />`;
  }

  
  return children;
}
