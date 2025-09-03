import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';  // Fixed import
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'faculty', label: 'Faculty Member' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'vc', label: 'Vice Chancellor' }
  ];

  const departments = [
    { value: 'cse', label: 'Computer Science & Engineering' },
    { value: 'ece', label: 'Electronics & Communication' },
    { value: 'me', label: 'Mechanical Engineering' },
    { value: 'ce', label: 'Civil Engineering' }
  ];

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.email?.endsWith('@nsut.ac.in')) {
      newErrors.push('Email must be from nsut.ac.in domain');
    }
    
    if (formData.password?.length < 8) {
      newErrors.push('Password must be at least 8 characters long');
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    // Added validation for required fields
    if (!formData.fullname?.trim()) {
      newErrors.push('Full name is required');
    }

    if (!formData.username?.trim()) {
      newErrors.push('Employee ID is required');
    }

    if (formData.role !== 'vc' && !formData.department) {
      newErrors.push('Department is required');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleRoleSelect = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Uncommented validation
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        window.location.href = '/';
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      setErrors([error.response?.data?.message || 'Registration failed']);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Choose Your Role</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {roles.map(role => (
            <Button
              key={role.value}
              variant="outline"
              className="h-24 text-lg"
              onClick={() => handleRoleSelect(role.value)}
            >
              {role.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </div>
  );

  const renderRegistrationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Complete Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Input
            placeholder="Full Name"
            value={formData.fullname || ''}
            onChange={e => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
            required
          />
          
          <Input
            placeholder="Employee ID"
            value={formData.username || ''}
            onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
          
          <Input
            type="email"
            placeholder="Email (@nsut.ac.in)"
            value={formData.email || ''}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          
          {(formData.role === 'faculty' || formData.role === 'hod') && (
            <Select 
              value={formData.department}
              onValueChange={value => setFormData(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Input
            type="password"
            placeholder="Password"
            value={formData.password || ''}
            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          
          <Input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword || ''}
            onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        </div>

        {errors.length > 0 && (
          <div className="mt-4">
            {errors.map((error, index) => (
              <Alert key={index} variant="destructive" className="mb-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between gap-4">
          <Button type="button" variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-blue-500 hover:underline">
            Already have an account? Sign In
          </Link>
        </div>
      </CardContent>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        {step === 1 ? renderRoleSelection() : renderRegistrationForm()}
      </Card>
    </div>
  );
};

export default Register;
