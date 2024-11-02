import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { IoPersonCircle } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { MdLogout } from "react-icons/md";
import './Navbar.css'
 
const Navbar = (props) => {

    const userID = localStorage.getItem('myData');
    const [name,setName] = useState("");
    const [hovered,setHovered] = useState(false); 

    useEffect(()=>{
 
        async function getUserData(){
            const parsedName = JSON.parse(localStorage.getItem('name'));
            setName(parsedName.id);  
        }
        getUserData(); 
 
    },[userID,name])
    const changeHover = () =>{
        setHovered(!hovered); 
    }

    return (
        // <div>

            <div className="profileBox" >
                <div  className="profileBox2" onClick={changeHover} >
                    <IoPersonCircle className='text-blue-500 bg-white rounded-full w-12 h-12 border-0 ' />
                    <div className='h-12 text-2xl font-bold pt-[8px] ' >{name}</div>
                </div>

                {
                hovered && 
                    <div className='hoverCard' >
                        <ul>
                            <li className='flex gap-3 items-center' ><CgProfile className='h-5 w-5' /> <span>Profile</span></li>
                            <hr className='border-1'  />
                            <li  onClick={props.handleLogout}  className='flex gap-3 items-center' ><MdLogout  className='h-5 w-5 text-red-700' /> <span>Logout</span></li>
                        </ul>
                    </div>
                }
            </div>

        // </div>
    )
}

export default Navbar