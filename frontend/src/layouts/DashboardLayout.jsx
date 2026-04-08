import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    { key: 'dashboard',   label: 'Tổng quan',           icon: <FaTachometerAlt aria-hidden="true" />, path: '/admin/dashboard' },
    { key: 'users',       label: 'Quản lý người dùng',  icon: <FaUsers aria-hidden="true" />,         path: '/admin/users' },
    { key: 'showrooms',   label: 'Xác minh Showroom',   icon: <FaStore aria-hidden="true" />,         path: '/admin/showrooms' },
    { key: 'transactions',label: 'Giao dịch',            icon: <FaExchangeAlt aria-hidden="true" />,   path: '/admin/transactions' },
    { key: 'reports',     label: 'Báo cáo hệ thống',    icon: <FaChartBar aria-hidden="true" />,      path: '/admin/reports' },
    { key: 'moderation',  label: 'Kiểm duyệt nội dung', icon: <FaShieldAlt aria-hidden="true" />,     path: '/admin/moderation' },
    { key: 'settings',    label: 'Cài đặt hệ thống',    icon: <FaCog aria-hidden="true" />,           path: '/admin/settings' },
    { key: 'profile',     label: 'Hồ sơ',               icon: <FaUser aria-hidden="true" />,          path: '/admin/profile' },
  ],
  showroom: [
    { key: 'dashboard',    label: 'Tổng quan',       icon: <FaTachometerAlt aria-hidden="true" />, path: '/showroom/dashboard' },
    { key: 'vehicles',     label: 'Quản lý xe',      icon: <FaCar aria-hidden="true" />,           path: '/showroom/vehicles' },
    { key: 'bookings',     label: 'Quản lý đặt xe',  icon: <FaCalendarAlt aria-hidden="true" />,   path: '/showroom/bookings' },
    { key: 'contracts',    label: 'Hợp đồng',        icon: <FaFileContract aria-hidden="true" />,  path: '/showroom/contracts' },
    { key: 'customers',    label: 'Khách hàng',      icon: <FaUsers aria-hidden="true" />,         path: '/showroom/customers' },
    { key: 'revenue',      label: 'Doanh thu',       icon: <FaChartLine aria-hidden="true" />,     path: '/showroom/revenue' },
    { key: 'ai-inspection',label: 'Kiểm tra AI',     icon: <FaRobot aria-hidden="true" />,         path: '/showroom/ai-inspection' },
    { key: 'profile',      label: 'Hồ sơ Showroom',  icon: <FaBuilding aria-hidden="true" />,      path: '/showroom/profile' },
  ],
  owner: [
    { key: 'dashboard', label: 'Tổng quan',          icon: <FaTachometerAlt aria-hidden="true" />, path: '/owner/dashboard' },
    { key: 'vehicles',  label: 'Xe của tôi',          icon: <FaCar aria-hidden="true" />,           path: '/owner/vehicles' },
    { key: 'tracking',  label: 'Theo dõi xe',         icon: <FaMapMarkerAlt aria-hidden="true" />,  path: '/owner/tracking' },
    { key: 'revenue',   label: 'Doanh thu & Rút tiền',icon: <FaMoneyBillWave aria-hidden="true" />, path: '/owner/revenue' },
    { key: 'profile',   label: 'Hồ sơ',               icon: <FaUser aria-hidden="true" />,          path: '/owner/profile' },
  ],
  renter: [
    { key: 'profile',   label: 'Hồ sơ cá nhân',   icon: <FaUser aria-hidden="true" />,        path: '/renter/profile' },
    { key: 'bookings',  label: 'Chuyến đi của tôi', icon: <FaCalendarAlt aria-hidden="true" />, path: '/renter/bookings' },
    { key: 'sos',       label: 'Hỗ trợ khẩn cấp',  icon: <FaAmbulance aria-hidden="true" />,   path: '/renter/sos' },
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

  // Close sidebar on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] relative">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/45 z-[199]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Điều hướng chính"
        className={`bg-[#1a1a2e] flex flex-col fixed top-0 left-0 bottom-0 z-[200] overflow-hidden transition-[width] duration-[250ms] ease-in-out
          max-md:transition-transform max-md:!w-60
          ${collapsed ? 'w-[68px]' : 'w-60'}
          ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-[18px] border-b border-white/[0.08] min-h-[64px] shrink-0">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2.5 flex-1 no-underline">
              <div className="w-[34px] h-[34px] bg-primary rounded-[9px] flex items-center justify-center font-black text-base text-white shrink-0">S</div>
              <div className="flex flex-col leading-none">
                <span className="text-[0.95rem] font-extrabold text-white">SmartRent</span>
                <span className="text-[0.65rem] text-white/[0.45]">Car Rental</span>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link to="/" aria-label="SmartRent Car — Trang chủ" className="w-[34px] h-[34px] bg-primary rounded-[9px] flex items-center justify-center font-black text-base text-white shrink-0 mx-auto no-underline">
              S
            </Link>
          )}
          <button
            type="button"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            className="hidden md:flex bg-white/[0.08] text-white/60 w-7 h-7 rounded-[7px] items-center justify-center text-[0.8rem] shrink-0 transition-colors hover:bg-white/[0.15] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setCollapsed(c => !c)}
          >
            {collapsed ? <FaAngleRight aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>
          <button
            type="button"
            aria-label="Đóng menu"
            className="flex md:hidden bg-white/[0.08] text-white/60 w-7 h-7 rounded-[7px] items-center justify-center text-[0.8rem] shrink-0 transition-colors hover:bg-white/[0.15] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div
            aria-hidden="true"
            className="mx-3 mt-2.5 mb-1 py-1.5 px-3 rounded-lg text-[0.72rem] font-bold flex items-center gap-1.5"
            style={{ background: roleCfg.bg, color: roleCfg.color }}
          >
            <MdVerifiedUser aria-hidden="true" style={{ fontSize: '0.85rem' }} /> {roleCfg.label}
          </div>
        )}

        {/* Nav */}
        <nav aria-label="Menu trang" className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
          {menus.map(item => (
            <button
              key={item.key}
              type="button"
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[0.85rem] font-medium text-left transition-[background-color,color] relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                ${isActive(item.path)
                  ? 'text-white bg-[rgba(0,177,79,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.07]'
                }`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              {isActive(item.path) && (
                <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-sm" />
              )}
              <span aria-hidden="true" className="text-base shrink-0 w-5 flex items-center justify-center">{item.icon}</span>
              {!collapsed && <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
              {!collapsed && isActive(item.path) && <span aria-hidden="true" className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] shrink-0">
          {!collapsed && (
            <div aria-hidden="true" className="flex items-center gap-2.5 px-1 py-2 mb-2">
              <div
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[0.8rem] text-white shrink-0"
                style={{ background: roleCfg.color }}
              >{initials}</div>
              <div className="min-w-0">
                <div className="text-[0.8rem] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{user?.name}</div>
                <div className="text-[0.68rem] text-white/40 whitespace-nowrap overflow-hidden text-ellipsis">{user?.email}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div
              aria-hidden="true"
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[0.8rem] text-white shrink-0 mx-auto mb-2"
              style={{ background: roleCfg.color }}
            >{initials}</div>
          )}
          <button
            type="button"
            aria-label="Đăng xuất"
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-white/[0.06] rounded-[9px] text-white/60 text-[0.82rem] font-medium transition-[background-color,color] justify-center hover:bg-red-600/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            onClick={handleLogout}
          >
            <FaSignOutAlt aria-hidden="true" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-[250ms] ease-in-out max-md:ml-0
          ${collapsed ? 'ml-[68px]' : 'ml-60'}`}
      >
        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-[#f0f0f0] flex items-center justify-between px-5 sticky top-0 z-[100] shadow-[0_1px_4px_rgba(0,0,0,0.05)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              className="flex md:hidden text-gray-700 text-[1.1rem] p-1.5 rounded-[7px] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars aria-hidden="true" />
            </button>
            <div className="text-[0.9rem] font-semibold text-gray-900">
              {menus.find(m => isActive(m.path))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              aria-label="Trang chủ"
              className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] border-gray-200 bg-white flex items-center justify-center text-[0.95rem] text-gray-500 transition-[border-color,color,background-color] hover:border-primary hover:text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FaStore aria-hidden="true" />
            </Link>
            {(user?.role === 'renter' || user?.role === 'showroom') && (
              <button
                type="button"
                aria-label="Chat"
                className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] border-gray-200 bg-white flex items-center justify-center text-[0.95rem] text-gray-500 transition-[border-color,color,background-color] hover:border-primary hover:text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FaComments aria-hidden="true" />
              </button>
            )}
            <NotificationBell />
            {user?.role !== 'renter' && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label={`${user?.name} — mở menu tài khoản`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 py-1 px-2 rounded-[10px] cursor-pointer transition-[background-color] select-none hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setUserDropdownOpen(o => !o)}
                >
                  <div
                    aria-hidden="true"
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[0.72rem] text-white shrink-0"
                    style={{ background: roleCfg.color }}
                  >{initials}</div>
                  <span className="text-[0.82rem] font-semibold text-gray-700 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {user?.name}
                  </span>
                  <FaAngleDown
                    aria-hidden="true"
                    style={{
                      fontSize: '0.7rem',
                      color: '#9ca3af',
                      transition: 'transform 0.2s',
                      transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {userDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute top-[calc(100%+8px)] right-0 z-[999] bg-white border border-gray-200 rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] min-w-[210px] py-2 animate-[slideDown_0.15s_ease] motion-reduce:animate-none"
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <div
                        aria-hidden="true"
                        className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[0.9rem] font-bold text-white shrink-0"
                        style={{ background: roleCfg.color }}
                      >{initials}</div>
                      <div>
                        <div className="text-[0.85rem] font-bold text-gray-900">{user?.name}</div>
                        <div className="text-[0.72rem] font-semibold mt-px" style={{ color: roleCfg.color }}>{roleCfg.label}</div>
                      </div>
                    </div>
                    <div role="separator" className="h-px bg-gray-100 my-1" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[0.83rem] text-gray-700 cursor-pointer transition-colors text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:bg-gray-50"
                      onClick={handleProfile}
                    >
                      <FaUser aria-hidden="true" /> Hồ sơ cá nhân
                    </button>
                    <div role="separator" className="h-px bg-gray-100 my-1" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[0.83rem] text-red-600 cursor-pointer transition-colors text-left hover:bg-red-50 focus-visible:outline-none focus-visible:bg-red-50"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt aria-hidden="true" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main id="main-content" className="flex-1 p-6 overflow-y-auto max-md:p-4" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
