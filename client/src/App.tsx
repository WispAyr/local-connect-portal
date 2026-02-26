import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import Login from './auth/Login';
import Shell from './layout/Shell';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Assets from './pages/Assets';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import AdminClients from './pages/AdminClients';
import ParkingDashboard from './modules/parking/ParkingDashboard';
import ParkingSite from './modules/parking/ParkingSite';
import WhitelistManager from './modules/parking/WhitelistManager';
import ScreensDashboard from './modules/screens/ScreensDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="assets" element={<Assets />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin/clients" element={<ProtectedRoute roles={['admin', 'staff']}><AdminClients /></ProtectedRoute>} />
        <Route path="parking" element={<ParkingDashboard />} />
        <Route path="parking/sites/:id" element={<ParkingSite />} />
        <Route path="parking/whitelists" element={<WhitelistManager />} />
        <Route path="parking/whitelists/:id" element={<WhitelistManager />} />
        <Route path="screens" element={<ScreensDashboard />} />
      </Route>
    </Routes>
  );
}
