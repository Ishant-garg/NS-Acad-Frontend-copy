import React, { useState, useMemo } from 'react';
import api from '../../../utils/api';

// Define the headers
const poHeaders = [
    'PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8',
    'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3', 'PSO4'
];

const CoPoMappingTable = () => {
    const [searchInputCode, setSearchInputCode] = useState('');
    const [searchedCode, setSearchedCode] = useState('');
    const [mappingData, setMappingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (event) => {
        event.preventDefault();
        if (!searchInputCode.trim()) {
            setError("Please enter a Subject Code to search.");
            setMappingData(null);
            setSearchedCode('');
            return;
        }

        setLoading(true);
        setError(null);
        setMappingData(null);
        setSearchedCode(searchInputCode.trim());

        try {
            const response = await api.get(`/read/co-po-mappings?subjectCode=${encodeURIComponent(searchInputCode.trim())}`);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                console.log(`Found ${response.data.length} mapping(s). Displaying the first one.`);
                setMappingData(response.data[0]);

                if (response.data.length > 1) {
                    console.warn(`Multiple mappings found for ${searchInputCode}. Showing the first mapping.`);
                }
            } else {
                console.log('No mappings found for subject code:', searchInputCode);
                setError(`No CO-PO mapping found for Subject Code: ${searchInputCode}`);
                setMappingData(null);
            }
        } catch (err) {
            console.error('Error fetching CO-PO mapping by subject code:', err);
            setMappingData(null);

            if (err.response) {
                if (err.response.status === 404) {
                    setError(`No CO-PO mapping found for Subject Code: ${searchInputCode}`);
                } else {
                    setError(`Failed to load mapping: ${err.response.data?.message || `Server error (${err.response.status})`}`);
                }
            } else if (err.request) {
                setError("Could not reach the server. Please ensure it's running.");
            } else {
                setError(`An error occurred: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const averages = useMemo(() => {
        const avgResult = {};
        const outcomes = mappingData?.courseOutcomes || [];

        if (outcomes.length === 0) {
            poHeaders.forEach(header => avgResult[header.toLowerCase()] = '0.0');
            return avgResult;
        }

        poHeaders.forEach(header => {
            const key = header.toLowerCase();
            let sum = 0;
            outcomes.forEach(outcome => {
                const value = outcome[key];
                if (typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 3) {
                    sum += value;
                }
            });
            avgResult[key] = outcomes.length > 0 ? (sum / outcomes.length).toFixed(1) : '0.0';
        });
        return avgResult;
    }, [mappingData?.courseOutcomes]);

    const renderTableContent = () => {
        if (loading) {
            return <tr><td colSpan={poHeaders.length + 1} className="p-4 text-center text-gray-500">Loading...</td></tr>;
        }
        if (error) {
            return <tr><td colSpan={poHeaders.length + 1} className="p-4 text-center text-red-500">{error}</td></tr>;
        }
        if (!mappingData) {
            if (searchedCode) {
                return <tr><td colSpan={poHeaders.length + 1} className="p-4 text-center text-gray-500">No CO-PO mapping data found for Subject Code: {searchedCode}.</td></tr>;
            }
            return <tr><td colSpan={poHeaders.length + 1} className="p-4 text-center text-gray-500">Enter a Subject Code above and click Search.</td></tr>;
        }

        const outcomesToRender = Array.isArray(mappingData.courseOutcomes) ? mappingData.courseOutcomes : [];

        if (outcomesToRender.length === 0) {
            return <tr><td colSpan={poHeaders.length + 1} className="p-4 text-center text-gray-500">Mapping found, but it contains no Course Outcomes.</td></tr>;
        }

        return (
            <>
                {outcomesToRender.map((outcome, index) => (
                    <tr key={outcome._id || outcome.coIdentifier || index} className="hover:bg-gray-50">
                        <td className="border p-2 font-medium text-gray-800">{outcome.coIdentifier}</td>
                        {poHeaders.map(header => {
                            const key = header.toLowerCase();
                            const value = outcome[key] ?? 0;
                            return (
                                <td key={`${outcome.coIdentifier}-${header}`} className="border p-2 text-center text-gray-700">
                                    {value}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                    <td className="border p-2 text-left text-gray-800">Avg PO Mapping</td>
                    {poHeaders.map(header => {
                        const key = header.toLowerCase();
                        return (
                            <td key={`avg-${header}`} className="border p-2 text-center text-gray-800">
                                {averages[key] ?? '-'}
                            </td>
                        );
                    })}
                </tr>
            </>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 my-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    View CO / PO & PSO Mapping by Subject Code
                </h2>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                    <div className="flex-grow w-full sm:w-auto">
                        <label htmlFor="subjectCodeSearch" className="sr-only">Subject Code</label>
                        <input
                            type="text"
                            id="subjectCodeSearch"
                            value={searchInputCode}
                            onChange={(e) => setSearchInputCode(e.target.value)}
                            placeholder="Enter Subject Code (e.g., CS301)"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {mappingData && (
                <div>
                    <h3 className="text-lg font-medium text-gray-700">
                        Mapping for: <span className="font-semibold text-gray-900">{mappingData.subjectName} ({mappingData.subjectCode})</span>
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                        Year: {mappingData.academicYear}, Sem: {mappingData.semester}, Branch: {mappingData.branch}, Section: {mappingData.section}, Faculty: {mappingData.facultyId}
                    </p>
                </div>
            )}

            <div className="overflow-x-auto shadow-sm rounded-md border">
                <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <th className="border p-2 text-left font-semibold text-gray-700 min-w-[150px] sticky left-0 bg-gray-100 z-20">Course Outcome</th>
                            {poHeaders.map(header => (
                                <th key={header} className="border p-2 text-center font-semibold text-gray-700 min-w-[50px]">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableContent()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CoPoMappingTable;
