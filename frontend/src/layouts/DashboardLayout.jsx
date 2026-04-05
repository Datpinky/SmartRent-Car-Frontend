import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../components/common/NotificationBell';
import {
  FaTachometerAlt, FaUsers, FaStore, FaCar, FaChartBar, FaShieldAlt,
  FaCog, FaCalendarAlt, FaFileContract, FaChartLine, FaRobot,
  FaBuilding, FaMapMarkerAlt, FaMoneyBillWave, FaBars, FaTimes,
  FaSignOutAlt, FaAngleDown, FaAngleRight, FaExchangeAlt, FaComments,
  FaAmbulance, FaUser
} from 'react-icons/fa';
import { MdVerifiedUser } from 'react-icons/md';

const MENUS = {
  admin: [
    { key: 'dashboard',   label: 'Tổng quan',           icon: <FaTachometerAlt />, path: '/admin/dashboard' },
    { key: 'users',       label: 'Quản lý người dùng',  icon: <FaUsers />,         path: '/admin/users' },
    { key: 'showrooms',   label: 'Xác minh Showroom',   icon: <FaStore />,         path: '/admin/showrooms' },
    { key: 'vehicles',    label: 'Duyệt xe',             icon: <FaCar />,           path: '/admin/vehicles' },
    { key: 'transactions',label: 'Giao dịch',            icon: <FaExchangeAlt />,   path: '/admin/transactions' },
    { key: 'reports',     label: 'Báo cáo hệ thống',    icon: <FaChartBar />,      path: '/admin/reports' },
    { key: 'moderation',  label: 'Kiểm duyệt nội dung', icon: <FaShieldAlt />,     path: '/admin/moderation' },
    { key: 'settings',    label: 'Cài đặt hệ thống',    icon: <FaCog />,           path: '/admin/settings' },
    { key: 'profile',     label: 'Hồ sơ',               icon: <FaUser />,          path: '/admin/profile' },
  ],
  showroom: [
    { key: 'dashboard',    label: 'Tổng quan',       icon: <FaTachometerAlt />, path: '/showroom/dashboard' },
    { key: 'vehicles',     label: 'Quản lý xe',      icon: <FaCar />,           path: '/showroom/vehicles' },
    { key: 'bookings',     label: 'Quản lý đặt xe',  icon: <FaCalendarAlt />,   path: '/showroom/bookings' },
    { key: 'contracts',    label: 'Hợp đồng',        icon: <FaFileContract />,  path: '/showroom/contracts' },
    { key: 'customers',    label: 'Khách hàng',      icon: <FaUsers />,         path: '/showroom/customers' },
    { key: 'revenue',      label: 'Doanh thu',       icon: <FaChartLine />,     path: '/showroom/revenue' },
    { key: 'ai-inspection',label: 'Kiểm tra AI',     icon: <FaRobot />,         path: '/showroom/ai-inspection' },
    { key: 'profile',      label: 'Hồ sơ Showroom',  icon: <FaBuilding />,      path: '/showroom/profile' },
  ],
  owner: [
    { key: 'dashboard', label: 'Tổng quan',          icon: <FaTachometerAlt />, path: '/owner/dashboard' },
    { key: 'vehicles',  label: 'Xe của tôi',          icon: <FaCar />,           path: '/owner/vehicles' },
    { key: 'tracking',  label: 'Theo dõi xe',         icon: <FaMapMarkerAlt />,  path: '/owner/tracking' },
    { key: 'revenue',   label: 'Doanh thu & Rút tiền',icon: <FaMoneyBillWave />, path: '/owner/revenue' },
    { key: 'profile',   label: 'Hồ sơ',               icon: <FaUser />,          path: '/owner/profile' },
  ],
  renter: [
    { key: 'profile',   label: 'Hồ sơ cá nhân',   icon: <FaUser />,        path: '/renter/profile' },
    { key: 'bookings',  label: 'Chuyến đi của tôi', icon: <FaCalendarAlt />, path: '/renter/bookings' },
    { key: 'sos',       label: 'Hỗ trợ khẩn cấp',  icon: <FaAmbulance />,   path: '/renter/sos' },
  ],
};

