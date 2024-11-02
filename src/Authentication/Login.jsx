import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = (props) => {
  const formFields = [
    { name: 'username', label: 'College ID', type: 'text', placeholder: 'College ID' },
    // { name: 'email', label: 'Email', type: 'email', placeholder: 'abc@nsut.ac.in' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
  ];

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  // const [enable,setEnable] = useState(true); 

  // const validateEmail = (email) => {
  //   const regex = /^[a-z0-9._%+-]+@nsut\.ac\.in$/;
  //   return regex.test(email);
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));

    let newErrors = [...errors];

    // if (name === 'email') {
    //   const isValid = validateEmail(value);
    //   if (!isValid) {
    //     newErrors = newErrors.filter(error => !error.includes("Email"));
    //     setEnable(false);
    //     newErrors.push("Email must be a valid @nsut.ac.in address");
    //   } else {
    //     setEnable(true);
    //     newErrors = newErrors.filter(error => !error.includes("Email"));
    //   }
    // }

    if (name === 'password') {
        newErrors = newErrors.filter(error => !error.includes("Password"));
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (errors.length > 0) {
      toast.error("Please correct the errors before submitting");
      return;
    }

    try {
      // const response = await axios.post('http://localhost:8000/auth/login', formData);
      const response = await axios.post('http://localhost:8000/auth/login', formData);
      // console.log( response.data.user );
      const dataToStore = {"id": response.data.user._id};  
      localStorage.setItem('myData', JSON.stringify(dataToStore));
      const role = {"id":  response.data.user.role};   
      localStorage.setItem('role', JSON.stringify(role));
      const name = {"id":  response.data.user.fullname};  
      localStorage.setItem('name', JSON.stringify(name));
      const department = {"department":  response.data.user.department};  
      localStorage.setItem('department', JSON.stringify(department));
      props.handleLogin();
      toast.success('Login successful!');
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="backgroundLogin">
        <div className="shapeLogin"></div>
        <div className="shapeLogin"></div>
      </div>
      <form onSubmit={handleSubmit} className='formLogin'>
        <h3>Login Here</h3>
        {formFields.map((field) => (
          <div key={field.name} className='fory' >
            <label htmlFor={field.name} className='labelLogin'>{field.label}:</label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
              required
              className='inputLogin'
            />
          </div>
        ))}
        <br />
        <div style={{textAlign:'end', color:'#eaf0fb'}} className='forget-login' >
          <Link to='/register'>Don't have an account? Sign Up</Link>
        </div>
        <br /> 
       <button type="submit" className='button' disabled={errors.length > 0}>Log In</button>
       {/* { enable && <button type="submit" className='button' disabled={errors.length > 0}>Log In</button>}
       { !enable && <button type="submit" className='button' style={{cursor:'not-allowed'}} disabled={true}>Log In</button>} */}
        {errors.length > 0 && (
          <div className="error-container">
            {errors.map((error, index) => (
              <div key={index} className="error-message">{error}</div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;