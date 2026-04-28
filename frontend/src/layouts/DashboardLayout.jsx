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
    { key: 'dashboard', label: 'Tổng quan tài chính', icon: <FaChartLine aria-hidden="true" />, path: '/renter/dashboard' },
    { key: 'pending-payments', label: 'Chờ thanh toán', icon: <FaMoneyBillWave aria-hidden="true" />, path: '/renter/pending-payments' },
    { key: 'pending-showroom-processing', label: 'Chờ showroom xử lý', icon: <FaStore aria-hidden="true" />, path: '/renter/pending-showroom-processing' },
    { key: 'pending-pickups', label: 'Chờ nhận xe', icon: <FaCar aria-hidden="true" />, path: '/renter/pending-pickups' },
    { key: 'bookings', label: 'Chuyến đi của tôi', icon: <FaCalendarAlt aria-hidden="true" />, path: '/renter/bookings' },
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <FaUser aria-hidden="true" />, path: '/renter/profile' },
    { key: 'ai-reports', label: 'Báo cáo AI', icon: <FaRobot aria-hidden="true" />, path: '/renter/ai-reports' },
    { key: 'transactions', label: 'Lịch sử giao dịch', icon: <FaExchangeAlt aria-hidden="true" />, path: '/renter/transactions' },
    { key: 'sos', label: 'Hỗ trợ khẩn cấp', icon: <FaAmbulance aria-hidden="true" />, path: '/renter/sos' },
  ],
};

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
  { prefix: '/renter/retry-payment', label: 'Thanh toán lại' },
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
  const isRenter = user?.role === 'renter';

  const sidebarTheme = isRenter
    ? {
      shell: 'border-r border-[#dbe7f5] bg-[#f7fbff] text-[#0f172a] shadow-[0_16px_40px_rgba(15,23,42,0.08)]',
      topBorder: 'border-[#dbe7f5]',
      panel: 'border border-[#e2ebf7] bg-white text-[#0f172a] shadow-[0_10px_26px_rgba(148,163,184,0.14)]',
      toggle: 'border border-[#dbe7f5] bg-white text-[#475569] hover:bg-[#eef5ff] hover:text-primary',
      navActive: 'bg-[#e8f2ff] text-[#0f172a] shadow-[0_12px_30px_rgba(37,99,235,0.12)]',
      navIdle: 'text-[#475569] hover:bg-[#eef5ff] hover:text-[#0f172a]',
      iconActive: 'text-primary',
      iconIdle: 'text-[#64748b] group-hover:text-primary',
      footerBorder: 'border-[#dbe7f5]',
      footerBtn: 'border border-[#dbe7f5] bg-white text-[#0f172a] hover:bg-[#eef5ff]',
      logoutBtn: 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
    }
    : {
      shell: 'bg-[#1a1a2e] text-white',
      topBorder: 'border-white/[0.08]',
      panel: 'border border-white/10 bg-white/5 text-white',
      toggle: 'border border-white/10 bg-white/10 text-white hover:bg-white/20',
      navActive: 'bg-white text-[#1a1a2e] shadow-[0_10px_30px_rgba(255,255,255,0.12)]',
      navIdle: 'text-white/75 hover:bg-white/10 hover:text-white',
      iconActive: 'text-primary',
      iconIdle: 'text-white/80 group-hover:text-white',
      footerBorder: 'border-white/10',
      footerBtn: 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
      logoutBtn: 'border border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/20',
    };

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
        className={`fixed bottom-0 left-0 top-0 z-[200] flex flex-col overflow-hidden transition-[width] duration-[250ms] ease-in-out max-md:!w-60 max-md:transition-transform ${sidebarTheme.shell} ${collapsed ? 'w-[68px]' : 'w-60'
          } ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        <div className={`flex min-h-[64px] shrink-0 items-center justify-between border-b px-3.5 py-[18px] ${sidebarTheme.topBorder}`}>
          {!collapsed ? (
            <Link to="/" className="min-w-0 flex-1 no-underline" aria-label="SmartRent Car Rental - Trang chu">
              <img
                src="/logo_transparent.png"
                alt="SmartRent Car Rental"
                width={140}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </Link>
          ) : (
            <Link to="/" className="mx-auto block" aria-label="SmartRent Car Rental - Trang chu">
              <img
                src="/logo_transparent.png"
                alt="SmartRent Car Rental"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className={`hidden h-9 w-9 items-center justify-center rounded-lg transition md:inline-flex ${sidebarTheme.toggle}`}
            aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
            aria-pressed={collapsed}
          >
            {collapsed ? <FaAngleRight aria-hidden="true" /> : <FaAngleDown className="-rotate-90" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition md:hidden ${sidebarTheme.toggle}`}
            aria-label="Đóng menu"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
          <div
            className={`rounded-2xl px-3 py-3 transition-all ${sidebarTheme.panel} ${collapsed ? 'items-center text-center' : ''}`}
          >
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${isRenter ? 'bg-[#e0f2fe] text-[#0369a1]' : 'bg-white text-[#1a1a2e]'}`}>
                {initials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{user?.name || 'Tai khoan'}</div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: roleCfg.color, backgroundColor: roleCfg.bg }}>
                    <MdVerifiedUser aria-hidden="true" />
                    <span>{roleCfg.label}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1" aria-label="Menu vai tro">
            {menus.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium no-underline transition ${active
                    ? sidebarTheme.navActive
                    : sidebarTheme.navIdle
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`text-base ${active ? sidebarTheme.iconActive : sidebarTheme.iconIdle}`}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className={`mt-auto flex flex-col gap-2 border-t pt-3 ${sidebarTheme.footerBorder}`}>
            <button
              type="button"
              onClick={handleProfile}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${sidebarTheme.footerBtn} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? 'Hồ sơ' : undefined}
            >
              <FaUser aria-hidden="true" />
              {!collapsed && <span className="truncate">Hồ sơ</span>}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${sidebarTheme.logoutBtn} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? 'Đăng xuất' : undefined}
            >
              <FaSignOutAlt aria-hidden="true" />
              {!collapsed && <span className="truncate">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-[250ms] ${collapsed ? 'md:ml-[68px]' : 'md:ml-60'}`}>
        <header className="sticky top-0 z-[120] border-b border-[#e8edf5] bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe7f3] bg-white text-[#1a1a2e] transition hover:bg-[#f7f9fc] md:hidden"
                aria-label="Mo menu"
              >
                <FaBars aria-hidden="true" />
              </button>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">SmartRent workspace</p>
                <h1 className="text-lg font-semibold text-[#0f172a] sm:text-[1.35rem]">{headerTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user?.role === 'renter' && <NotificationBell />}

              <Link
                to="/"
                className="hidden items-center gap-2 rounded-xl border border-[#dfe7f3] bg-white px-3 py-2 text-sm font-medium text-[#0f172a] no-underline transition hover:border-primary hover:text-primary lg:inline-flex"
              >
                <FaComments aria-hidden="true" className="text-primary" />
                Trang chủ
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-2xl border border-[#dfe7f3] bg-white px-3 py-2.5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  aria-haspopup="menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-white">
                    {initials}
                  </div>
                  <div className="hidden min-w-0 text-left sm:block">
                    <div className="truncate text-sm font-semibold text-[#0f172a]">{user?.name || 'Tai khoan'}</div>
                    <div className="truncate text-xs text-[#64748b]">{roleCfg.label}</div>
                  </div>
                  <FaAngleDown className={`text-xs text-[#64748b] transition ${userDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white py-2 shadow-[0_20px_45px_rgba(15,23,42,0.14)]">
                    <button
                      type="button"
                      onClick={handleProfile}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#0f172a] transition hover:bg-[#f8fafc]"
                    >
                      <FaUser className="text-[#64748b]" aria-hidden="true" />
                      Trang ca nhan
                    </button>
                    <Link
                      to="/"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-[#0f172a] no-underline transition hover:bg-[#f8fafc] lg:hidden"
                    >
                      <FaComments className="text-[#64748b]" aria-hidden="true" />
                      Trang chủ
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <FaSignOutAlt aria-hidden="true" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
