import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaBars, FaUser, FaCalendarAlt, FaAmbulance, FaSignOutAlt } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_DASHBOARD_PATHS = {
  admin: '/admin/dashboard',
  showroom: '/showroom/dashboard',
  owner: '/owner/dashboard',
  renter: '/renter/profile',
};

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); setMenuOpen(false); setUserDropdownOpen(false); navigate('/'); };

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  return (
    <nav className="sticky top-0 z-[1000] bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 max-w-[1280px] mx-auto px-5">
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-gray-800">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-lg font-black">
            <MdDirectionsCar size={20} />
          </div>
          <span>Smart<span className="text-primary">Rent</span> Car</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(o => !o)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-primary hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-extrabold">
                  {initials}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
                <span className={`text-xs text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-[1001] min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1.5">
                  {user.role === 'renter' && (
                    <>
                      <button type="button" onClick={() => { navigate('/renter/profile'); setUserDropdownOpen(false); }} className="flex items-center gap-2 w-full py-2.5 px-3.5 border-0 bg-transparent text-left text-[0.85rem] text-gray-700 hover:bg-gray-100 transition-colors">
                        <FaUser /> Hồ sơ cá nhân
                      </button>
                      <button type="button" onClick={() => { navigate('/renter/bookings'); setUserDropdownOpen(false); }} className="flex items-center gap-2 w-full py-2.5 px-3.5 border-0 bg-transparent text-left text-[0.85rem] text-gray-700 hover:bg-gray-100 transition-colors">
                        <FaCalendarAlt /> Chuyến đi của tôi
                      </button>
                      <button type="button" onClick={() => { navigate('/renter/sos'); setUserDropdownOpen(false); }} className="flex items-center gap-2 w-full py-2.5 px-3.5 border-0 bg-transparent text-left text-[0.85rem] text-gray-700 hover:bg-gray-100 transition-colors">
                        <FaAmbulance /> Hỗ trợ khẩn cấp
                      </button>
                      <div className="h-px bg-gray-200 my-1" />
                    </>
                  )}
                  {user.role !== 'renter' && (
                    <button type="button" onClick={() => { navigate(ROLE_DASHBOARD_PATHS[user.role] || '/'); setUserDropdownOpen(false); }} className="flex items-center gap-2 w-full py-2.5 px-3.5 border-0 bg-transparent text-left text-[0.85rem] text-gray-700 hover:bg-gray-100 transition-colors">
                      Vào Dashboard
                    </button>
                  )}
                  <button type="button" onClick={handleLogout} className="flex items-center gap-2 w-full py-2.5 px-3.5 border-0 bg-transparent text-left text-[0.85rem] text-red-600 hover:bg-red-50 transition-colors">
                    <FaSignOutAlt /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => navigate('/login')} className="py-2 px-5 rounded-lg text-sm font-semibold border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-md transition-all">
              Đăng nhập
            </button>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden py-3 pt-3 border-t border-gray-100 bg-white flex flex-col">
          {user ? (
            <>
              {user.role === 'renter' && (
                <>
                  <button type="button" onClick={() => { navigate('/renter/profile'); setMenuOpen(false); }} className="w-full py-3 px-5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Hồ sơ cá nhân</button>
                  <button type="button" onClick={() => { navigate('/renter/bookings'); setMenuOpen(false); }} className="w-full py-3 px-5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Chuyến đi của tôi</button>
                  <button type="button" onClick={() => { navigate('/renter/sos'); setMenuOpen(false); }} className="w-full py-3 px-5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Hỗ trợ khẩn cấp</button>
                </>
              )}
              {user.role !== 'renter' && (
                <button type="button" onClick={() => { navigate(ROLE_DASHBOARD_PATHS[user.role] || '/'); setMenuOpen(false); }} className="w-full py-3 px-5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Vào Dashboard</button>
              )}
              <button type="button" onClick={() => { handleLogout(); }} className="w-full py-3 px-5 text-left text-sm font-medium text-red-600 hover:bg-gray-100 transition-colors">Đăng xuất</button>
            </>
          ) : (
            <button type="button" onClick={() => { navigate('/login'); setMenuOpen(false); }} className="mt-1 w-full py-2 px-5 rounded-lg text-sm font-semibold border-2 border-primary text-primary bg-transparent text-center hover:bg-primary hover:text-white transition-colors">
              Đăng nhập
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
