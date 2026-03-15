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
    <div className="flex min-h-screen bg-[#f4f6f9] relative">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/45 z-[199] md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-[200] flex flex-col bg-[#1a1a2e] overflow-hidden
          transition-[width] duration-200 ease-out
          w-[240px] ${collapsed ? 'md:w-[68px]' : 'md:w-[240px]'}
          -translate-x-full md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : ''}
        `}
      >
        <div className="flex items-center justify-between py-4 px-3.5 border-b border-white/10 min-h-[64px] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-[34px] h-[34px] rounded-lg bg-primary flex items-center justify-center font-black text-base text-white flex-shrink-0 cursor-pointer">S</div>
              <div className="flex flex-col leading-tight">
                <span className="text-[0.95rem] font-extrabold text-white">SmartRent</span>
                <span className="text-[0.65rem] text-white/45 font-normal">Car Rental</span>
              </div>
            </div>
          )}
          {collapsed && <div className="w-[34px] h-[34px] rounded-lg bg-primary flex items-center justify-center font-black text-base text-white flex-shrink-0 cursor-pointer mx-auto" onClick={() => navigate('/')}>S</div>}
          <button type="button" className="hidden md:flex w-7 h-7 rounded-md bg-white/10 text-white/60 items-center justify-center text-sm flex-shrink-0 hover:bg-white/15 hover:text-white transition-colors" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <FaAngleRight /> : <FaBars />}
          </button>
          <button type="button" className="md:hidden flex w-7 h-7 rounded-md bg-white/10 text-white/60 items-center justify-center text-sm flex-shrink-0 hover:bg-white/15 hover:text-white" onClick={() => setSidebarOpen(false)}><FaTimes /></button>
        </div>

        {!collapsed && (
          <div className="mx-3 mt-2.5 mb-1 py-1.5 px-3 rounded-lg text-[0.72rem] font-bold flex items-center gap-1.5" style={{ background: roleCfg.bg, color: roleCfg.color }}>
            <MdVerifiedUser className="text-[0.85rem]" /> {roleCfg.label}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {menus.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              title={collapsed ? item.label : ''}
              className={`
                flex items-center gap-2.5 w-full py-2.5 px-3.5 bg-transparent border-0 text-left text-[0.85rem] font-medium cursor-pointer transition-all duration-150 relative
                ${isActive(item.path) ? 'text-white bg-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}
                ${isActive(item.path) ? 'before:content-[""] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-primary before:rounded-r' : ''}
              `}
            >
              <span className="text-base flex-shrink-0 w-5 flex items-center justify-center">{item.icon}</span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && isActive(item.path) && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5 py-2 px-1 mb-2">
              <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: roleCfg.color }}>{initials}</div>
              <div className="min-w-0">
                <div className="text-[0.8rem] font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[0.68rem] text-white/40 truncate">{user?.email}</div>
              </div>
            </div>
          )}
          {collapsed && <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 mx-auto mb-2" style={{ background: roleCfg.color }}>{initials}</div>}
          <button type="button" onClick={handleLogout} title={collapsed ? 'Đăng xuất' : ''} className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-white/10 border-0 text-white/60 cursor-pointer text-[0.82rem] font-medium hover:bg-red-500/20 hover:text-red-200 transition-all">
            <FaSignOutAlt />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ease-out ml-0 md:ml-[240px] ${collapsed ? 'md:ml-[68px]' : ''}`}>
        <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-5 sticky top-0 z-[100] shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" className="md:hidden flex p-1.5 rounded-md text-gray-700 hover:bg-gray-100" onClick={() => setSidebarOpen(true)}><FaBars /></button>
            <div className="text-[0.9rem] font-semibold text-gray-900">
              {menus.find(m => isActive(m.path))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="w-[38px] h-[38px] rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-light transition-colors" onClick={() => navigate('/')} title="Trang chủ"><FaStore /></button>
            {(user?.role === 'renter' || user?.role === 'showroom') && (
              <button type="button" className="w-[38px] h-[38px] rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-light transition-colors" title="Chat"><FaComments /></button>
            )}
            <NotificationBell />
            {user?.role !== 'renter' && (
              <div className="relative flex items-center gap-1.5 py-1 px-2 rounded-xl cursor-pointer select-none hover:bg-gray-100 transition-colors" ref={dropdownRef} onClick={() => setUserDropdownOpen(o => !o)}>
                <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: roleCfg.color }}>{initials}</div>
                <span className="text-[0.82rem] font-semibold text-gray-700 max-w-[120px] truncate">{user?.name}</span>
                <FaAngleDown className={`text-[0.7rem] text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 z-[999] min-w-[210px] bg-white border border-gray-200 rounded-xl shadow-lg py-2 animate-[dropIn_0.15s_ease]">
                    <div className="flex items-center gap-2.5 py-2.5 px-3.5">
                      <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: roleCfg.color }}>{initials}</div>
                      <div>
                        <div className="text-[0.85rem] font-bold text-gray-900">{user?.name}</div>
                        <div className="text-[0.72rem] font-semibold mt-0.5" style={{ color: roleCfg.color }}>{roleCfg.label}</div>
                      </div>
                    </div>
                    <div className="h-px bg-gray-100 my-1" />
                    <button type="button" onClick={handleProfile} className="flex items-center gap-2 w-full py-2 px-3.5 border-0 bg-transparent text-[0.83rem] text-gray-700 hover:bg-gray-50 text-left transition-colors">
                      <FaUser /> Hồ sơ cá nhân
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button type="button" onClick={handleLogout} className="flex items-center gap-2 w-full py-2 px-3.5 border-0 bg-transparent text-[0.83rem] text-red-600 hover:bg-red-50 text-left transition-colors">
                      <FaSignOutAlt /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <style>{`@keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default DashboardLayout;
