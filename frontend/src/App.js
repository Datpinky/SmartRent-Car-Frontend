import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './components/pages/Home/Home';
import CarDetail from './components/pages/CarDetail/CarDetail';
import Login from './components/pages/Login/Login';
import PartnerRegister from './components/pages/PartnerRegister/PartnerRegister';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ChatWidget from './components/common/ChatWidget';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard';
import UserManagement from './pages/admin/UserManagement/UserManagement';
import ShowroomVerification from './pages/admin/ShowroomVerification/ShowroomVerification';
import TransactionMonitor from './pages/admin/TransactionMonitor/TransactionMonitor';
import SystemReports from './pages/admin/SystemReports/SystemReports';
import ContentModeration from './pages/admin/ContentModeration/ContentModeration';

// Showroom pages
import ShowroomDashboard from './pages/showroom/ShowroomDashboard/ShowroomDashboard';
import VehicleManagement from './pages/showroom/VehicleManagement/VehicleManagement';
import BookingManagement from './pages/showroom/BookingManagement/BookingManagement';
import ContractManagement from './pages/showroom/ContractManagement/ContractManagement';
import CustomerManagement from './pages/showroom/CustomerManagement/CustomerManagement';
import RevenueReports from './pages/showroom/RevenueReports/RevenueReports';
import AIInspection from './pages/showroom/AIInspection/AIInspection';
import ShowroomProfile from './pages/showroom/ShowroomProfile/ShowroomProfile';

// Renter pages
import Profile from './pages/renter/Profile/Profile';
import MyBookings from './pages/renter/MyBookings/MyBookings';
import Checkout from './pages/renter/Checkout/Checkout';
import SOSReport from './pages/renter/SOSReport/SOSReport';
import MapPage from './pages/renter/Map/MapPage';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard/OwnerDashboard';
import MyVehicles from './pages/owner/MyVehicles/MyVehicles';
import VehicleTracking from './pages/owner/VehicleTracking/VehicleTracking';
import Revenue from './pages/owner/Revenue/Revenue';
import OwnerProfile from './pages/owner/OwnerProfile/OwnerProfile';

// Admin profile
import AdminProfile from './pages/admin/AdminProfile/AdminProfile';



// Dashboard wrapper with Layout
const DashboardPage = ({ children, roles }) => (
  <ProtectedRoute>
    <RoleRoute roles={roles}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleRoute>
  </ProtectedRoute>
);

// Renter page wrapper (uses main layout, just needs auth)
const RenterPage = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['renter', 'admin']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login & public register */}
          <Route path="/login" element={<Login />} />
          <Route path="/partner/register" element={<PartnerRegister />} />

          {/* Admin Dashboard */}
          <Route path="/admin/dashboard"   element={<DashboardPage roles={['admin']}><AdminDashboard /></DashboardPage>} />
          <Route path="/admin/users"       element={<DashboardPage roles={['admin']}><UserManagement /></DashboardPage>} />
          <Route path="/admin/showrooms"   element={<DashboardPage roles={['admin']}><ShowroomVerification /></DashboardPage>} />
          <Route path="/admin/transactions"element={<DashboardPage roles={['admin']}><TransactionMonitor /></DashboardPage>} />
          <Route path="/admin/reports"     element={<DashboardPage roles={['admin']}><SystemReports /></DashboardPage>} />
          <Route path="/admin/moderation"  element={<DashboardPage roles={['admin']}><ContentModeration /></DashboardPage>} />
          <Route path="/admin/profile"    element={<DashboardPage roles={['admin']}><AdminProfile /></DashboardPage>} />

          {/* Showroom Dashboard */}
          <Route path="/showroom/dashboard"     element={<DashboardPage roles={['showroom', 'admin']}><ShowroomDashboard /></DashboardPage>} />
          <Route path="/showroom/vehicles"      element={<DashboardPage roles={['showroom', 'admin']}><VehicleManagement /></DashboardPage>} />
          <Route path="/showroom/bookings"      element={<DashboardPage roles={['showroom', 'admin']}><BookingManagement /></DashboardPage>} />
          <Route path="/showroom/contracts"     element={<DashboardPage roles={['showroom', 'admin']}><ContractManagement /></DashboardPage>} />
          <Route path="/showroom/customers"     element={<DashboardPage roles={['showroom', 'admin']}><CustomerManagement /></DashboardPage>} />
          <Route path="/showroom/revenue"       element={<DashboardPage roles={['showroom', 'admin']}><RevenueReports /></DashboardPage>} />
          <Route path="/showroom/ai-inspection" element={<DashboardPage roles={['showroom', 'admin']}><AIInspection /></DashboardPage>} />
          <Route path="/showroom/profile"       element={<DashboardPage roles={['showroom', 'admin']}><ShowroomProfile /></DashboardPage>} />

          {/* Owner Dashboard */}
          <Route path="/owner/dashboard" element={<DashboardPage roles={['owner', 'admin']}><OwnerDashboard /></DashboardPage>} />
          <Route path="/owner/vehicles"  element={<DashboardPage roles={['owner', 'admin']}><MyVehicles /></DashboardPage>} />
          <Route path="/owner/tracking"  element={<DashboardPage roles={['owner', 'admin']}><VehicleTracking /></DashboardPage>} />
          <Route path="/owner/revenue"   element={<DashboardPage roles={['owner', 'admin']}><Revenue /></DashboardPage>} />
          <Route path="/owner/profile"   element={<DashboardPage roles={['owner', 'admin']}><OwnerProfile /></DashboardPage>} />

          {/* Renter portal */}
          <Route path="/renter/profile"         element={<RenterPage><Profile /></RenterPage>} />
          <Route path="/renter/bookings"        element={<RenterPage><MyBookings /></RenterPage>} />
          <Route path="/renter/checkout/:carId" element={<RenterPage><Checkout /></RenterPage>} />
          <Route path="/renter/checkout"        element={<RenterPage><Checkout /></RenterPage>} />
          <Route path="/renter/sos"             element={<RenterPage><SOSReport /></RenterPage>} />

          {/* Public pages with Navbar/Footer */}
          <Route path="/*" element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/xe/:id" element={<CarDetail />} />
                  <Route path="/map" element={<MapPage />} />
                </Routes>
              </div>
              <Footer />
              <ChatWidget />
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
