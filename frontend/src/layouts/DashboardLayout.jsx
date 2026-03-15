import React, { useState, useRef, useEffect } from 'react';
import './DashboardLayout.css';
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
    { key: 'profile',   label: 'Hồ sơ cá nhân',  icon: <FaUser />,        path: '/renter/profile' },
    { key: 'bookings',  label: 'Chuyến đi của tôi',icon: <FaCalendarAlt />, path: '/renter/bookings' },
    { key: 'sos',       label: 'Hỗ trợ khẩn cấp', icon: <FaAmbulance />,   path: '/renter/sos' },
  ],
};

const ROLE_CONFIG = {
  admin:    { label: 'Quản trị viên', color: '#6d28d9', bg: '#f5f3ff' },
  showroom: { label: 'Showroom',      color: '#00b14f', bg: '#f0fdf4' },
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
    <div className={`dash-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-header">
          {!collapsed && (
            <div className="dash-logo" onClick={() => navigate('/')}>
              <div className="dash-logo-icon">S</div>
              <div className="dash-logo-text">
                <span className="dash-logo-brand">SmartRent</span>
                <span className="dash-logo-sub">Car Rental</span>
              </div>
            </div>
          )}
          {collapsed && <div className="dash-logo-icon" onClick={() => navigate('/')}>S</div>}
          <button className="dash-collapse-btn desktop-only" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <FaAngleRight /> : <FaBars />}
          </button>
          <button className="dash-close-btn mobile-only" onClick={() => setSidebarOpen(false)}><FaTimes /></button>
        </div>

        {!collapsed && (
          <div className="dash-role-badge" style={{ background: roleCfg.bg, color: roleCfg.color }}>
            <MdVerifiedUser style={{ fontSize: '0.85rem' }} /> {roleCfg.label}
          </div>
        )}

        <nav className="dash-nav">
          {menus.map(item => (
            <button
              key={item.key}
              className={`dash-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              title={collapsed ? item.label : ''}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {!collapsed && <span className="dash-nav-label">{item.label}</span>}
              {!collapsed && isActive(item.path) && <span className="dash-nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          {!collapsed && (
            <div className="dash-user-info">
              <div className="dash-avatar" style={{ background: roleCfg.color }}>{initials}</div>
              <div className="dash-user-details">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-email">{user?.email}</div>
              </div>
            </div>
          )}
          {collapsed && <div className="dash-avatar" style={{ background: roleCfg.color, margin: '0 auto 8px' }}>{initials}</div>}
          <button className="dash-logout-btn" onClick={handleLogout} title={collapsed ? 'Đăng xuất' : ''}>
            <FaSignOutAlt />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button className="dash-hamburger mobile-only" onClick={() => setSidebarOpen(true)}><FaBars /></button>
            <div className="dash-breadcrumb">
              {menus.find(m => isActive(m.path))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-topbar-btn" onClick={() => navigate('/')} title="Trang chủ">
              <FaStore />
            </button>
            {(user?.role === 'renter' || user?.role === 'showroom') && (
              <button className="dash-topbar-btn" title="Chat">
                <FaComments />
              </button>
            )}
            <NotificationBell />
            {user?.role !== 'renter' && (
              <div className="dash-topbar-user" ref={dropdownRef} onClick={() => setUserDropdownOpen(o => !o)}>
                <div className="dash-avatar sm" style={{ background: roleCfg.color }}>{initials}</div>
                <span className="dash-topbar-name">{user?.name}</span>
                <FaAngleDown style={{ fontSize: '0.7rem', color: '#9ca3af', transition: 'transform 0.2s', transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                {userDropdownOpen && (
                  <div className="dash-user-dropdown">
                    <div className="dash-dropdown-header">
                      <div className="dash-dropdown-avatar" style={{ background: roleCfg.color }}>{initials}</div>
                      <div>
                        <div className="dash-dropdown-name">{user?.name}</div>
                        <div className="dash-dropdown-role" style={{ color: roleCfg.color }}>{roleCfg.label}</div>
                      </div>
                    </div>
                    <div className="dash-dropdown-divider" />
                    <button className="dash-dropdown-item" onClick={handleProfile}>
                      <FaUser /> Hồ sơ cá nhân
                    </button>
                    <div className="dash-dropdown-divider" />
                    <button className="dash-dropdown-item danger" onClick={handleLogout}>
                      <FaSignOutAlt /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="dash-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
