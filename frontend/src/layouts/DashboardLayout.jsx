import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaAmbulance,
  FaAngleDown,
  FaAngleRight,
  FaBars,
  FaBuilding,
  FaCalendarAlt,
  FaCar,
  FaChartLine,
  FaComments,
  FaExchangeAlt,
  FaFileContract,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaRobot,
  FaSignOutAlt,
  FaStore,
  FaTachometerAlt,
  FaTimes,
  FaUser,
  FaUsers,
} from 'react-icons/fa';
import { MdVerifiedUser } from 'react-icons/md';
import NotificationBell from '../components/common/NotificationBell';
import { useAuth } from '../contexts/AuthContext';

const MENUS = {
  admin: [
    { key: 'dashboard', label: 'Tổng quan', icon: <FaTachometerAlt aria-hidden="true" />, path: '/admin/dashboard' },
    { key: 'users', label: 'Quản lý người dùng', icon: <FaUsers aria-hidden="true" />, path: '/admin/users' },
    { key: 'showrooms', label: 'Xác minh showroom', icon: <FaStore aria-hidden="true" />, path: '/admin/showrooms' },
    { key: 'transactions', label: 'Giao dịch', icon: <FaExchangeAlt aria-hidden="true" />, path: '/admin/transactions' },
    { key: 'profile', label: 'Hồ sơ', icon: <FaUser aria-hidden="true" />, path: '/admin/profile' },
  ],
  showroom: [
    { key: 'dashboard', label: 'Tổng quan', icon: <FaTachometerAlt aria-hidden="true" />, path: '/showroom/dashboard' },
    { key: 'vehicles', label: 'Quản lý xe', icon: <FaCar aria-hidden="true" />, path: '/showroom/vehicles' },
    { key: 'bookings', label: 'Quản lý đặt xe', icon: <FaCalendarAlt aria-hidden="true" />, path: '/showroom/bookings' },
    { key: 'contracts', label: 'Hợp đồng', icon: <FaFileContract aria-hidden="true" />, path: '/showroom/contracts' },
    { key: 'customers', label: 'Khách hàng', icon: <FaUsers aria-hidden="true" />, path: '/showroom/customers' },
    { key: 'revenue', label: 'Doanh thu', icon: <FaChartLine aria-hidden="true" />, path: '/showroom/revenue' },
    { key: 'ai-inspection', label: 'Kiểm tra AI', icon: <FaRobot aria-hidden="true" />, path: '/showroom/ai-inspection' },
    { key: 'profile', label: 'Hồ sơ showroom', icon: <FaBuilding aria-hidden="true" />, path: '/showroom/profile' },
  ],
  owner: [
    { key: 'dashboard', label: 'Tổng quan', icon: <FaTachometerAlt aria-hidden="true" />, path: '/owner/dashboard' },
    { key: 'vehicles', label: 'Xe của tôi', icon: <FaCar aria-hidden="true" />, path: '/owner/vehicles' },
    { key: 'tracking', label: 'Theo dõi xe', icon: <FaMapMarkerAlt aria-hidden="true" />, path: '/owner/tracking' },
    { key: 'revenue', label: 'Doanh thu và rút tiền', icon: <FaMoneyBillWave aria-hidden="true" />, path: '/owner/revenue' },
    { key: 'profile', label: 'Hồ sơ', icon: <FaUser aria-hidden="true" />, path: '/owner/profile' },
  ],
  renter: [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <FaUser aria-hidden="true" />, path: '/renter/profile' },
    { key: 'bookings', label: 'Chuyến đi của tôi', icon: <FaCalendarAlt aria-hidden="true" />, path: '/renter/bookings' },
    { key: 'ai-reports', label: 'Báo cáo AI', icon: <FaRobot aria-hidden="true" />, path: '/renter/ai-reports' },
    { key: 'transactions', label: 'Lịch sử giao dịch', icon: <FaExchangeAlt aria-hidden="true" />, path: '/renter/transactions' },
    { key: 'sos', label: 'Hỗ trợ khẩn cấp', icon: <FaAmbulance aria-hidden="true" />, path: '/renter/sos' },
  ],
};

if (!MENUS.renter.some((item) => item.key === 'dashboard')) {
  MENUS.renter.splice(0, 0, {
    key: 'dashboard',
    label: 'Tổng quan tài chính',
    icon: <FaChartLine aria-hidden="true" />,
    path: '/renter/dashboard',
  });
}

