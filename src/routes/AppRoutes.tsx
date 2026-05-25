import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { BriefingDetail } from '../pages/BriefingDetail';
import { BriefingForm } from '../pages/BriefingForm';
import { Dashboard } from '../pages/Dashboard';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Reports } from '../pages/Reports';
import { ResetPassword } from '../pages/ResetPassword';
import { Signup } from '../pages/Signup';
import { Success } from '../pages/Success';
import { UsersAdmin } from '../pages/UsersAdmin';
import { ProtectedRoute } from './ProtectedRoute';

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
      {children}
    </motion.div>
  );
}

export function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Home /></Page>} />
        <Route path="/login" element={<Page><Login /></Page>} />
        <Route path="/cadastro" element={<Page><Signup /></Page>} />
        <Route path="/recuperar-senha" element={<Page><ForgotPassword /></Page>} />
        <Route path="/redefinir-senha" element={<Page><ResetPassword /></Page>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/briefing" element={<Page><BriefingForm /></Page>} />
          <Route path="/sucesso" element={<Page><Success /></Page>} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
          <Route path="/dashboard/relatorios" element={<Page><Reports /></Page>} />
          <Route path="/dashboard/usuarios" element={<Page><UsersAdmin /></Page>} />
          <Route path="/dashboard/briefings/:id" element={<Page><BriefingDetail /></Page>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
