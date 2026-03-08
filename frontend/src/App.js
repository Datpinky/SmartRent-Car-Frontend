import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import CarDetail from './pages/CarDetail/CarDetail';
import Login from './pages/Login/Login';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Login page: no navbar/footer */}
        <Route path="/login" element={<Login />} />

        {/* Main layout */}
        <Route path="/*" element={
          <div className="app-layout">
            <Navbar />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/xe/:id" element={<CarDetail />} />
              </Routes>
            </div>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