if (!MENUS.renter.some((item) => item.key === 'pending-pickups')) {
  MENUS.renter.splice(1, 0, {
    key: 'pending-pickups',
    label: 'Chờ nhận xe',
    icon: <FaCar aria-hidden="true" />,
    path: '/renter/pending-pickups',
  });
}

if (!MENUS.renter.some((item) => item.key === 'pending-payments')) {
  MENUS.renter.splice(1, 0, {
    key: 'pending-payments',
    label: 'Cho thanh toan',
    icon: <FaMoneyBillWave aria-hidden="true" />,
    path: '/renter/pending-payments',
  });
}

if (!MENUS.renter.some((item) => item.key === 'pending-showroom-processing')) {
  MENUS.renter.splice(2, 0, {
    key: 'pending-showroom-processing',
    label: 'Cho showroom xu ly',
    icon: <FaStore aria-hidden="true" />,
    path: '/renter/pending-showroom-processing',
  });
}

const ROLE_CONFIG = {
  admin: { label: 'Quản trị viên', color: '#6d28d9', bg: '#f5f3ff' },
  showroom: { label: 'Showroom', color: '#00b14f', bg: '#f0fdf4' },
  owner: { label: 'Chủ xe', color: '#0891b2', bg: '#ecfeff' },
  renter: { label: 'Khách thuê', color: '#d97706', bg: '#fffbeb' },
};

const PROFILE_PATHS = {
  admin: '/admin/profile',
  showroom: '/showroom/profile',
  owner: '/owner/profile',
  renter: '/renter/profile',
};

