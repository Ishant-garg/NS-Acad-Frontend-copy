import React, { useEffect, useState } from 'react';
import { AlertCircle, Upload, Loader2 } from "lucide-react";
import { getCurrentUser } from '../utils/auth';
import './Loader.css';
import axios from 'axios'

const Form = ({ pageFields, submitFormData, cancel, isLoading }) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [fileData, setFileData] = useState(null);
  const [uploadedFileID, setUploadedFileID] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  
  const user = getCurrentUser();

  useEffect(() => {
    setFields(pageFields);
    const initialData = pageFields.reduce((acc, field) => {
      acc[field] = '';
      return acc;
    }, {});
    setFormData(initialData);
  }, [pageFields]);

  const handleInputChange = (e, field) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileInputChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setWarningMessage("File size must be less than 10MB");
        return;
      }
      if (!file.type.includes('pdf')) {
        setWarningMessage("Only PDF files are allowed");
        return;
      }
      setFileData(file);
      setWarningMessage("");
      setFormErrors(prev => ({ ...prev, fileUpload: '' }));
    }
  };

  const sendFile = async (event) => {
    event.preventDefault();
    
    if (!fileData) {
      setWarningMessage("Please select a file to upload");
      setFormErrors(prev => ({ ...prev, fileUpload: 'File upload is required' }));
      return;
    }

    if (uploadedFiles.some(f => f.name === fileData.name && f.size === fileData.size)) {
      setWarningMessage("This file has already been uploaded");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setWarningMessage("");
    
    try {
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('userId', user.id);

      const response = await axios.post(
        `http://localhost:8000/file/upload/${user.id}`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            },
        }
    );

    //   if (!response.statusText) throw new Error('Upload failed');
      console.log(response);
      const data = await response.data;
      setUploadedFileID(data.fileId);
      localStorage.setItem("fileID",data.fileId);
      setUploadedFiles(prev => [...prev, { name: fileData.name, size: fileData.size }]);
    } catch (error) {
      console.error("Upload error:", error);
      setWarningMessage("Upload failed. Please try again");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const validateForm = () => {
    const errors = {};
    fields.forEach(item => {
      if (!formData[item] || formData[item].trim() === '') {
        errors[item] = `${item[0]} is required`;
      }
    });

    if (!uploadedFileID) {
      errors.fileUpload = 'File upload is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const dataArray = Object.entries(formData).map(([field, value]) => ({ [field]: value }));
      submitFormData(dataArray, uploadedFileID);
    } else {
      setWarningMessage("Please fill all required fields and upload a file");
    }
  };

  if (isLoading) {
    return (
      <div className="loader-container1">
        <div className="spinner1"></div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">
        Please fill out all required fields and upload the supporting document
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((item, index) => (
          <div key={index} className="flex flex-col justify-between">
            <label htmlFor={item} className="block text-base font-medium text-gray-700">
              {item[0]}
            </label>
            {item[1] === 'text' ? (
              <input
                type="text"
                name={item}
                id={item}
                value={formData[item] || ''}
                onChange={(e) => handleInputChange(e, item)}
                className="mt-1 block w-full text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                disabled={isUploading}
              />
            ) : item[1] === 'select' ? (
              <select
                name={item}
                id={item}
                value={formData[item] || ''}
                onChange={(e) => handleInputChange(e, item)}
                className="mt-1 block w-full text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                disabled={isUploading}
              >
                <option value="">Select an option</option>
                {item[2]?.map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
              </select>
            ) : null}
            {formErrors[item] && (
              <p className="mt-1 text-sm text-red-600 font-medium">{formErrors[item]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50">
        <label htmlFor="fileUploaded" className="block text-sm font-medium text-gray-700 mb-2">
          Upload supporting document (PDF, max 10MB)
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="file"
            name="fileUploaded"
            id="fileUploaded"
            accept=".pdf"
            onChange={(e) => handleFileInputChange(e, 'fileUploaded')}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              focus:outline-none"
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-indigo-700">
        <button 
          className={`
            px-8 py-2
            text-sm font-medium
            bg-indigo-100
            rounded-md
            border-2
            shadow-sm
            transition-all duration-150 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isUploading 
              ? 'text-indigo-700 bg-indigo-100 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            }
            w-36
          `}
          onClick={sendFile}
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Uploading...
            </span>
          ) : (
            <span className="flex items-center justify-center text-white font-extrabold">
              <Upload className="mr-2 h-6 w-6 " />
              Upload File
            </span>
          )}
        </button>

        {isUploading && (
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">{uploadProgress}%</span>
            <div className="w-32 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {(warningMessage || formErrors.fileUpload) && (
        <div className="mt-2 flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p className="text-sm">{warningMessage || formErrors.fileUpload}</p>
        </div>
      )}

      <div className="mt-1 flex justify-center space-x-4 w-full text-white">
        <button 
          className="px-6 py-2 w-[10vw] border-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-150"
          onClick={() => cancel(uploadedFileID)}
          disabled={isUploading}
        >
          Cancel
        </button>
        <button 
          className="px-6 py-2 w-[10vw] border-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150"
          onClick={handleSubmit}
          disabled={isUploading}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Form;