const ROLE_CONFIG = {
  admin:    { label: 'Quản trị viên', color: '#6d28d9', bg: '#f5f3ff' },
  showroom: { label: 'Showroom',      color: '#87ceeb', bg: '#f0f9ff' },
  owner:    { label: 'Chủ xe',        color: '#0891b2', bg: '#ecfeff' },
  renter:   { label: 'Khách thuê',    color: '#d97706', bg: '#fffbeb' },
};

const PROFILE_PATHS = {
  admin:    '/admin/profile',
  showroom: '/showroom/profile',
  owner:    '/owner/profile',
  renter:   '/renter/profile',
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menus = MENUS[user?.role] || [];
  const roleCfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.renter;

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleProfile = () => { setUserDropdownOpen(false); navigate(PROFILE_PATHS[user?.role] || '/'); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-[199]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 bottom-0 z-[200] overflow-hidden shadow-[2px_0_8px_rgba(0,0,0,0.04)] w-60
          max-md:transition-transform
          ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-[14px] border-b border-gray-100 min-h-[64px] shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer flex-1" onClick={() => navigate('/')}>
            <img src="/TagIcon.png" alt="SmartRent" className="w-[34px] h-[34px] object-contain shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[0.95rem] font-extrabold text-gray-800">SmartRent</span>
              <span className="text-[0.65rem] text-gray-400">Car Rental</span>
            </div>
          </div>
          <button
            className="flex md:hidden bg-gray-100 text-gray-500 w-7 h-7 rounded-[7px] items-center justify-center text-[0.8rem] shrink-0 transition-colors hover:bg-gray-200 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Role badge */}
        <div
          className="mx-3 mt-2.5 mb-1 py-1.5 px-3 rounded-lg text-[0.72rem] font-bold flex items-center gap-1.5"
          style={{ background: roleCfg.bg, color: roleCfg.color }}
          >
            <MdVerifiedUser style={{ fontSize: '0.85rem' }} /> {roleCfg.label}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.08)_transparent]">
          {menus.map(item => (
            <button
              key={item.key}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[0.85rem] font-medium text-left transition-all relative
                ${isActive(item.path)
                  ? 'text-primary bg-primary/[0.08]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              {isActive(item.path) && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-sm" />
              )}
              <span className="text-base shrink-0 w-5 flex items-center justify-center">{item.icon}</span>
              <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
              {isActive(item.path) && <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 px-1 py-2 mb-2">
            <div
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[0.8rem] text-white shrink-0"
              style={{ background: roleCfg.color }}
            >{initials}</div>
            <div className="min-w-0">
              <div className="text-[0.8rem] font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">{user?.name}</div>
              <div className="text-[0.68rem] text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">{user?.email}</div>
            </div>
          </div>
          <button
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-gray-50 rounded-[9px] text-gray-500 text-[0.82rem] font-medium transition-all justify-center hover:bg-red-50 hover:text-red-500 border border-gray-100"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen ml-60 max-md:ml-0">
        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-[#f0f0f0] flex items-center justify-between px-5 sticky top-0 z-[100] shadow-[0_1px_4px_rgba(0,0,0,0.05)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="flex md:hidden text-gray-700 text-[1.1rem] p-1.5 rounded-[7px] hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>
            <div className="text-[0.9rem] font-semibold text-gray-900">
              {menus.find(m => isActive(m.path))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 h-[36px] px-3 rounded-[10px] border-[1.5px] border-gray-200 bg-white text-[0.72rem] font-bold text-gray-500 tracking-wide uppercase transition-all cursor-pointer hover:border-primary hover:text-primary hover:bg-primary-light"
              onClick={() => navigate('/')}
            >
              <FaStore size={13} />
              Trang chủ
            </button>
            {(user?.role === 'renter' || user?.role === 'showroom') && (
              <button
                className="flex items-center gap-1.5 h-[36px] px-3 rounded-[10px] border-[1.5px] border-gray-200 bg-white text-[0.72rem] font-bold text-gray-500 tracking-wide uppercase transition-all cursor-pointer hover:border-primary hover:text-primary hover:bg-primary-light"
              >
                <FaComments size={13} />
                Tin nhắn
              </button>
            )}
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto max-md:p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
