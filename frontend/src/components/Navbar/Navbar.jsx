import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaBars, FaUser, FaCalendarAlt, FaAmbulance, FaSignOutAlt } from 'react-icons/fa';
import { MdDirectionsCar } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

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
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><MdDirectionsCar size={20} /></div>
          <span>Smart<span style={{ color: 'var(--primary)' }}>Rent</span> Car</span>
        </Link>

        <div className="navbar-links desktop-only">
          {user ? (
            <div className="navbar-user-wrap" ref={dropdownRef}>
              <button className="navbar-user-btn" onClick={() => setUserDropdownOpen(o => !o)}>
                <div className="navbar-avatar">{initials}</div>
                <span className="navbar-user-name">{user.name}</span>
                <span className="navbar-user-chevron">▼</span>
              </button>
              {userDropdownOpen && (
                <div className="navbar-dropdown">
                  {user.role === 'renter' && (
                    <>
                      <button onClick={() => { navigate('/renter/profile'); setUserDropdownOpen(false); }}>
                        <FaUser /> Hồ sơ cá nhân
                      </button>
                      <button onClick={() => { navigate('/renter/bookings'); setUserDropdownOpen(false); }}>
                        <FaCalendarAlt /> Chuyến đi của tôi
                      </button>
                      <button onClick={() => { navigate('/renter/sos'); setUserDropdownOpen(false); }}>
                        <FaAmbulance /> Hỗ trợ khẩn cấp
                      </button>
                      <div className="navbar-dropdown-divider" />
                    </>
                  )}
                  {user.role !== 'renter' && (
                    <button onClick={() => { navigate(ROLE_DASHBOARD_PATHS[user.role] || '/'); setUserDropdownOpen(false); }}>
                      Vào Dashboard
                    </button>
                  )}
                  <button className="navbar-dropdown-logout" onClick={handleLogout}>
                    <FaSignOutAlt /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-login" onClick={() => navigate('/login')}>Đăng nhập</button>
          )}
        </div>

        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              {user.role === 'renter' && (
                <>
                  <button className="mobile-menu-item" onClick={() => { navigate('/renter/profile'); setMenuOpen(false); }}>Hồ sơ cá nhân</button>
                  <button className="mobile-menu-item" onClick={() => { navigate('/renter/bookings'); setMenuOpen(false); }}>Chuyến đi của tôi</button>
                  <button className="mobile-menu-item" onClick={() => { navigate('/renter/sos'); setMenuOpen(false); }}>Hỗ trợ khẩn cấp</button>
                </>
              )}
              {user.role !== 'renter' && (
                <button className="mobile-menu-item" onClick={() => { navigate(ROLE_DASHBOARD_PATHS[user.role] || '/'); setMenuOpen(false); }}>Vào Dashboard</button>
              )}
              <button className="mobile-menu-item logout" onClick={() => { handleLogout(); }}>Đăng xuất</button>
            </>
          ) : (
            <button className="btn-login mobile-login" onClick={() => { navigate('/login'); setMenuOpen(false); }}>Đăng nhập</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
