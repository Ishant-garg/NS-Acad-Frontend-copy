import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { fetchUserData } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ handleLogout }) => {
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const getUserData = async () => {
      const user = await fetchUserData();
      setUserData(user);
    };
    getUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleDisplay = (role) => {
    const roles = {
      'faculty': 'Faculty Member',
      'hod': 'Head of Department',
      'vc': 'Vice Chancellor'
    };
    return roles[role] || role;
  };

  if (!userData) return null;

  return (
    <nav className="fixed top-0 right-0 z-50 ml-[20%] bg-white border-b border-slate-200 w-[calc(80%)]">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center" />
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-slate-700">{userData.fullname}</span>
              <span className="text-xs text-slate-500">{getRoleDisplay(userData.role)}</span>
            </div>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-700">{userData.fullname}</p>
                <p className="text-xs text-slate-500">{userData.email}</p>
                <p className="text-xs text-slate-500">{userData.department}</p>
              </div>
              
              <div className="py-2">
                <button 
                  className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile'); 
                  }}
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  Profile Settings
                </button>
                
                <button 
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;