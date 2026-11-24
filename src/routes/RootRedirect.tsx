import { Navigate } from 'react-router';
import { detectPreferredLang } from './paths';

export function RootRedirect() {
  return <Navigate to={`/${detectPreferredLang()}`} replace />;
}
