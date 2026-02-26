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
import RadioDashboard from './modules/radio/RadioDashboard';
import RadioInventory from './modules/radio/RadioInventory';
import RadioEvent from './modules/radio/RadioEvent';
import CRUDashboard from './modules/cru/CRUDashboard';
import VehicleDetail from './modules/cru/VehicleDetail';
import OpsLogTimeline from './modules/ops-log/OpsLogTimeline';
import CampaignsDashboard from './modules/campaigns/CampaignsDashboard';
import CampaignDetail from './modules/campaigns/CampaignDetail';
import HelpdeskDashboard from './modules/helpdesk/HelpdeskDashboard';
import TicketDetail from './modules/helpdesk/TicketDetail';
import KnowledgeBase from './modules/helpdesk/KnowledgeBase';

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
        <Route path="radio" element={<RadioDashboard />} />
        <Route path="radio/inventory" element={<RadioInventory />} />
        <Route path="radio/events/:id" element={<RadioEvent />} />
        <Route path="cru" element={<CRUDashboard />} />
        <Route path="cru/vehicles/:id" element={<VehicleDetail />} />
        <Route path="ops-log" element={<OpsLogTimeline />} />
        <Route path="campaigns" element={<CampaignsDashboard />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="helpdesk" element={<HelpdeskDashboard />} />
        <Route path="helpdesk/tickets/:id" element={<TicketDetail />} />
        <Route path="helpdesk/kb" element={<KnowledgeBase />} />
      </Route>
    </Routes>
  );
}
