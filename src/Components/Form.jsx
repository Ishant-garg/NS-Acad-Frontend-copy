import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Loader.css'

const Form = (props) => {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [fileData, setFileData] = useState(null);
    const [uploadedFileID, setUploadedFileID] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [warningMessage, setWarningMessage] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    
    let userID = localStorage.getItem('myData');

    useEffect(() => {
        setFields(props.pageFields);
        const initialData = props.pageFields.reduce((acc, field) => {
            acc[field] = '';
            return acc; 
        }, {});
        setFormData(initialData); 
    }, [props.pageFields]);

    const handleInputChange = (e, field) => {
        setFormData(prevData => ({
            ...prevData,
            [field]: e.target.value
        }));
        setFormErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleFileInputChange = (e, field) => {
        const file = e.target.files[0];
        setFileData(file);
        setWarningMessage("");
        setFormErrors(prev => ({ ...prev, fileUpload: '' }));
    };

    const sendFile = async (event) => {
        event.preventDefault();
        
        if (!fileData) {
            setWarningMessage("Please select a file to upload.");
            setFormErrors(prev => ({ ...prev, fileUpload: 'File upload is required' }));
            return;
        }

        if (uploadedFiles.some(f => f.name === fileData.name && f.size === fileData.size)) {
            setWarningMessage("This file has already been uploaded. Please choose a different file.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setWarningMessage("");
        
        try {
            const parsedUserID = JSON.parse(userID).id;
            const formData = new FormData();
            formData.append('file', fileData);
    
            const response = await axios.post(
                `http://localhost:8000/file/upload/${parsedUserID}`,
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
            setUploadedFileID(response.data.fileId);
            setUploadedFiles(prev => [...prev, { name: fileData.name, size: fileData.size }]);
        } catch (error) {
            console.error("Error uploading file:", error);
            setWarningMessage("An error occurred while uploading the file. Please try again.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    function validateForm() {
        let errors = {};
        let isValid = true;

        fields.forEach(item => {
            if (!formData[item] || formData[item].trim() === '') {
                errors[item] = `${item[0]} is required`;
                isValid = false;
            }
        });

        if (!uploadedFileID) {
            errors.fileUpload = 'File upload is required';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    }

    function sendData() {
        if (validateForm()) {
            const dataArray = Object.entries(formData).map(([field, value]) => ({ [field]: value }));
            props.submitFormData(dataArray, uploadedFileID);
        } else {
            setWarningMessage("Please fill all required fields and upload a file.");
        }
    }

    return (
        !props.isLoading ? (
        <div>
            <div className="px-8 py-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">Please fill out all required fields and upload the supporting document.</h2>
                {/* <p className="text-gray-600 mb-6"></p> */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {fields.map((item, index) => (
                        <div key={index} className="flex flex-col justify-between ">
                            <label htmlFor={item} className="block text-base font-medium text-gray-700">
                                {item[0]}
                            </label>
                            {/* <div className="w-full border-2"> */}
                                {item[1] === 'text' && (
                                    <input
                                        type="text"
                                        name={item}
                                        id={item}
                                        value={formData[item] || ''}
                                        onChange={(e) => handleInputChange(e, item)}
                                        className="mt-1 block w-full text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                        disabled={isUploading}
                                    />
                                )}
                                {item[1] === 'select' && (
                                    <select
                                        name={item}
                                        id={item}
                                        value={formData[item] || ''}
                                        onChange={(e) => handleInputChange(e, item)}
                                        className="mt-1 block w-full text-black bg-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                        disabled={isUploading}
                                    >
                                        <option value="">Select an option</option>
                                        {item[2].map((option, index) => (
                                            <option key={index} value={option}>{option}</option>
                                        ))}
                                    </select>
                                )}
                                {formErrors[item] && <p className="mt-1 text-sm text-red-600 font-medium">{formErrors[item]}</p>}
                            </div>
                        // </div>
                    ))}
                </div>

                <div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50">
                    <label htmlFor='fileUploaded' className="block text-sm font-medium text-gray-700 mb-2">
                        Upload the supporting document
                    </label>
                    <div className="mt-1 flex items-center">
                        <input
                            type="file"
                            name='fileUploaded'
                            id='fileUploaded'
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
                                <svg className="animate-spin mr-2 ml-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            <span >Upload File</span>
                        )}    
                    </button>
                    
                    {isUploading && (
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">
                                {uploadProgress}%
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div> 
                    )} 
                </div>

                {warningMessage && (
                    <p className="mt-2 text-sm text-red-600">{warningMessage}</p>
                )}
                {formErrors.fileUpload && 
                    <p className="mt-2 text-sm text-red-600">{formErrors.fileUpload}</p>
                }

                <div className='mt-1 flex justify-end space-x-4 text-white '>
                    <button 
                        className='px-6 py-2 w-[10vw] border-2 bg-red-500 text-white rounded-md'
                        onClick={()=>{props.cancel(uploadedFileID)}} 
                        disabled={isUploading} 
                    >
                        Cancel
                    </button>
                    <button 
                        className='px-6 py-2 w-[10vw] border-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150'
                        onClick={sendData} 
                        disabled={isUploading}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
        ) : (
            <div className="loader-container1">
                <div className="spinner1"></div>
            </div>
        )
    )
}

export default Form