import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './components/pages/Home/Home';
import CarDetail from './components/pages/CarDetail/CarDetail';
import Login from './components/pages/Login/Login';
import PartnerRegister from './components/pages/PartnerRegister/PartnerRegister';
import { AuthProvider } from './contexts/AuthContext';
import { ChatWidgetProvider } from './contexts/ChatWidgetContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ChatWidget from './components/common/ChatWidget';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard';
import UserManagement from './pages/admin/UserManagement/UserManagement';
import ShowroomVerification from './pages/admin/ShowroomVerification/ShowroomVerification';
import TransactionMonitor from './pages/admin/TransactionMonitor/TransactionMonitor';

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
import PaymentResult from './pages/renter/PaymentResult/PaymentResult';
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
import NotFound from './pages/NotFound';



// Dashboard wrapper with Layout
const DashboardPage = ({ children, roles }) => (
  <ProtectedRoute>
    <RoleRoute roles={roles}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleRoute>
  </ProtectedRoute>
);

/** Trang chỉ dành cho khách thuê — admin không dùng chung (tránh sidebar admin + nội dung renter). */
const RenterPage = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['renter']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleRoute>
  </ProtectedRoute>
);

/** Thanh toán đặt xe: cho phép admin test flow checkout cùng layout dashboard. */
const RenterOrAdminCheckout = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['renter', 'admin']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const App = () => {
  return (
    <AuthProvider>
      <ChatWidgetProvider>
      <Router>
        <Routes>
          {/* Login & public register */}
          <Route path="/login" element={<Login />} />
          <Route path="/partner/register" element={<PartnerRegister />} />

          {/* Admin Dashboard */}
          <Route path="/admin/dashboard"   element={<DashboardPage roles={['admin']}><AdminDashboard /></DashboardPage>} />
          <Route path="/admin/users"       element={<DashboardPage roles={['admin']}><UserManagement /></DashboardPage>} />
          <Route path="/admin/showrooms"   element={<DashboardPage roles={['admin']}><ShowroomVerification /></DashboardPage>} />
          <Route path="/admin/transactions" element={<DashboardPage roles={['admin']}><TransactionMonitor /></DashboardPage>} />
          <Route path="/admin/profile"    element={<DashboardPage roles={['admin']}><AdminProfile /></DashboardPage>} />
          <Route path="/admin/moderation" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/reports"    element={<Navigate to="/admin/dashboard" replace />} />

          {/* Showroom Dashboard */}
          <Route path="/showroom/dashboard"     element={<DashboardPage roles={['showroom']}><ShowroomDashboard /></DashboardPage>} />
          <Route path="/showroom/vehicles"      element={<DashboardPage roles={['showroom']}><VehicleManagement /></DashboardPage>} />
          <Route path="/showroom/bookings"      element={<DashboardPage roles={['showroom']}><BookingManagement /></DashboardPage>} />
          <Route path="/showroom/contracts"     element={<DashboardPage roles={['showroom']}><ContractManagement /></DashboardPage>} />
          <Route path="/showroom/customers"     element={<DashboardPage roles={['showroom']}><CustomerManagement /></DashboardPage>} />
          <Route path="/showroom/revenue"       element={<DashboardPage roles={['showroom']}><RevenueReports /></DashboardPage>} />
          <Route path="/showroom/ai-inspection" element={<DashboardPage roles={['showroom']}><AIInspection /></DashboardPage>} />
          <Route path="/showroom/profile"       element={<DashboardPage roles={['showroom']}><ShowroomProfile /></DashboardPage>} />

          {/* Owner Dashboard */}
          <Route path="/owner/dashboard" element={<DashboardPage roles={['owner']}><OwnerDashboard /></DashboardPage>} />
          <Route path="/owner/vehicles"  element={<DashboardPage roles={['owner']}><MyVehicles /></DashboardPage>} />
          <Route path="/owner/tracking"  element={<DashboardPage roles={['owner']}><VehicleTracking /></DashboardPage>} />
          <Route path="/owner/revenue"   element={<DashboardPage roles={['owner']}><Revenue /></DashboardPage>} />
          <Route path="/owner/profile"   element={<DashboardPage roles={['owner']}><OwnerProfile /></DashboardPage>} />

          {/* Renter portal */}
          <Route path="/renter/profile"         element={<RenterPage><Profile /></RenterPage>} />
          <Route path="/renter/bookings"        element={<RenterPage><MyBookings /></RenterPage>} />
          <Route path="/renter/checkout/:carId" element={<RenterOrAdminCheckout><Checkout /></RenterOrAdminCheckout>} />
          <Route path="/renter/checkout"        element={<RenterOrAdminCheckout><Checkout /></RenterOrAdminCheckout>} />
          <Route path="/renter/payment-result"  element={<PaymentResult />} />
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
            </div>
          } />
        </Routes>
        <ChatWidget />
      </Router>
      </ChatWidgetProvider>
    </AuthProvider>
  );
};

export default App;
