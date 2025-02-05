import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { fetchUserData, logout } from './utils/auth';
import SideBar from './Components/SideBar';
import Home from './Pages/Home';
import Login from './Authentication/Login';
import Register from './Authentication/Register';
import Navbar from './Components/Navbar';
import Query from './Components/HOD/Dashboard';
import './App.css'
import FacultyDetails from './Components/HOD/FacultyDetails';
import Profile from './Components/Profile';
import CoAnalysis from './Pages/Faculty/COPO/CoAnalysis';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateUser = async () => {
      const userData = await fetchUserData();
      setUser(userData);
      setLoading(false);
    };
    validateUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  const [currentPage, setCurrentPage] = useState("c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const userData = await fetchUserData();
      setUser(userData);
      setLoading(false);
    };
    initializeUser();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case 'vc':
      case 'faculty':
        return (
            <Routes>
              <Route path="/" element={
                <div className="app-container">
                  <div className="sidebar">
                    <SideBar changeCurrentPage={setCurrentPage} />
                  </div>
                  <div className="content">
                    <Navbar user={user} handleLogout={handleLogout} />
                      <Home currentPage={currentPage} />
                  </div>
                </div>
                }/>
              <Route path="/profile" element={<Profile/>} />
              <Route path="/copo" element={<CoAnalysis/>} />
            </Routes>
        );
      
      case 'hod':
        return (
          <div className="app-container-2">
            <Navbar user={user} handleLogout={handleLogout} />
            <div className="querySection">
              <Routes>
                <Route path="/" element={ <Query /> } />
                <Route path="/faculty/:userId" element={<FacultyDetails />} />
              </Routes>
            </div>
          </div>
        );
      
      default:
        return <Navigate to="/" />;
    }
  };

  return (
    <>
      {user ? (
        <ProtectedRoute allowedRoles={['faculty', 'hod', 'vc']}>
          {renderDashboard()}
        </ProtectedRoute>
      ) : (
        <Routes>
          <Route path="/" element={<Login handleLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      )}
    </>
  );
};

export default App;