const FALLBACK_TITLES = [
  { prefix: '/renter/retry-payment', label: 'Thanh toan lai' },
  { prefix: '/renter/checkout', label: 'Thanh toán đặt xe' },
  { prefix: '/renter/transactions', label: 'Lịch sử giao dịch' },
  { prefix: '/renter/payment-result', label: 'Kết quả thanh toán' },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const menus = MENUS[user?.role] || MENUS.renter;
  const roleCfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.renter;

  const initials = useMemo(
    () => user?.name?.split(' ').map((word) => word[0]).slice(-2).join('').toUpperCase() || 'U',
    [user?.name]
  );

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const headerTitle = (() => {
    const fromMenu = menus.find((item) => isActive(item.path));
    if (fromMenu) {
      return fromMenu.label;
    }

    return FALLBACK_TITLES.find((item) => location.pathname.startsWith(item.prefix))?.label || 'Dashboard';
  })();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setUserDropdownOpen(false);
    navigate(PROFILE_PATHS[user?.role] || '/');
  };

  return (
    <div className="relative flex min-h-screen bg-[#f4f6f9]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Chuyển đến nội dung chính
      </a>

      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[199] bg-black/45"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        aria-label="Điều hướng chính"
        className={`fixed bottom-0 left-0 top-0 z-[200] flex flex-col overflow-hidden bg-[#1a1a2e] transition-[width] duration-[250ms] ease-in-out max-md:!w-60 max-md:transition-transform ${
          collapsed ? 'w-[68px]' : 'w-60'
        } ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        <div className="flex min-h-[64px] shrink-0 items-center justify-between border-b border-white/[0.08] px-3.5 py-[18px]">
          {!collapsed ? (
            <Link to="/" className="min-w-0 flex-1 no-underline" aria-label="SmartRent Car Rental - Trang chu">
              <img
                src="/logo_transparent.png"
                alt="SmartRent Car Rental"
                width={140}
                height={36}
                className="h-9 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
          ) : (
            <Link to="/" aria-label="SmartRent Car - Trang chu" className="mx-auto flex w-full items-center justify-center overflow-hidden no-underline">
              <img
                src="/logo_transparent.png"
                alt=""
                aria-hidden="true"
                width={52}
                height={52}
                className="h-[52px] w-auto object-contain object-top"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
          )}

          <button
            type="button"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.08] text-[0.8rem] text-white/60 transition-colors hover:bg-white/[0.15] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? <FaAngleRight aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>

          <button
            type="button"
            aria-label="Đóng menu"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.08] text-[0.8rem] text-white/60 transition-colors hover:bg-white/[0.15] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        {!collapsed && (
          <div
            aria-hidden="true"
            className="mx-3 mb-1 mt-2.5 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.72rem] font-bold"
            style={{ background: roleCfg.bg, color: roleCfg.color }}
          >
            <MdVerifiedUser aria-hidden="true" style={{ fontSize: '0.85rem' }} />
            {roleCfg.label}
          </div>
        )}

        <nav aria-label="Menu trang" className="flex-1 overflow-y-auto py-2 [scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:thin]">
          {menus.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`relative flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[0.85rem] font-medium transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                isActive(item.path)
                  ? 'bg-[rgba(0,177,79,0.2)] text-white'
                  : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
              }`}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              {isActive(item.path) && (
                <span aria-hidden="true" className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-sm bg-primary" />
              )}
              <span aria-hidden="true" className="flex w-5 shrink-0 items-center justify-center text-base">
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>}
              {!collapsed && isActive(item.path) && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/[0.08] p-3">
          {!collapsed ? (
            <div aria-hidden="true" className="mb-2 flex items-center gap-2.5 px-1 py-2">
              <div
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[0.8rem] font-bold text-white"
                style={{ background: roleCfg.color }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.8rem] font-semibold text-white">
                  {user?.name}
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.68rem] text-white/40">
                  {user?.email}
                </div>
              </div>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="mx-auto mb-2 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[0.8rem] font-bold text-white"
              style={{ background: roleCfg.color }}
            >
              {initials}
            </div>
          )}

          <button
            type="button"
            aria-label="Đăng xuất"
            className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-white/[0.06] px-3 py-2.5 text-[0.82rem] font-medium text-white/60 transition-[background-color,color] hover:bg-red-600/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            onClick={handleLogout}
          >
            <FaSignOutAlt aria-hidden="true" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div
        className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-[250ms] ease-in-out max-md:ml-0 ${
          collapsed ? 'ml-[68px]' : 'ml-60'
        }`}
      >
        <header className="sticky top-0 z-[100] flex h-[60px] shrink-0 items-center justify-between border-b border-[#f0f0f0] bg-white px-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              className="flex rounded-[7px] p-1.5 text-[1.1rem] text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars aria-hidden="true" />
            </button>
            <div className="text-[0.9rem] font-semibold text-gray-900">{headerTitle}</div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              aria-label="Trang chu"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-gray-200 bg-white text-[0.95rem] text-gray-500 transition-[border-color,color,background-color] hover:border-primary hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FaStore aria-hidden="true" />
            </Link>

            {(user?.role === 'renter' || user?.role === 'showroom') && (
              <button
                type="button"
                aria-label="Chat"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-gray-200 bg-white text-[0.95rem] text-gray-500 transition-[border-color,color,background-color] hover:border-primary hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FaComments aria-hidden="true" />
              </button>
            )}

            <NotificationBell />

            {user?.role !== 'renter' && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label={`${user?.name} - mở menu tài khoản`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  className="flex select-none items-center gap-1.5 rounded-[10px] px-2 py-1 transition-[background-color] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setUserDropdownOpen((current) => !current)}
                >
                  <div
                    aria-hidden="true"
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold text-white"
                    style={{ background: roleCfg.color }}
                  >
                    {initials}
                  </div>
                  <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold text-gray-700">
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
                    className="absolute right-0 top-[calc(100%+8px)] z-[999] min-w-[210px] rounded-[14px] border border-gray-200 bg-white py-2 shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <div
                        aria-hidden="true"
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[0.9rem] font-bold text-white"
                        style={{ background: roleCfg.color }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="text-[0.85rem] font-bold text-gray-900">{user?.name}</div>
                        <div className="mt-px text-[0.72rem] font-semibold" style={{ color: roleCfg.color }}>
                          {roleCfg.label}
                        </div>
                      </div>
                    </div>

                    <div role="separator" className="my-1 h-px bg-gray-100" />

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[0.83rem] text-gray-700 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                      onClick={handleProfile}
                    >
                      <FaUser aria-hidden="true" />
                      Hồ sơ cá nhân
                    </button>

                    <div role="separator" className="my-1 h-px bg-gray-100" />

                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[0.83rem] text-red-600 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt aria-hidden="true" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-6 max-md:p-4" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
