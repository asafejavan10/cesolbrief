import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { BriefingDetail } from '../pages/BriefingDetail';
import { BriefingForm } from '../pages/BriefingForm';
import { Dashboard } from '../pages/Dashboard';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Reports } from '../pages/Reports';
import { Signup } from '../pages/Signup';
import { Success } from '../pages/Success';
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
        <Route element={<ProtectedRoute />}>
          <Route path="/briefing" element={<Page><BriefingForm /></Page>} />
          <Route path="/sucesso" element={<Page><Success /></Page>} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
          <Route path="/dashboard/relatorios" element={<Page><Reports /></Page>} />
          <Route path="/dashboard/briefings/:id" element={<Page><BriefingDetail /></Page>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
