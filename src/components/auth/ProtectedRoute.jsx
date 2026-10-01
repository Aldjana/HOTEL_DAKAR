import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';
import { homeFor } from '../../utils/permissions';
import { useT } from '../../i18n';

// Protège une route : session valide + (optionnel) permission requise. Les rôles non autorisés sont renvoyés vers leur page d'accueil.
const ProtectedRoute = ({ children, permission }) => {
  const { t } = useT();
  const { isAuthenticated, loading, user, can } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner label={t('Vérification de la session…')} /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (permission && !can(permission)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
};

export default ProtectedRoute;
