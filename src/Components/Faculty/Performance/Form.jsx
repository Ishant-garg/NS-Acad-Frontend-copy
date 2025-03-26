import { useEffect, useState, useMemo } from 'react';
import { AlertCircle, Upload, Loader2, Calendar } from "lucide-react";
import { getCurrentUser } from '../../../utils/auth';
import './Loader.css';
import axios from 'axios';
import PropTypes from 'prop-types';

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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const user = getCurrentUser();

  // Generate a list of academic years (current year and 5 previous years)
  const academicYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, []);

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

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleFileInputChange = (e) => {
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
      // Pass the selected year to the submit function
      submitFormData(dataArray, uploadedFileID, selectedYear);
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

      {/* Academic Year selection */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <label htmlFor="academicYear" className="block text-base font-medium text-gray-700">
            Academic Year
          </label>
        </div>
        <select
          id="academicYear"
          name="academicYear"
          value={selectedYear}
          onChange={handleYearChange}
          className="mt-1 block w-full max-w-xs text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        >
          {academicYears.map((year) => (
            <option key={year} value={year}>
              {year - 1} - {year}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Academic year runs from July {selectedYear - 1} to June {selectedYear}
        </p>
      </div>

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
            onChange={(e) => handleFileInputChange(e)}
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
        {formErrors.fileUpload && !uploadedFileID && (
          <p className="mt-1 text-sm text-red-600 font-medium">{formErrors.fileUpload}</p>
        )}
        {warningMessage && (
          <div className="mt-2 flex items-center text-sm text-red-600">
            <AlertCircle className="mr-1 h-4 w-4" />
            <span>{warningMessage}</span>
          </div>
        )}
        {fileData && !uploadedFileID && (
          <div className="mt-2">
            <button
              type="button"
              onClick={sendFile}
              disabled={isUploading}
              className={`flex items-center px-4 py-2 text-sm font-medium text-white ${
                isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } rounded-md focus:outline-none`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading ({uploadProgress}%)
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        )}
        {uploadedFileID && (
          <div className="mt-2 text-sm text-green-600 font-medium flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
            File uploaded successfully
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => cancel(uploadedFileID)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isUploading}
          className={`px-4 py-2 text-sm font-medium text-white ${
            isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } rounded-md focus:outline-none`}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

// Add prop validation
Form.propTypes = {
  pageFields: PropTypes.array.isRequired,
  submitFormData: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default Form;