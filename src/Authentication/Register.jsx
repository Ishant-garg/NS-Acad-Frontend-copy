import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  const [flag1, setFlag1] = useState(false);
  const [flag2, setFlag2] = useState(false);

  const roleFields = [
    { name: 'faculty', label: 'Faculty' },
    { name: 'hod', label: 'HOD' },
    { name: 'vc', label: 'VC' },
  ];

  const handleGoBack = () => {
    setStep(1);
    setRole('');
    setFormData({});
    setErrors([]);
    setFlag1(false);
    setFlag2(false);
  };

  const facultyFields = [
    { name: 'fullname', label: 'Full Name', type: 'text', placeholder: 'Full Name' },
    { name: 'username', label: 'Faculty Emp. ID', type: 'text', placeholder: 'Faculty ID' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'abc@nsut.ac.in' },
    { name: 'department', label: 'Department', type: 'select', placeholder: 'Department' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm Password' },
  ];

  const hodFields = [
    { name: 'fullname', label: 'Full Name', type: 'text', placeholder: 'Full Name' },
    { name: 'username', label: 'HOD Emp. ID', type: 'text', placeholder: 'HOD ID' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'abc@nsut.ac.in' },
    { name: 'department', label: 'Department', type: 'select', placeholder: 'Department' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm Password' },
  ];

  const vcFields = [
    { name: 'fullname', label: 'Full Name', type: 'text', placeholder: 'Full Name' },
    { name: 'username', label: 'VC Emp. ID', type: 'text', placeholder: 'VC ID' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'abc@nsut.ac.in' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm Password' },
  ];

  const validateEmail = (email) => {
    const regex = /^[a-z0-9._%+-]+@nsut\.ac\.in$/;
    return regex.test(email);
  };

  const handleRoleSelect = (selectedRole) => {

    setFormData(prevData => ({ ...prevData, ["role"]: selectedRole }));
    setRole(selectedRole);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  
    let newErrors = [...errors];
  
    if (name === 'email') {
      const ans = validateEmail(value);
      setFlag1(ans);
      if (!ans) {
        newErrors = newErrors.filter(error => !error.includes("Email"));
        newErrors.push("Email must be of the type @nsut.ac.in");
      } else {
        newErrors = newErrors.filter(error => !error.includes("Email"));
      }
    }
    if (name === 'password' || name === 'confirmPassword') {
      const passwordValue = name === 'password' ? value : formData.password;
      const confirmPasswordValue = name === 'confirmPassword' ? value : formData.confirmPassword;
      const ans = passwordValue === confirmPasswordValue && passwordValue !== '';
      setFlag2(ans);
      if (!ans) {
        newErrors = newErrors.filter(error => !error.includes("Passwords"));
        newErrors.push("Passwords do not match!");
      } else {
        newErrors = newErrors.filter(error => !error.includes("Passwords"));
      }
    }
  
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid @nsut.ac.in email address");
      return;
    }
    try {
      const response = await axios.post(`http://localhost:8000/auth/register`, formData);
      toast.success('Registration successful!');
      setErrors([]);
    } catch (err) {
      toast.error('Registration failed. Please try again.');
      // console.error('Registration error:', err);
    }
  };

  const renderFields = () => {
    let fields;
    switch (role) {
      case 'faculty':
        fields = facultyFields;
        break;
      case 'hod':
        fields = hodFields;
        break;
      case 'vc':
        fields = vcFields;
        break;
      default:
        fields = [];
    }

    return fields.map((field) => (
      <div key={field.name} className='formGroup inline-block w-[50%]'>
        {field.type !== 'select' ? (
          <>
            <label htmlFor={field.name} className='label register-label'>{field.label}:</label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
              required
              className='input register-input'
              placeholder={field.placeholder}
            />
          </>
        ) : (
          <>
            <label htmlFor={field.name} className='label register-label'>{field.label}:</label>
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
              required
              className='input register-input'
            >
              <option value="" className='optionRegister'>Select a Department</option>
              <option value="cse" className='optionRegister'>Computer Science</option>
              <option value="ece" className='optionRegister'>Electrical</option>
            </select>
          </>
        )}
      </div>
    ));
  };

  return (
    <div className="register-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="backgroundRegister">
        <div className="shapeRegister"></div>
        <div className="shapeRegister"></div>
      </div>
      <form onSubmit={handleSubmit} className='form register-form'>
        <h3>Sign Up Here</h3>
        {step === 1 ? (
          <>
            <h4>Select your role:</h4>
            <div className="role-selection">
              {roleFields.map((roleField) => (
                <button
                  key={roleField.name}
                  type="button"
                  onClick={() => handleRoleSelect(roleField.name)}
                  className="role-button"
                >
                  {roleField.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {renderFields()}
            <div style={{ textAlign: 'end', color: '#eaf0fb', marginTop: '20px' }}>
              <Link to='/'>Already have an account? Sign In</Link>
            </div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'space-between',gap:'1vw' }}>
              <button type="button" onClick={handleGoBack} className='button'>Back</button>
              {flag1 && flag2 ? (
                <button type="submit" className='button'>Register</button>
              ) : (
                <button type="submit" style={{cursor:'not-allowed'}} disabled={true} className='button'>Register</button>
              )}
            </div>
            {errors.length > 0 && (
              <div className="error-container">
                {errors.map((error, index) => (
                  <div key={index} className="error-message">{error}</div>
                ))}
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default Register;