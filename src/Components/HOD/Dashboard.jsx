import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Filter, Eye, Loader2, Users, BookOpen, BarChart, TrendingUp, FileText, FileDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from '../../utils/api';
import { fetchUserData } from '../../utils/auth';
import { useToast } from "@/hooks/use-toast";
import { array } from '../../assets/GlobalArrays';

// Import chart components
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  // State for data
  const [facultyData, setFacultyData] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('overall');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stats for dashboard
  const [stats, setStats] = useState({
    facultyCount: 0,
    documentsCount: 0,
    publicationsCount: 0,
    projectsCount: 0
  });

  // Using useMemo to calculate current year
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Calculate academic years for dropdown
  const academicYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Add 'overall' option
    years.push({ value: 'overall', label: 'All Years' });
    
    // Add last 5 academic years
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push({
        value: `${startYear}`,
        label: `${startYear}-${endYear}`
      });
    }
    
    return years;
  }, []);

  // New function to fetch faculty data
  const fetchFacultyData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await fetchUserData();
      if (!userData || !userData.department) {
        throw new Error('User data not available');
      }
      
      setDepartment(userData.department);
      
      const response = await api.post('/read/faculty/list', {
        department: userData.department
      });
      
      if (!response || !response.data) {
        throw new Error('Failed to fetch faculty data');
      }
      const data = response.data || [];
      console.log("Fetched Faculty Data:", data);
      setFacultyData(data);
      setStats(prev => ({ ...prev, facultyCount: data.length || 0 }));
      return data;
    } catch (err) {
      setError('Failed to fetch faculty data');
      console.error('Faculty data fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch documents data
  const fetchDocumentsData = useCallback(async (dept, yr) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching documents for ${dept} and year ${yr}`);
      const response = await api.post('/read/hod/dashboard/documents', {
        department: dept,
        year: yr !== 'overall' ? yr : undefined
      });
      
      if (response.data) {
        console.log('Documents data:', response.data);
        
        // If 'overall' is selected, show all documents
        // Otherwise filter client-side to ensure only documents for the selected year are shown
        const filteredResults = yr === 'overall' 
          ? response.data 
          : response.data.filter(doc => String(doc.year) === String(yr));
        
        console.log('Filtered documents by year:', filteredResults);
        setFilteredDocuments(filteredResults);
        
        // Count total entries (including all items in each document's data array)
        const totalEntries = filteredResults.reduce((sum, doc) => {
          return sum + (Array.isArray(doc.data) ? doc.data.length : 0);
        }, 0);
        
        // Update stats based on filtered documents
        setStats(prevStats => ({
          ...prevStats,
          documentsCount: totalEntries,
          publicationsCount: filteredResults.filter(doc => 
            doc.type && doc.type.includes('publication')).length,
          projectsCount: filteredResults.filter(doc => 
            doc.type && doc.type.includes('Projects')).length
        }));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again.');
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter faculty data based on search query
  const filteredFacultyData = useMemo(() => {
    if (!facultyData || !Array.isArray(facultyData)) return [];
    
    if (!searchQuery) return facultyData;
    console.log("fff " , facultyData);
    const query = searchQuery.toLowerCase();
    return facultyData.filter(faculty => {
      return (
        (faculty.fullname && faculty.fullname.toLowerCase().includes(query)) ||
        (faculty.email && faculty.email.toLowerCase().includes(query)) ||
        (faculty.username && faculty.username.toLowerCase().includes(query))
      );
    });
  }, [facultyData, searchQuery]);

  // Handle tab change
  const handleTabChange = useCallback((value) => {
    // If changing to documents tab and we have department data, fetch documents
    if (value === 'documents' && department) {
      console.log("Switching to documents tab - fetching documents");
      // Force refresh data when switching to documents tab
      fetchDocumentsData(department, selectedYear);
    }
  }, [department, selectedYear, fetchDocumentsData]);

  // Effect to fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const facultyList = await fetchFacultyData();
        if (facultyList && facultyList.length > 0) {
          // Initial fetch of documents
          await fetchDocumentsData(department, 'overall');
        }
      } catch (error) {
        console.error('Error in initial data fetch:', error);
      }
    };
    
    fetchInitialData();
  }, [fetchFacultyData, fetchDocumentsData, department]);

  // Handle year change
  const handleYearChange = useCallback((e) => {
    const selectedValue = e.target.value;
    console.log("Selected year:", selectedValue);
    setSelectedYear(selectedValue);
    
    if (department) {
      fetchDocumentsData(department, selectedValue);
    }
  }, [fetchDocumentsData, department]);

  // Prepare chart data for faculty contributions
  const getChartData = useCallback(() => {
    // Get top 5 faculty with most documents
    const facultyContributions = {};
    
    // Add null check for filteredDocuments
    if (!filteredDocuments || !filteredDocuments.length) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Publications',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      };
    }
    
    filteredDocuments.forEach(doc => {
      if (doc && doc.facultyId) {
        facultyContributions[doc.facultyId] = (facultyContributions[doc.facultyId] || 0) + 1;
      }
    });
    
    // Convert to array and sort
    const sortedContributions = Object.entries(facultyContributions)
      .map(([facultyId, count]) => {
        const faculty = facultyData?.find(f => f && f._id === facultyId);
        return {
          name: faculty ? faculty.fullname : 'Unknown',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      labels: sortedContributions.map(item => item.name),
      datasets: [
        {
          label: 'Publications',
          data: sortedContributions.map(item => item.count),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredDocuments, facultyData]);

  // Chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Top Faculty Contributors',
      },
    },
  }), []);

  // Render top contributors chart
  const renderTopContributorsChart = useCallback(() => {
    const chartData = getChartData();
    
    return (
      <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 border-b border-blue-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Top Contributors</h3>
                <p className="text-blue-100">
                  Academic Year: {selectedYear === 'overall' ? 'All Years' : academicYears.find(y => y.value === selectedYear)?.label || selectedYear}
                </p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          {chartData.labels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No data available for the selected period</p>
            </div>
          ) : (
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [selectedYear, getChartData, academicYears, chartOptions]);

  // Year select dropdown component
  const renderYearFilterDropdown = useCallback(() => {
    return (
      <div className="flex flex-col gap-1 pt-5">
        <label htmlFor="year-select" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500  " />
          Academic Year
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={handleYearChange}
          className="h-10 rounded-md border border-blue-300 bg-blue-100 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="overall">Overall (All Years)</option>
          {academicYears.map((year) => (
            <option key={year.value} value={year.value}>
              {year.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          July {parseInt(selectedYear || currentYear, 10) - 1} - June {selectedYear || currentYear}
        </p>
      </div>
    );
  }, [academicYears, selectedYear, handleYearChange, currentYear]);

  // Add file viewing function
  const handleViewFile = useCallback(async (fileId) => {
    try {
      const response = await api.get(`file/view/${fileId}`);
      const { pdfData } = response.data;

      // Create a Blob from the base64 PDF data
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create a URL for the blob
      const fileURL = URL.createObjectURL(blob);

      // Open in a new tab
      window.open(fileURL, "_blank");

      // Clean up
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Error viewing file:", error);
      toast({
        title: "Error",
        description: "Could not load the file. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Add file downloading function
  const handleDownloadFile = useCallback(async (fileId) => {
    try {
      const response = await api.get(`file/view/${fileId}`);
      const { pdfData } = response.data;

      // Create a Blob from the base64 PDF data
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create download link
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `document-${fileId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Helper function to get document type title
  const getDocumentTypeTitle = useCallback((typeId) => {
    // Try to find the document type in the array
    const docType = array.find(item => item.id === typeId);
    
    if (docType && docType.title) {
      return docType.title;
    }
    
    // If typeId contains category names like 'publication' or 'Projects', use a readable name
    if (typeId.includes('publication')) {
      return 'Publication';
    } else if (typeId.includes('Projects')) {
      return 'Projects';
    } else if (typeId.includes('ExtraCurricular')) {
      return 'Extra Curricular Activities';
    } else if (typeId.includes('Self Appraisel')) {
      return 'Self Appraisal';
    }
    
    // Fallback
    return typeId.replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  }, []);

  // Documents tab content
  const renderDocumentsTab = useCallback(() => {
    // Group documents by their type
    const groupedByType = {};
    filteredDocuments.forEach(doc => {
      if (!groupedByType[doc.type]) {
        groupedByType[doc.type] = [];
      }
      groupedByType[doc.type].push(doc);
    });

    return (
      <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 border-b border-blue-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Department Documents</h3>
                <p className="text-blue-100">
                  Academic Year: {selectedYear === 'overall' ? 'All Years' : academicYears.find(y => y.value === selectedYear)?.label || selectedYear}
                </p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-600">Loading documents...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              <p>{error}</p>
              <button 
                onClick={() => fetchDocumentsData(department, selectedYear)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800">
                  {stats.documentsCount} {stats.documentsCount === 1 ? 'Document' : 'Documents'} Found
                </h4>
                <p className="text-sm text-gray-500">Showing all documents submitted by faculty members</p>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-lg font-medium">No documents found for the selected period</p>
                  <p className="text-sm mt-1">Try changing the academic year filter or check back later</p>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 350px)' }}>
                  <ScrollArea className="h-full pr-4">
                    {Object.entries(groupedByType).map(([typeId, docs]) => {
                      const typeTitle = getDocumentTypeTitle(typeId);
                      
                      // Calculate total entries for this document type
                      const docEntries = docs.reduce((sum, doc) => {
                        return sum + (Array.isArray(doc.data) ? doc.data.length : 0);
                      }, 0);
                      
                      return (
                        <div key={typeId} className="mb-8 pb-6 border-b border-gray-200 last:border-b-0">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                            <div>
                              <h3 className="text-lg font-semibold text-blue-700">{typeTitle}</h3>
                            </div>
                            <div className="text-sm bg-blue-100 px-3 py-1 rounded-full text-blue-800">
                              {docEntries} submissions
                            </div>
                          </div>

                          {/* Create a unified table format for this document type */}
                          {docs.length > 0 && docs.some(doc => Array.isArray(doc.data) && doc.data.length > 0) && (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50">
                                  <tr>
                                    {/* Add Author column */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                      Author
                                    </th>
                                    {/* Add Year column */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                      Year
                                    </th>
                                    
                                    {/* Extract headers based on the first document with data */}
                                    {(() => {
                                      // Find first document with valid data
                                      const firstDocWithData = docs.find(doc => 
                                        Array.isArray(doc.data) && doc.data.length > 0 && Array.isArray(doc.data[0])
                                      );
                                      
                                      if (!firstDocWithData) return null;
                                      
                                      // Get headers from the first row's data
                                      return firstDocWithData.data[0].map((item, idx) => {
                                        if (!item || typeof item !== 'object') return null;
                                        
                                        const headerKey = Object.keys(item)[0];
                                        if (!headerKey) return null;
                                        
                                        const header = headerKey.split(',')[0];
                                        return (
                                          <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                                            {header === "fileUploaded" ? "Document" : header}
                                          </th>
                                        );
                                      });
                                    })()}
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {docs.flatMap((doc, docIndex) => {
                                    if (!Array.isArray(doc.data)) return null;
                                    
                                    return doc.data.map((row, rowIdx) => {
                                      if (!Array.isArray(row)) return null;
                                      
                                      return (
                                        <tr key={`${docIndex}-${rowIdx}`} className="hover:bg-gray-50">
                                          {/* Author cell */}
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                                            {doc.facultyName || "Unknown"}
                                          </td>
                                          {/* Year cell */}
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {doc.year || "N/A"}
                                          </td>
                                          
                                          {/* Document data cells */}
                                          {row.map((cell, cellIdx) => {
                                            if (!cell || typeof cell !== 'object') return null;
                                            
                                            const key = Object.keys(cell)[0];
                                            if (!key) return null;
                                            
                                            const value = cell[key];
                                            
                                            return (
                                              <td key={cellIdx} className="px-4 py-3 whitespace-nowrap text-sm">
                                                {key === "fileUploaded" ? (
                                                  <div className="flex items-center space-x-2">
                                                    <button
                                                      onClick={() => handleViewFile(value)}
                                                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                                      title="View PDF"
                                                    >
                                                      <Eye size={14} className="mr-1" />
                                                      <span>View</span>
                                                    </button>
                                                    <button
                                                      onClick={() => handleDownloadFile(value)}
                                                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                                      title="Download PDF"
                                                    >
                                                      <FileDown size={14} className="mr-1" />
                                                      <span>Download</span>
                                                    </button>
                                                  </div>
                                                ) : typeof value === "object" ? (
                                                  JSON.stringify(value)
                                                ) : (
                                                  value
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    });
                                  }).filter(Boolean)}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [selectedYear, filteredDocuments, loading, error, stats.documentsCount, department, academicYears, fetchDocumentsData, handleViewFile, handleDownloadFile, getDocumentTypeTitle]);

  // Handle view faculty details
  const handleViewFacultyDetails = useCallback((faculty) => {
    console.log(`Navigating to faculty details for: ${faculty.username}`);
    navigate(`/faculty/${faculty._id}`);
  }, [navigate]);

  return (
   
    <div className="flex-1 mt-12 px-20 bg-gradient-to-b from-blue-50 to-blue-100 min-h-[90vh] overflow-hidden max-w-full overflow-x-hidden">
      {/* Fixed top strip */}
      <div className="fixed top-0 left-0 right-0 z-10 w-full h-16 bg-white shadow-md"></div>

      {/* Page Header */}
      <div className="p-2 md:p-8">
        <div className="bg-white shadow-sm rounded-xl p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Department Dashboard</h1>
            <p className="text-gray-500">Monitor faculty performance and department statistics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {renderYearFilterDropdown()}
            
            <div className="flex flex-col gap-1">
              <label htmlFor="search-input" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-500" />
                Search
              </label>
              <Input
                id="search-input"
                placeholder="Search faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="w-full overflow-hidden">
          <Tabs defaultValue="overview" className="w-full" onChange={handleTabChange}>
            <TabsList className="mb-6 bg-white border border-blue-200 rounded-lg p-1 w-full flex overflow-hidden">
              <TabsTrigger 
                value="overview" 
                className="text-sm md:text-base flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="faculty" 
                className="text-sm md:text-base flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Faculty List
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="text-sm md:text-base flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="w-full overflow-hidden">
              <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 border-b border-blue-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <BarChart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">Statistics</h2>
                        <p className="text-blue-100 text-sm mt-1">Academic Year: {selectedYear === 'overall' ? 'All Years' : academicYears.find(y => y.value === selectedYear)?.label}</p>
                      </div>
                    </div>

                  </div>
                </div>

                <CardContent className="p-4 md:p-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm transition-transform hover:scale-105">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Total Faculty</p>
                          <h3 className="text-2xl font-bold text-blue-900">{stats.facultyCount}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-white border border-green-100 shadow-sm transition-transform hover:scale-105">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 font-medium">Research Papers</p>
                          <h3 className="text-2xl font-bold text-green-900">{stats.publicationsCount}</h3>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-sm transition-transform hover:scale-105">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-amber-600 font-medium">Documents</p>
                          <h3 className="text-2xl font-bold text-amber-900">{stats.documentsCount}</h3>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-lg">
                          <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm transition-transform hover:scale-105">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-600 font-medium">Active Projects</p>
                          <h3 className="text-2xl font-bold text-purple-900">{stats.projectsCount}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Top Contributors Chart */}
                  {renderTopContributorsChart()}
                  
                  {loading && (
                    <div className="text-center text-blue-600 py-4">
                      Loading data...
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Faculty Tab */}
            <TabsContent value="faculty" className="w-full overflow-hidden">
              <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 border-b border-blue-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">Faculty List</h2>
                        <p className="text-blue-100 text-sm mt-1">Department: {department}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-blue-100">
                      <Filter className="w-4 h-4" />
                      <span>{filteredFacultyData?.length || 0} Faculty Members</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4 md:p-6">
                  {loading && (
                    <div className="text-center text-blue-600 py-4">
                      Loading faculty data...
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">
                      {error}
                    </div>
                  )}

                  {filteredFacultyData?.length > 0 && (
                    <ScrollArea className="w-full overflow-auto rounded-md border border-blue-200">
                      <Table>
                        <TableHeader className="sticky top-0 bg-blue-50">
                          <TableRow>
                            <TableHead className="text-blue-700 font-semibold">Full Name</TableHead>
                            <TableHead className="text-blue-700 font-semibold">Email</TableHead>
                            <TableHead className="text-blue-700 font-semibold">Username</TableHead>
                            <TableHead className="text-blue-700 font-semibold">Publications</TableHead>
                            <TableHead className="text-blue-700 font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFacultyData.map((faculty, index) => {
                            // Count documents for this faculty in the selected period
                            const facultyDocs = filteredDocuments?.filter(
                              doc => doc && (doc.facultyId === faculty._id || doc.userID === faculty._id)
                            )?.length || 0;
                            
                            return (
                              <TableRow
                                key={index}
                                className="hover:bg-blue-50 transition-colors"
                              >
                                <TableCell className="text-blue-900">{faculty.fullname || '-'}</TableCell>
                                <TableCell className="text-blue-900">{faculty.email || '-'}</TableCell>
                                <TableCell className="text-blue-900">{faculty.username || '-'}</TableCell>
                                <TableCell className="text-blue-900 font-medium">
                                  {facultyDocs}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => handleViewFacultyDetails(faculty)}
                                  >
                                    View Profile
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}

                  {!loading && (!filteredFacultyData || filteredFacultyData.length === 0) && (
                    <div className="text-center text-gray-500 py-4">
                      No faculty data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Documents Tab */}
            <TabsContent value="documents" className="w-full overflow-hidden">
              {renderDocumentsTab()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
   
  );
}

export default Dashboard; 
