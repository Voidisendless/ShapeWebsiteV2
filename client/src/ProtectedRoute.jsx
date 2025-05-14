import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  const guest = localStorage.getItem('guestName');

  return token || guest ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
