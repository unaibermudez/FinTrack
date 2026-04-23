import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { Transactions } from './pages/Transactions';
import { Profile } from './pages/Profile';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import axios from 'axios';
import './i18n';

function RootRedirect() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) return null;
  return <Navigate to={accessToken ? '/dashboard' : '/login'} replace />;
}

function App() {
  const { theme } = useThemeStore();
  const { setAccessToken, clearAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    axios
      .post<{ accessToken: string }>(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then(({ data }) => setAccessToken(data.accessToken))
      .catch(() => clearAuth())
      .finally(() => setInitialized());
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        theme={theme}
        richColors
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
          },
          duration: 3500,
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/portfolio/:id" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/portfolio/:id/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
