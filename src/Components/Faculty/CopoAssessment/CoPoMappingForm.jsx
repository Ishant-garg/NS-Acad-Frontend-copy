import React, { useState } from 'react';
import CourseOutcomeMappingRow from './CourseOutcomeMappingRow'; // Adjust path if needed
import api from '../../../utils/api';

// Define the POs and PSOs for table headers
const POS_Headers = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);
const PSOS_Headers = Array.from({ length: 4 }, (_, i) => `PSO${i + 1}`);

// --- Default empty state for a new CO row ---
const createDefaultOutcome = () => ({
    coIdentifier: '',
    po1: 0, po2: 0, po3: 0, po4: 0, po5: 0, po6: 0,
    po7: 0, po8: 0, po9: 0, po10: 0, po11: 0, po12: 0,
    pso1: 0, pso2: 0, pso3: 0, pso4: 0,
});
// --- ---

function CoPoMappingForm() {
    const [facultyId, setFacultyId] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [academicYear, setAcademicYear] = useState(''); // e.g., "2023-2024"
    const [semester, setSemester] = useState('');
    const [branch, setBranch] = useState('');
    const [section, setSection] = useState('');
    const [courseOutcomes, setCourseOutcomes] = useState([createDefaultOutcome()]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);  

    // --- Handlers and Validation (mostly unchanged logic) ---
    const handleCourseOutcomeChange = (index, name, value) => {
        const updatedOutcomes = courseOutcomes.map((outcome, i) => {
            if (i === index) {
                return { ...outcome, [name]: value };
            }
            return outcome;
        });
        setCourseOutcomes(updatedOutcomes);
    };

    const addCourseOutcomeRow = () => {
        setCourseOutcomes([...courseOutcomes, createDefaultOutcome()]);
    };

    const removeCourseOutcomeRow = (index) => {
        if (courseOutcomes.length <= 1) {
             setError("At least one Course Outcome mapping is required.");
             setTimeout(() => setError(''), 3000);
             return;
        }
        const updatedOutcomes = courseOutcomes.filter((_, i) => i !== index);
        setCourseOutcomes(updatedOutcomes);
    };

     const validateForm = () => {
         if (!facultyId || !subjectCode || !subjectName || !academicYear || !semester || !branch || !section) {
            return "Please fill in all the course details (Faculty ID, Subject, Year, Semester, etc.).";
        }
        if (!/^\d{4}-\d{4}$/.test(academicYear)) {
            return "Academic Year should be in YYYY-YYYY format (e.g., 2023-2024).";
        }
         const semesterNum = parseInt(semester, 10);
        if (isNaN(semesterNum) || semesterNum <= 0) {
            return "Please enter a valid positive number for the Semester.";
        }
        if (!courseOutcomes || courseOutcomes.length === 0) {
            return "At least one Course Outcome mapping row is required.";
        }
        for(const outcome of courseOutcomes) {
            if (!outcome.coIdentifier || outcome.coIdentifier.trim() === '') {
                return `Row ${courseOutcomes.indexOf(outcome) + 1} must have a CO Identifier (e.g., CO1).`;
            }
        }
        return null; // No validation errors
    }


    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        const validationError = validateForm();
         if (validationError) {
             setError(validationError);
             return;
         }

        const finalSemester = parseInt(semester, 10);

        const formData = {
            facultyId, subjectCode, subjectName, academicYear,
            semester: finalSemester, branch, section,
            courseOutcomes: courseOutcomes.map(co => ({
                ...co,
                po1: Number(co.po1 ?? 0), po2: Number(co.po2 ?? 0), po3: Number(co.po3 ?? 0),
                po4: Number(co.po4 ?? 0), po5: Number(co.po5 ?? 0), po6: Number(co.po6 ?? 0),
                po7: Number(co.po7 ?? 0), po8: Number(co.po8 ?? 0), po9: Number(co.po9 ?? 0),
                po10: Number(co.po10 ?? 0), po11: Number(co.po11 ?? 0), po12: Number(co.po12 ?? 0),
                pso1: Number(co.pso1 ?? 0), pso2: Number(co.pso2 ?? 0), pso3: Number(co.pso3 ?? 0),
                pso4: Number(co.pso4 ?? 0),
            })),
        };

        console.log('Submitting data:', JSON.stringify(formData, null, 2));
 
        try {
           
            console.log('Payload:', JSON.stringify(formData, null, 2));

             
            const response = await api.post('/save/co-po-mappings', formData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('API Response:', response.data);
            setSuccessMessage(response.data.message || 'CO-PO Mapping saved successfully!');

            // Optionally reset the form after successful submission
            // setFacultyId('');
            // setSubjectCode('');
            // setSubjectName('');
            // setAcademicYear('');
            // setSemester('');
            // setBranch('');
            // setSection('');
            // setCourseOutcomes([createDefaultOutcome()]);
            // setError(''); // Clear any previous errors

        } catch (err) {
            console.error("Submission failed:", err);
            let errorMessage = 'Submission failed. Please try again.'; // Default error

            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error Response Data:', err.response.data);
                console.error('Error Response Status:', err.response.status);
                // Use the error message from the backend if available
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
                if (err.response.data?.errors) {
                     errorMessage += ` Details: ${err.response.data.errors.join(', ')}`;
                }
            } else if (err.request) {
                // The request was made but no response was received
                console.error('Error Request:', err.request);
                errorMessage = 'No response received from the server. Is it running?';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error Message:', err.message);
                errorMessage = `An error occurred: ${err.message}`;
            }
            setError(errorMessage);
            setSuccessMessage(''); // Clear any previous success message
        } finally {
            setIsLoading(false); // Stop loading indicator regardless of success/failure
        }
    };

    // --- Tailwind Classes for Inputs/Labels ---
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const numberInputClass = `${inputClass} appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

    return (
        // Overall Form Container
        <form
            onSubmit={handleSubmit}
            className="max-w-7xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md border border-gray-200 space-y-6" // Added space-y for spacing sections
        >
            <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-6">
                Course Outcome - Program Outcome Mapping
            </h2>

            {/* Error and Success Messages */}
            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300" role="alert">
                    <span className="font-medium">Error!</span> {error}
                </div>
            )}
            {successMessage && (
                 <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300" role="alert">
                    <span className="font-medium">Success!</span> {successMessage}
                </div>
            )}

            {/* Course Details Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Course Details</h3>
                {/* Responsive Grid for Course Details */}
                <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label htmlFor="facultyId" className={labelClass}>Faculty ID:</label>
                        <input type="text" id="facultyId" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required className={inputClass} />
                    </div>
                     <div>
                        <label htmlFor="subjectCode" className={labelClass}>Subject Code:</label>
                        <input type="text" id="subjectCode" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} required className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="subjectName" className={labelClass}>Subject Name:</label>
                        <input type="text" id="subjectName" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="academicYear" className={labelClass}>Academic Year (YYYY-YYYY):</label>
                        <input type="text" id="academicYear" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required placeholder="e.g., 2023-2024" pattern="\d{4}-\d{4}" className={inputClass} />
                    </div>
                     <div>
                        <label htmlFor="semester" className={labelClass}>Semester:</label>
                        <input type="number" id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} required min="1" className={numberInputClass} />
                    </div>
                     <div>
                        <label htmlFor="branch" className={labelClass}>Branch:</label>
                        <input type="text" id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} required placeholder="e.g., CSE" className={inputClass} />
                    </div>
                     <div>
                        <label htmlFor="section" className={labelClass}>Section:</label>
                        <input type="text" id="section" value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} required placeholder="e.g., A" className={`${inputClass} uppercase`} />
                    </div>
                </div>
            </div>

            {/* CO Mappings Section */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium leading-6 text-gray-900">
                    CO Mappings <span className="text-sm font-normal text-gray-500">(0=No Correlation, 1=Low, 2=Medium, 3=High)</span>
                </h3>
                 {/* Table Container with Horizontal Scroll */}
                 <div className="overflow-x-auto border border-gray-200 rounded-md">
                     <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        {/* Table Header */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 z-10 border-r border-gray-300 w-[100px]"> {/* Sticky CO */}
                                    CO
                                </th>
                                {POS_Headers.map(po => (
                                     <th key={po} scope="col" className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[55px]">
                                        {po}
                                    </th>
                                ))}
                                {PSOS_Headers.map(pso => (
                                     <th key={pso} scope="col" className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-[55px]">
                                        {pso}
                                    </th>
                                ))}
                                <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-[90px]">
                                    Action
                                </th>
                            </tr>
                        </thead>
                         {/* Table Body */}
                         <tbody className="bg-white divide-y divide-gray-200">
                            {courseOutcomes.map((outcome, index) => (
                                <CourseOutcomeMappingRow
                                    key={index} // Consider using a more stable unique ID if available
                                    index={index}
                                    outcomeData={outcome}
                                    onChange={handleCourseOutcomeChange}
                                    onRemove={removeCourseOutcomeRow}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Add Row Button */}
                 <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={addCourseOutcomeRow}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                    >
                        + Add CO Row
                    </button>
                 </div>
            </div>

            {/* Form Actions (Submit Button) */}
            <div className="pt-5 border-t border-gray-200">
                 <div className="flex justify-end">
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                    >
                        Save Mapping
                    </button>
                </div>
            </div>
        </form>
    );
}

export default CoPoMappingForm;