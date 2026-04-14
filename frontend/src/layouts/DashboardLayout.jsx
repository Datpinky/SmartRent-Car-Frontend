import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatWidget } from '../contexts/ChatWidgetContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import NotificationBell from '../components/common/NotificationBell';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '../components/ui/sidebar';
import { cn } from '../lib/utils';
import {
  IconLayoutDashboard,
  IconUsers,
  IconBuildingStore,
  IconReceipt,
  IconUserCircle,
  IconCar,
  IconCalendarEvent,
  IconFileDescription,
  IconChartBar,
  IconRobot,
  IconBuildingCommunity,
  IconMap2,
  IconCashBanknote,
  IconAmbulance,
  IconMenu2,
  IconLogout,
  IconHome,
  IconMessageCircle,
  IconChevronDown,
  IconUser,
} from '@tabler/icons-react';

const stroke = 1.5;
const ic = (Icon) => <Icon className="h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-300" stroke={stroke} />;

const MENUS = {
  admin: [
    { key: 'dashboard', label: 'Tổng quan', path: '/admin/dashboard', Icon: IconLayoutDashboard },
    { key: 'users', label: 'Quản lý người dùng', path: '/admin/users', Icon: IconUsers },
    { key: 'showrooms', label: 'Xác minh Showroom', path: '/admin/showrooms', Icon: IconBuildingStore },
    { key: 'transactions', label: 'Giao dịch', path: '/admin/transactions', Icon: IconReceipt },
    { key: 'profile', label: 'Hồ sơ', path: '/admin/profile', Icon: IconUserCircle },
  ],
  showroom: [
    { key: 'dashboard', label: 'Tổng quan', path: '/showroom/dashboard', Icon: IconLayoutDashboard },
    { key: 'vehicles', label: 'Quản lý xe', path: '/showroom/vehicles', Icon: IconCar },
    { key: 'bookings', label: 'Quản lý đặt xe', path: '/showroom/bookings', Icon: IconCalendarEvent },
    { key: 'contracts', label: 'Hợp đồng', path: '/showroom/contracts', Icon: IconFileDescription },
    { key: 'customers', label: 'Khách hàng', path: '/showroom/customers', Icon: IconUsers },
    { key: 'revenue', label: 'Doanh thu', path: '/showroom/revenue', Icon: IconChartBar },
    { key: 'ai-inspection', label: 'Kiểm tra AI', path: '/showroom/ai-inspection', Icon: IconRobot },
    { key: 'profile', label: 'Hồ sơ Showroom', path: '/showroom/profile', Icon: IconBuildingCommunity },
  ],
  owner: [
    { key: 'dashboard', label: 'Tổng quan', path: '/owner/dashboard', Icon: IconLayoutDashboard },
    { key: 'vehicles', label: 'Xe của tôi', path: '/owner/vehicles', Icon: IconCar },
    { key: 'tracking', label: 'Theo dõi xe', path: '/owner/tracking', Icon: IconMap2 },
    { key: 'revenue', label: 'Doanh thu & Rút tiền', path: '/owner/revenue', Icon: IconCashBanknote },
    { key: 'profile', label: 'Hồ sơ', path: '/owner/profile', Icon: IconUserCircle },
  ],
  renter: [
    { key: 'profile', label: 'Hồ sơ cá nhân', path: '/renter/profile', Icon: IconUser },
    { key: 'bookings', label: 'Chuyến đi của tôi', path: '/renter/bookings', Icon: IconCalendarEvent },
    { key: 'sos', label: 'Hỗ trợ khẩn cấp', path: '/renter/sos', Icon: IconAmbulance },
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

function Logo() {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal text-neutral-900 dark:text-neutral-100"
      aria-label="SmartRent — Trang chủ"
    >
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
        <img src="/logo_transparent.png" alt="" className="h-full w-full object-contain p-0.5" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="whitespace-pre font-semibold text-neutral-900 dark:text-white"
      >
        SmartRent
      </motion.span>
    </Link>
  );
}

function LogoIcon() {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center py-1"
      aria-label="SmartRent — Trang chủ"
    >
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
        <img src="/logo_transparent.png" alt="" className="h-full w-full object-contain p-0.5" />
      </div>
    </Link>
  );
}

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const chatWidget = useChatWidget();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const menus = MENUS[user?.role] || [];
  const roleCfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.renter;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setUserDropdownOpen(false);
    navigate(PROFILE_PATHS[user?.role] || '/');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const headerTitle = (() => {
    const fromMenu = menus.find((m) => isActive(m.path))?.label;
    if (fromMenu) return fromMenu;
    if (location.pathname.startsWith('/renter/checkout')) return 'Thanh toán đặt xe';
    return 'Dashboard';
  })();

  const initials =
    user?.name
      ?.split(' ')
      .map((w) => w[0])
      .slice(-2)
      .join('')
      .toUpperCase() || 'U';

  const profilePath = PROFILE_PATHS[user?.role] || '/';

  const navLinks = useMemo(
    () =>
      (MENUS[user?.role] || []).map((item) => ({
        label: item.label,
        path: item.path,
        icon: ic(item.Icon),
      })),
    [user?.role]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-[#f4f6f9] dark:bg-neutral-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Chuyển đến nội dung chính
      </a>

      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[199] bg-black/45 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate>
        <SidebarBody
          className={cn(
            'justify-between gap-6 px-2 py-4',
            'md:justify-start md:gap-0 md:py-4'
          )}
        >
          <SidebarNavContent
            navLinks={navLinks}
            roleCfg={roleCfg}
            profilePath={profilePath}
            user={user}
            initials={initials}
            onLogout={handleLogout}
          />
        </SidebarBody>
      </Sidebar>

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ease-out max-md:ml-0',
          'md:ml-[var(--dashboard-sidebar-width,76px)]'
        )}
      >
        <header className="sticky top-0 z-[100] flex h-[60px] shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              className="flex rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden dark:text-neutral-200 dark:hover:bg-neutral-800"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu2 size={22} stroke={stroke} aria-hidden />
            </button>
            <div className="text-[0.9rem] font-semibold text-neutral-900 dark:text-neutral-100">
              {headerTitle}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              aria-label="Trang chủ"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary"
            >
              <IconHome size={18} stroke={stroke} aria-hidden />
            </Link>
            {(user?.role === 'renter' || user?.role === 'showroom') && chatWidget && (
              <button
                type="button"
                aria-label="Mở chat hỗ trợ"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary"
                onClick={() => chatWidget.openChat()}
              >
                <IconMessageCircle size={18} stroke={stroke} aria-hidden />
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
                  className="flex cursor-pointer select-none items-center gap-1.5 rounded-[10px] py-1 pl-1 pr-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                >
                  <div
                    aria-hidden
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold text-white"
                    style={{ background: roleCfg.color }}
                  >
                    {initials}
                  </div>
                  <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold text-neutral-700 dark:text-neutral-200">
                    {user?.name}
                  </span>
                  <IconChevronDown
                    size={16}
                    stroke={stroke}
                    className={cn('text-neutral-400 transition-transform', userDropdownOpen && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {userDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-[999] min-w-[210px] rounded-[14px] border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <div
                        aria-hidden
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[0.9rem] font-bold text-white"
                        style={{ background: roleCfg.color }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="text-[0.85rem] font-bold text-neutral-900 dark:text-white">{user?.name}</div>
                        <div className="mt-px text-[0.72rem] font-semibold" style={{ color: roleCfg.color }}>
                          {roleCfg.label}
                        </div>
                      </div>
                    </div>
                    <div role="separator" className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[0.83rem] text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      onClick={handleProfile}
                    >
                      <IconUser size={16} stroke={stroke} aria-hidden /> Hồ sơ cá nhân
                    </button>
                    <div role="separator" className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[0.83rem] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={handleLogout}
                    >
                      <IconLogout size={16} stroke={stroke} aria-hidden /> Đăng xuất
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

/** Nội dung sidebar: cần `useSidebar` nên tách component con. */
function SidebarNavContent({ navLinks, roleCfg, profilePath, user, initials, onLogout }) {
  const { expanded, open, isMobile } = useSidebar();
  const showFullBrand = isMobile ? open : expanded;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <div className="flex shrink-0 items-center px-1">{showFullBrand ? <Logo /> : <LogoIcon />}</div>

        <div
          aria-hidden
          className="mx-1 mt-3 flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.72rem] font-bold"
          style={{ background: roleCfg.bg, color: roleCfg.color }}
        >
          <span className="max-w-[200px] truncate">{roleCfg.label}</span>
        </div>

        <div className="mt-6 flex flex-col gap-0.5 px-0.5">
          {navLinks.map((link, idx) => (
            <SidebarLink key={idx} link={link} />
          ))}
        </div>
      </div>

      <div className="mt-auto shrink-0 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <SidebarLink
          link={{
            label: user?.name || 'Tài khoản',
            path: profilePath,
            icon: (
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold text-white"
                style={{ background: roleCfg.color }}
              >
                {initials}
              </span>
            ),
          }}
        />
        <SidebarLink
          link={{
            label: 'Đăng xuất',
            onClick: onLogout,
            icon: <IconLogout className="h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-300" stroke={stroke} />,
          }}
        />
      </div>
    </>
  );
}

export default DashboardLayout;
