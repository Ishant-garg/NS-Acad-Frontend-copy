import React, { useEffect, useState } from 'react';
import './App.css';
import SideBar from './Components/SideBar';
import { Route, Routes } from 'react-router-dom';
import Home from './Pages/Home';
import Login from './Authentication/Login';
import Register from './Authentication/Register';
import Navbar from './Components/Navbar';
import Query from './Components/HOD/Query';

const App = () => {
  const [currentPage, setCurrentPage] = useState("c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566");
  const [role,setRole] = useState("");
  const [myData, setMyData] = useState(localStorage.getItem('myData') );

  useEffect(()=>{

      async function getUserRole(){
          const parsedRole = JSON.parse(localStorage.getItem('role'));
          setRole(parsedRole.id);  
      }
      getUserRole(); 

  },[myData,role])
  

  const changeCurrentPage = (pageID) => {
    setCurrentPage(pageID);
  }

  const [isLogged, setIsLogged] = useState(false);
  
  function handleLogout() {
    localStorage.removeItem('myData');
    setMyData(null);
    setIsLogged(false);
  }
  
  function handleLogin() {
    setMyData(JSON.parse(localStorage.getItem('myData')));
    setIsLogged(true);
  }
 

  return (
    <>
      {myData ? (
        <>
        { 
          role=='faculty' &&  ( 
                <div className="app-container">
                    <div className="sidebar" >
                      <SideBar changeCurrentPage={changeCurrentPage}  />
                    </div>
                    <div className="content">
          
                      <Navbar handleLogout={handleLogout} />
                      <Routes>
                        <Route path="/" element={<Home currentPage={currentPage} />} />
                      </Routes>
                      
                    </div>
                </div>
                )
            }
            { 
                role=='hod' &&  ( 
                  <div className="app-container-2">          
                    <Navbar handleLogout={handleLogout}  />         
                    <div className='querySection' >
                         <Query/>
                    </div>
                  </div>
                )
            }
            { 
                role=='vc' &&  ( 
                  <div className="app-container">  
                    <div className="sidebar" >
                      <SideBar changeCurrentPage={changeCurrentPage}  />
                    </div>
                    <div className="content">
          
                      <Navbar handleLogout={handleLogout} />
                      <Routes>
                        <Route path="/" element={<Home currentPage={currentPage} />} />
                      </Routes>
                      
                    </div>
                  </div>
                )
            }
        </>
      ) : (
        <div>
          <Routes>
              <Route path="/" element={<Login handleLogin={handleLogin} />} />
              <Route path="/register" element={<Register/>} />
          </Routes>

        </div>
      )}
    </>
  );
};

export default App;