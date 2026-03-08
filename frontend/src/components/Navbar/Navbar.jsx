import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaBars } from 'react-icons/fa';

import { MdDirectionsCar } from 'react-icons/md';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <MdDirectionsCar size={20} />
                    </div>
                    <span>Smart<span style={{ color: 'var(--primary)' }}>Rent</span> Car</span>
                </Link>

                {/* Right side */}
                <div className="navbar-links desktop-only">
                    <button className="btn-login" onClick={() => navigate('/login')}>Đăng nhập</button>
                </div>


                {/* Mobile hamburger */}
                <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="mobile-menu">
                    <button className="btn-login mobile-login" onClick={() => { navigate('/login'); setMenuOpen(false); }}>Đăng nhập</button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
