import React, { useState, useEffect, useMemo } from "react"; // Import useMemo
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label"; // Import Label
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select"; // Import Select components
import { User, ArrowLeft, Eye, FileDown, Filter } from "lucide-react"; // Added Filter icon
import api from "../../utils/api";
import { array } from "../../assets/GlobalArrays";

const FacultyDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [facultyData, setFacultyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedYear, setSelectedYear] = useState("all"); // State for filter
    const [availableYears, setAvailableYears] = useState([]); // State for dropdown options

    // Effect to extract available years when data loads
    useEffect(() => {
        if (facultyData && facultyData.length > 0) {
            const years = new Set();
            facultyData.forEach((item) => {
                // Add top-level year
                if (item.year) {
                    years.add(item.year.toString());
                }
                // Add years from formData
                if (Array.isArray(item.formData)) {
                    item.formData.forEach((row) => {
                        if (Array.isArray(row)) {
                            row.forEach((cell) => {
                                if (
                                    typeof cell === "object" &&
                                    cell !== null &&
                                    Object.keys(cell)[0]?.split(",")[0] === "Academic Year"
                                ) {
                                    const yearValue = Object.values(cell)[0];
                                    if (yearValue) {
                                        years.add(yearValue.toString());
                                    }
                                }
                            });
                        }
                    });
                }
            });
            // Sort years descending
            const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
            setAvailableYears(sortedYears);
            setSelectedYear("all"); // Reset filter when data changes
        } else {
            setAvailableYears([]); // Clear years if no data
        }
    }, [facultyData]); // Rerun when facultyData changes

    useEffect(() => {
        console.log("UserId:", userId);
        if (userId) {
            fetchFacultyDetails();
        }
         // Reset state on component mount or userId change
         setFacultyData(null);
         setLoading(false);
         setError("");
         setSelectedYear("all");
         setAvailableYears([]);
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchFacultyDetails = async () => {
        setLoading(true);
        setError("");
        setFacultyData(null);
        try {
            const response = await api.post(`/read/faculty/details`, { userId });
            console.log("API Response:", response.data);
            const data = Array.isArray(response.data)
                ? response.data
                : response.data
                ? [response.data]
                : [];
            setFacultyData(data);
        } catch (err) {
            setError("Failed to fetch faculty details");
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Memoize file handlers to potentially prevent unnecessary re-renders if passed down
    const handleViewFile = useMemo(() => async (fileId) => {
        if (!fileId) {
            console.error("View Error: No fileId provided");
            return;
        }
        console.log("Viewing file:", fileId);
        try {
            const response = await api.get(`file/view/${String(fileId)}`);
            const { pdfData } = response.data;
            if (!pdfData) {
                console.error("View Error: No PDF data received for fileId:", fileId);
                setError(`Failed to load PDF data for file ${fileId}.`); // Show error to user
                return;
            }
            const byteCharacters = atob(pdfData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, "_blank");
        } catch (error) {
            console.error("Error viewing file:", error);
             setError(`Error viewing file ${fileId}: ${error.message || 'Unknown error'}`);
        }
    }, [setError]); // Dependency: setError if you want to update error state

    const handleDownloadFile = useMemo(() => async (fileId) => {
        if (!fileId) {
            console.error("Download Error: No fileId provided");
            return;
        }
        console.log("Downloading file:", fileId);
        try {
            const response = await api.get(`file/view/${String(fileId)}`);
            const { pdfData } = response.data;
            if (!pdfData) {
                console.error("Download Error: No PDF data received for fileId:", fileId);
                setError(`Failed to load PDF data for download (file ${fileId}).`); // Show error
                return;
            }
            const byteCharacters = atob(pdfData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const fileURL = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = fileURL;
            link.download = `document-${fileId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
        } catch (error) {
            console.error("Error downloading file:", error);
            setError(`Error downloading file ${fileId}: ${error.message || 'Unknown error'}`);
        }
    }, [setError]); // Dependency: setError

    const getPageTitle = (pageID) => {
        const pageInfo = array.find((page) => page.id === pageID);
        return pageInfo ? pageInfo.title : pageID;
    };

    // ----- Updated renderDataGrid -----
    const renderDataGrid = (dataArray, yearFilter) => { // Accept yearFilter
        if (!dataArray || dataArray.length === 0) {
            // Return null or a message if no initial data, the parent component handles the "No data" message
            return null;
        }

        const groupedByPageID = dataArray.reduce((acc, facultyItem) => {
            const { pageID, formData, year } = facultyItem;
            if (!pageID || !Array.isArray(formData)) {
                return acc;
            }
            if (!acc[pageID]) {
                acc[pageID] = { title: getPageTitle(pageID), entries: [] };
            }
            formData.forEach((row) => {
                if (Array.isArray(row)) {
                    acc[pageID].entries.push({ data: row, year: year });
                }
            });
            return acc;
        }, {});

        let hasVisibleData = false; // Flag to check if any table has data after filtering

        const renderedTables = Object.entries(groupedByPageID).map(
            ([pageID, pageData], pageIndex) => {
                const { title, entries } = pageData;
                 if (!entries || entries.length === 0) return null;

                // --- START: Logic derived from previous version to get rows and headers ---
                const allHeaders = new Set();
                let hasAcademicYearInData = false;
                let hasTopLevelYear = false;

                entries.forEach(({ data, year }) => {
                     if (year) hasTopLevelYear = true;
                    data.forEach((cell) => {
                         if (typeof cell === 'object' && cell !== null && Object.keys(cell).length > 0) {
                            const keyWithValueType = Object.keys(cell)[0];
                            const key = keyWithValueType.split(",")[0];
                            allHeaders.add(key);
                            if (key === "Academic Year") hasAcademicYearInData = true;
                         }
                    });
                });

                const headersList = Array.from(allHeaders);
                const needsAcademicYearColumn = hasTopLevelYear || hasAcademicYearInData;

                let orderedHeaders = [];
                if (needsAcademicYearColumn) {
                    orderedHeaders.push("Academic Year");
                    orderedHeaders.push(...headersList.filter(h => h !== "Academic Year"));
                } else {
                    orderedHeaders = headersList;
                }

                const displayHeaders = orderedHeaders.filter(h => h !== "fileUploaded");
                const hasFileUpload = orderedHeaders.includes("fileUploaded");
                if (hasFileUpload) {
                    displayHeaders.push("Attachment");
                }

                const rowsWithConsolidatedYear = entries.map(({ data, year }) => {
                    const rowMap = {};
                    if (needsAcademicYearColumn) {
                         // Prioritize year from cell data if available, otherwise use top-level year
                         const yearFromCell = data.find(cell => typeof cell === 'object' && cell !== null && Object.keys(cell)[0]?.split(',')[0] === 'Academic Year');
                         rowMap["Academic Year"] = yearFromCell ? Object.values(yearFromCell)[0]?.toString() : (year ? year.toString() : "");
                    }
                    data.forEach((cell) => {
                        if (typeof cell === 'object' && cell !== null && Object.keys(cell).length > 0) {
                            const [keyWithValueType, value] = Object.entries(cell)[0];
                            const key = keyWithValueType.split(",")[0];
                            // Don't overwrite "Academic Year" if already set from priority logic above
                            if (key !== "Academic Year" || !rowMap.hasOwnProperty("Academic Year")) {
                                rowMap[key] = value;
                            } else if(key === "Academic Year" && !rowMap["Academic Year"]) {
                                // If the priority logic didn't set a year, but it exists in the cell, use it.
                                rowMap["Academic Year"] = value?.toString() ?? "";
                            }
                        }
                    });
                    return rowMap;
                });
                // --- END: Logic derived ---

                // ***** FILTERING STEP *****
                const filteredRows = rowsWithConsolidatedYear.filter(rowMap => {
                    if (yearFilter === 'all') return true; // Show all if filter is 'all'
                    // Show row if its "Academic Year" matches the filter
                    return String(rowMap["Academic Year"] ?? '') === yearFilter;
                });
                // **************************

                if (filteredRows.length === 0) {
                    return null; // Don't render this table if no rows match the filter
                }

                hasVisibleData = true; // Mark that we found data to display

                return (
                    <div key={pageID + "-" + pageIndex} className="mb-8">
                        <h2 className="text-xl font-semibold mb-3 text-blue-700">{title}</h2>
                        <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50">
                                    <tr>
                                        {displayHeaders.map((header, idx) => (
                                            <th key={idx} scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider border-r last:border-r-0 border-gray-200">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRows.map((rowMap, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                                            {displayHeaders.map((header, cellIdx) => {
                                                let cellValue;
                                                let isFileColumn = false;
                                                if (header === "Attachment" && hasFileUpload) {
                                                    cellValue = rowMap["fileUploaded"];
                                                    isFileColumn = true;
                                                } else {
                                                    cellValue = rowMap[header];
                                                }
                                                return (
                                                    <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r last:border-r-0 border-gray-200">
                                                        {isFileColumn && cellValue ? (
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleViewFile(cellValue)} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-150" title="View PDF">
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button onClick={() => handleDownloadFile(cellValue)} className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-all duration-150" title="Download PDF">
                                                                    <FileDown size={16} />
                                                                </button>
                                                            </div>
                                                        ) : typeof cellValue === "object" && cellValue !== null ? (
                                                            JSON.stringify(cellValue)
                                                        ) : (
                                                            cellValue ?? ""
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
        );

        // Return the rendered tables or a message if filtering resulted in no data
        return hasVisibleData ? renderedTables : (
             <div className="text-center text-gray-500 py-10">
                No details found for the selected year ({yearFilter === 'all' ? 'All Years' : yearFilter}).
             </div>
        );
    };
    // ----- End Updated renderDataGrid -----


    return (
        <div className="flex-1 p-4 md:p-8 mt-[8vh] md:mt-[10vh] bg-gradient-to-b from-blue-50 to-blue-100 min-h-[92vh] md:min-h-[90vh]">
            <Card className="w-full bg-white shadow-xl border-blue-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 border-b border-blue-200">
                    <div className="flex items-center justify-between"> {/* Adjusted for spacing */}
                         <div className="flex items-center gap-3 md:gap-4"> {/* Group left items */}
                            <button onClick={() => navigate(-1)} className="p-2 bg-blue-500/20 rounded-lg md:rounded-xl hover:bg-blue-500/30 transition-colors" aria-label="Go back">
                                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </button>
                            <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg md:rounded-xl">
                                <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                                    Faculty Details
                                </h2>
                                <p className="text-blue-100 text-xs md:text-sm mt-1">
                                    User ID: {userId}
                                </p>
                            </div>
                        </div>
                         {/* Potential placeholder for other header actions if needed */}
                    </div>
                </div>

                {/* Content Area */}
                <CardContent className="p-4 md:p-6">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <span className="text-blue-600">Loading faculty details...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Error:</strong>
                            <span className="block sm:inline"> {error}</span>
                             <button onClick={() => setError("")} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error">
                                <span className="text-xl">×</span>
                            </button>
                        </div>
                    )}

                    {/* Data Display Area */}
                    {!loading && !error && facultyData && (
                        <>
                            {/* Filter Dropdown */}
                            {availableYears.length > 0 && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-4">
                                    <Filter className="w-5 h-5 text-gray-500" />
                                    <Label htmlFor="year-filter" className="font-medium text-gray-700">Filter by Academic Year:</Label>
                                    <Select
                                        value={selectedYear}
                                        onValueChange={setSelectedYear} // Update state on change
                                    >
                                        <SelectTrigger id="year-filter" className="w-[180px] bg-white">
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Years</SelectItem>
                                            {availableYears.map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Render Grid - Pass selectedYear */}
                            <div className="space-y-6">
                                {renderDataGrid(facultyData, selectedYear)}
                            </div>
                        </>
                    )}

                    {/* No Data State (after load, no error) */}
                    {!loading && !error && (!facultyData || facultyData.length === 0) && (
                        <div className="text-center text-gray-500 py-10">
                            No details found for this faculty member.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FacultyDetails;