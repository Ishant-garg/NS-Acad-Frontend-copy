import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, Filter, Eye, Loader2, Users, BookOpen, BarChart, TrendingUp, FileText, FileDown, 
  PieChart, LineChart, Trophy, GraduationCap, Award, Medal, ArrowUpRight, BarChart2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import api from '../../utils/api';
import { fetchUserData } from '../../utils/auth';
import { useToast } from "@/hooks/use-toast";
import { array } from '../../assets/GlobalArrays';

// Import chart components
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
  RadarController,
  PolarAreaController,
} from 'chart.js';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
  RadarController,
  PolarAreaController
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
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyPerformance, setFacultyPerformance] = useState([]);
  const [facultyRankings, setFacultyRankings] = useState([]);
  const [activityHeatmap, setActivityHeatmap] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats for dashboard
  const [stats, setStats] = useState({
    facultyCount: 0,
    documentsCount: 0,
    publicationsCount: 0,
    projectsCount: 0,
    patentsCount: 0,
    conferenceCount: 0,
    workshopsCount: 0,
    citationsCount: 0
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
      setFacultyData(data);
      setStats(prev => ({ ...prev, facultyCount: data.length || 0 }));
      return data;
    } catch (err) {
      console.error('Faculty data fetch error:', err);
      setError('Failed to fetch faculty data: ' + (err.message || 'Unknown error'));
      return [];
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

  // Generate faculty rankings based on various metrics
  const generateFacultyRankings = useCallback(() => {
    if (!facultyData || !filteredDocuments) return [];
    
    // Prepare faculty statistics
    const facultyStats = {};
    
    facultyData.forEach(faculty => {
      if (faculty && faculty._id) {
        facultyStats[faculty._id] = {
          id: faculty._id,
          name: faculty.fullname || 'Unknown',
          email: faculty.email || '',
          publications: 0,
          projects: 0,
          score: 0,
          documents: 0
        };
      }
    });
    
    // Calculate statistics from documents
    filteredDocuments.forEach(doc => {
      if (doc && doc.facultyId && facultyStats[doc.facultyId]) {
        facultyStats[doc.facultyId].documents += 1;
        
        // Update specific metrics
        if (doc.type) {
          if (doc.type.includes('publication')) {
            facultyStats[doc.facultyId].publications += 1;
            facultyStats[doc.facultyId].score += 3; // Publications weighted higher
          } else if (doc.type.includes('Projects')) {
            facultyStats[doc.facultyId].projects += 1;
            facultyStats[doc.facultyId].score += 2; // Projects weighted medium
          } else {
            facultyStats[doc.facultyId].score += 1; // Other documents weighted standard
          }
        }
      }
    });
    
    // Convert to array and sort by score
    const rankings = Object.values(facultyStats)
      .filter(item => item.score > 0) // Only include faculty with at least some activity
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 faculty
    
    setFacultyRankings(rankings);
    return rankings;
  }, [facultyData, filteredDocuments]);

  // Calculate monthly activity distribution for heatmap
  const calculateActivityHeatmap = useCallback(() => {
    if (!filteredDocuments || filteredDocuments.length === 0) return [];
    
    const activityByMonth = Array(12).fill(0);
    
    filteredDocuments.forEach(doc => {
      if (doc && doc.date) {
        const date = new Date(doc.date);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          activityByMonth[month] += 1;
        }
      }
    });
    
    setActivityHeatmap(activityByMonth);
    return activityByMonth;
  }, [filteredDocuments]);

  // Function to fetch documents data
  const fetchDocumentsData = useCallback(async (dept, yr) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/read/hod/dashboard/documents', {
        department: dept,
        year: yr !== 'overall' ? yr : undefined
      });
      
      if (response.data) {
        // If 'overall' is selected, show all documents
        // Otherwise filter client-side to ensure only documents for the selected year are shown
        const filteredResults = yr === 'overall' 
          ? response.data 
          : response.data.filter(doc => String(doc.year) === String(yr));
        
        setFilteredDocuments(filteredResults);
        
        // Count total entries (including all items in each document's data array)
        const totalEntries = filteredResults.reduce((sum, doc) => {
          return sum + (Array.isArray(doc.data) ? doc.data.length : 0);
        }, 0);
        
        // Calculate additional statistics
        const patentsCount = filteredResults.filter(doc => 
          doc.type && doc.type.includes('patent')).length;
        
        const conferenceCount = filteredResults.filter(doc => 
          doc.type && doc.type.includes('conference')).length;
        
        const workshopsCount = filteredResults.filter(doc => 
          doc.type && doc.type.includes('workshop')).length;
        
        const citationsCount = filteredResults.reduce((sum, doc) => {
          if (doc.type && doc.type.includes('publication') && doc.data) {
            // Try to extract citation count if available
            const citationsData = Array.isArray(doc.data) ? doc.data.find(item => 
              Array.isArray(item) && item.some(cell => 
                typeof cell === 'object' && Object.keys(cell)[0]?.toLowerCase().includes('citation')
              )
            ) : null;
            
            if (citationsData) {
              // Extract citation number
              const citationCell = citationsData.find(cell => 
                typeof cell === 'object' && Object.keys(cell)[0]?.toLowerCase().includes('citation')
              );
              if (citationCell) {
                const key = Object.keys(citationCell)[0];
                const value = parseInt(citationCell[key]);
                if (!isNaN(value)) {
                  return sum + value;
                }
              }
            }
          }
          return sum;
        }, 0);
        
        // Update stats based on filtered documents
        setStats(prevStats => ({
          ...prevStats,
          documentsCount: totalEntries,
          publicationsCount: filteredResults.filter(doc => 
            doc.type && doc.type.includes('publication')).length,
          projectsCount: filteredResults.filter(doc => 
            doc.type && doc.type.includes('Projects')).length,
          patentsCount,
          conferenceCount,
          workshopsCount,
          citationsCount
        }));
        
        // Generate additional metrics for enhanced dashboard
        generateFacultyRankings();
        calculateActivityHeatmap();
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again.');
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [generateFacultyRankings, calculateActivityHeatmap]);

  // Handle tab change
  const handleTabChange = useCallback((value) => {
    // Update active tab
    setActiveTab(value);
    
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
          label: 'Contributions',
          data: sortedContributions.map(item => item.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',  // Blue
            'rgba(16, 185, 129, 0.7)',  // Green
            'rgba(245, 158, 11, 0.7)',  // Amber
            'rgba(139, 92, 246, 0.7)',  // Purple
            'rgba(239, 68, 68, 0.7)',   // Red
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',    // Blue
            'rgba(16, 185, 129, 1)',    // Green
            'rgba(245, 158, 11, 1)',    // Amber
            'rgba(139, 92, 246, 1)',    // Purple
            'rgba(239, 68, 68, 1)',     // Red
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [filteredDocuments, facultyData]);

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

  // Get document type distribution data
  const getDocumentTypeData = useCallback(() => {
    if (!filteredDocuments || !filteredDocuments.length) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
        }]
      };
    }

    // Group documents by type
    const typeDistribution = {};
    filteredDocuments.forEach(doc => {
      if (doc && doc.type) {
        const typeTitle = getDocumentTypeTitle(doc.type);
        typeDistribution[typeTitle] = (typeDistribution[typeTitle] || 0) + 1;
      }
    });

    // Prepare data for chart
    const labels = Object.keys(typeDistribution);
    const data = Object.values(typeDistribution);

    // Color palettes
    const backgroundColors = [
      'rgba(59, 130, 246, 0.7)',   // Blue
      'rgba(16, 185, 129, 0.7)',   // Green
      'rgba(245, 158, 11, 0.7)',   // Amber
      'rgba(139, 92, 246, 0.7)',   // Purple
      'rgba(239, 68, 68, 0.7)',    // Red
      'rgba(6, 182, 212, 0.7)',    // Cyan
      'rgba(236, 72, 153, 0.7)',   // Pink
    ];

    const borderColors = [
      'rgba(59, 130, 246, 1)',    // Blue
      'rgba(16, 185, 129, 1)',    // Green
      'rgba(245, 158, 11, 1)',    // Amber
      'rgba(139, 92, 246, 1)',    // Purple
      'rgba(239, 68, 68, 1)',     // Red
      'rgba(6, 182, 212, 1)',     // Cyan
      'rgba(236, 72, 153, 1)',    // Pink
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: borderColors.slice(0, labels.length),
        borderWidth: 1,
      }]
    };
  }, [filteredDocuments, getDocumentTypeTitle]);

  // Get trend data for submissions over time
  const getSubmissionTrendData = useCallback(() => {
    if (!filteredDocuments || filteredDocuments.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Submissions',
          data: [],
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.4,
          fill: true,
        }]
      };
    }

    // Group documents by month/year
    const timelineData = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      timelineData[monthYear] = 0;
    }

    // Count submissions by month
    filteredDocuments.forEach(doc => {
      if (doc && doc.date) {
        const date = new Date(doc.date);
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          if (timelineData[monthYear] !== undefined) {
            timelineData[monthYear] += 1;
          }
        }
      }
    });

    return {
      labels: Object.keys(timelineData),
      datasets: [{
        label: 'Submissions',
        data: Object.values(timelineData),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      }]
    };
  }, [filteredDocuments]);

  // New function to get faculty performance radar chart data
  const getFacultyPerformanceData = useCallback(() => {
    if (!filteredDocuments || filteredDocuments.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Define performance categories
    const categories = [
      'Publications', 
      'Projects', 
      'Patents', 
      'Conferences', 
      'Workshops', 
      'Training'
    ];

    // Get top 3 faculty based on total contributions
    const facultyContributions = {};
    
    filteredDocuments.forEach(doc => {
      if (doc && doc.facultyId) {
        if (!facultyContributions[doc.facultyId]) {
          facultyContributions[doc.facultyId] = {
            publications: 0,
            projects: 0,
            patents: 0,
            conferences: 0,
            workshops: 0,
            training: 0,
            total: 0,
            name: ''
          };
          
          // Find faculty name
          const faculty = facultyData?.find(f => f && f._id === doc.facultyId);
          if (faculty) {
            facultyContributions[doc.facultyId].name = faculty.fullname || 'Unknown';
          }
        }
        
        // Increment counts based on document type
        if (doc.type) {
          if (doc.type.includes('publication')) {
            facultyContributions[doc.facultyId].publications += 1;
          } else if (doc.type.includes('Projects')) {
            facultyContributions[doc.facultyId].projects += 1;
          } else if (doc.type.includes('patent')) {
            facultyContributions[doc.facultyId].patents += 1;
          } else if (doc.type.includes('conference')) {
            facultyContributions[doc.facultyId].conferences += 1;
          } else if (doc.type.includes('workshop')) {
            facultyContributions[doc.facultyId].workshops += 1;
          } else if (doc.type.includes('training')) {
            facultyContributions[doc.facultyId].training += 1;
          }
          
          facultyContributions[doc.facultyId].total += 1;
        }
      }
    });
    
    // Convert to array and sort by total contributions
    const sortedFaculty = Object.values(facultyContributions)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    
    // Save performance data for use in other components
    setFacultyPerformance(sortedFaculty);
    
    // Create datasets for radar chart
    const datasets = sortedFaculty.map((faculty, index) => {
      const colors = [
        { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgba(59, 130, 246, 1)' },
        { bg: 'rgba(16, 185, 129, 0.5)', border: 'rgba(16, 185, 129, 1)' },
        { bg: 'rgba(245, 158, 11, 0.5)', border: 'rgba(245, 158, 11, 1)' }
      ];
      
      return {
        label: faculty.name,
        data: [
          faculty.publications,
          faculty.projects,
          faculty.patents,
          faculty.conferences,
          faculty.workshops,
          faculty.training
        ],
        backgroundColor: colors[index].bg,
        borderColor: colors[index].border,
        borderWidth: 2,
        pointBackgroundColor: colors[index].border,
        pointRadius: 4
      };
    });
    
    return {
      labels: categories,
      datasets
    };
  }, [filteredDocuments, facultyData]);

  // Function to view faculty details in modal
  const handleViewFacultyModal = useCallback((faculty) => {
    setSelectedFaculty(faculty);
    setShowFacultyModal(true);
  }, []);

  // Chart options for radar chart
  const radarChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Faculty Performance Comparison',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          display: false
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.2
      }
    }
  }), []);

  // Chart options for bar chart
  const barChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Top Faculty Contributors',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  }), []);

  const doughnutChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Document Types Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    cutout: '60%'
  }), []);

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Submission Trends',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  }), []);

  // Render top contributors chart - used directly in JSX
  const renderTopContributorsChart = () => {
    const chartData = getChartData();
    
    return (
      <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 border-b border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <BarChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Top Contributors</h3>
              <p className="text-blue-100">
                {selectedYear === 'overall' ? 'All Years' : academicYears.find(y => y.value === selectedYear)?.label || selectedYear}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : chartData.labels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
              <BarChart className="h-12 w-12 text-gray-300 mb-2" />
              <p>No data available for the selected period</p>
            </div>
          ) : (
            <div className="h-80">
              <Bar data={chartData} options={barChartOptions} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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

  // Render faculty performance comparison chart
  const renderFacultyPerformanceChart = useCallback(() => {
    const performanceData = getFacultyPerformanceData();
    
    return (
      <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 md:p-6 border-b border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <BarChart2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Performance Metrics</h3>
              <p className="text-purple-100">
                Faculty contribution comparison
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-4 h-80">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : performanceData.labels.length === 0 || performanceData.datasets.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
              <BarChart2 className="h-12 w-12 text-gray-300 mb-2" />
              <p>No performance data available for comparison</p>
            </div>
          ) : (
            <Radar data={performanceData} options={radarChartOptions} />
          )}
        </CardContent>
      </Card>
    );
  }, [loading, getFacultyPerformanceData, radarChartOptions]);

  // Render faculty rankings
  const renderFacultyRankings = useCallback(() => {
    return (
      <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 md:p-6 border-b border-amber-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Faculty Rankings</h3>
              <p className="text-amber-100">
                Top performing faculty members
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-16">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : facultyRankings.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No ranking data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {facultyRankings.map((faculty, index) => (
                <div key={faculty.id} className="border border-amber-100 rounded-lg p-3 bg-amber-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-amber-500' : 
                        index === 1 ? 'bg-stone-400' : 
                        index === 2 ? 'bg-amber-700' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-900">{faculty.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-amber-700">
                          <span>{faculty.publications} publications</span>
                          <span>•</span>
                          <span>{faculty.projects} projects</span>
                          <span>•</span>
                          <span>{faculty.documents} total documents</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        Score: {faculty.score}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        onClick={() => handleViewFacultyModal(faculty)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
                      <span>Performance Score</span>
                      <span>{Math.floor((faculty.score / (facultyRankings[0]?.score || 1)) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(faculty.score / (facultyRankings[0]?.score || 1)) * 100} 
                      className="h-2 bg-amber-100" 
                      indicatorClassName="bg-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [loading, facultyRankings, handleViewFacultyModal]);

  // Faculty detail modal component
  const renderFacultyDetailModal = useCallback(() => {
    if (!selectedFaculty) return null;
    
    // Get documents for selected faculty
    const facultyDocs = filteredDocuments?.filter(
      doc => doc && (doc.facultyId === selectedFaculty.id || doc.userID === selectedFaculty.id)
    ) || [];
    
    // Group documents by type
    const docsByType = {};
    facultyDocs.forEach(doc => {
      if (doc && doc.type) {
        const typeTitle = getDocumentTypeTitle(doc.type);
        if (!docsByType[typeTitle]) {
          docsByType[typeTitle] = [];
        }
        docsByType[typeTitle].push(doc);
      }
    });
    
    return (
      <Dialog open={showFacultyModal} onOpenChange={setShowFacultyModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Faculty Profile: {selectedFaculty.name}
            </DialogTitle>
            <DialogDescription className="text-blue-500">
              {selectedFaculty.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 border border-blue-100">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-blue-100 rounded-full mb-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {selectedFaculty.documents || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Documents</div>
                </CardContent>
              </Card>
              
              <Card className="bg-emerald-50 border border-emerald-100">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-emerald-100 rounded-full mb-2">
                    <BookOpen className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {selectedFaculty.publications || 0}
                  </div>
                  <div className="text-sm text-emerald-700">Publications</div>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 border border-amber-100">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-amber-100 rounded-full mb-2">
                    <TrendingUp className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {selectedFaculty.projects || 0}
                  </div>
                  <div className="text-sm text-amber-700">Projects</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Document listing by category */}
            <div className="space-y-6">
              {Object.keys(docsByType).length > 0 ? (
                Object.entries(docsByType).map(([type, docs]) => (
                  <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-medium text-gray-700">{type}</h3>
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                        {docs.length} {docs.length === 1 ? 'entry' : 'entries'}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        {docs.map((doc, index) => (
                          <div key={index} className="text-sm p-2 border border-gray-100 rounded bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="font-medium text-blue-700">
                                {doc.title || `Document #${index + 1}`}
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                {doc.year || 'N/A'}
                              </Badge>
                            </div>
                            <div className="mt-1 text-gray-600">
                              {Array.isArray(doc.data) && doc.data[0]?.description ? doc.data[0].description : 'No description available'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No documents found for this faculty</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }, [selectedFaculty, filteredDocuments, showFacultyModal, getDocumentTypeTitle]);

  // Effect to handle tab changes
  useEffect(() => {
    if (activeTab === 'overview' && filteredDocuments.length > 0) {
      // Update rankings and other metrics when switching to overview
      generateFacultyRankings();
      calculateActivityHeatmap();
    }
  }, [activeTab, filteredDocuments, generateFacultyRankings, calculateActivityHeatmap]);

  // Store error in a ref to avoid triggering re-renders when handling global errors
  const errorRef = useRef(null);
  
  // Add error boundary for entire component
  useEffect(() => {
    // Store the original error message for later reference
    errorRef.current = error;
    
    const handleError = (event) => {
      // Only update state if:
      // 1. We don't already have this error
      // 2. The error isn't related to too many renders
      if (event && event.message && 
          !event.message.includes("Too many re-renders") && 
          errorRef.current !== event.message) {
        console.error("Global error caught:", event);
        setError("An unexpected error occurred: " + (event.message || "Unknown error"));
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [error]);
  
  console.log("Dashboard rendering, activeTab:", activeTab);
  
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

        {/* Display any errors at the top level */}
        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
            <h3 className="font-medium">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="w-full overflow-hidden">
          <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Faculty</p>
                      <h3 className="text-2xl font-bold text-blue-900">{stats.facultyCount}</h3>
                      <p className="text-xs text-blue-500">Total registered faculty</p>
                    </div>
                    <div className="p-4 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border border-green-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-green-600 font-medium uppercase tracking-wider">Publications</p>
                      <h3 className="text-2xl font-bold text-green-900">{stats.publicationsCount}</h3>
                      <p className="text-xs text-green-500">Research papers published</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Documents</p>
                      <h3 className="text-2xl font-bold text-amber-900">{stats.documentsCount}</h3>
                      <p className="text-xs text-amber-500">Total submissions this year</p>
                    </div>
                    <div className="p-4 bg-amber-100 rounded-lg">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Projects</p>
                      <h3 className="text-2xl font-bold text-purple-900">{stats.projectsCount}</h3>
                      <p className="text-xs text-purple-500">Active research projects</p>
                    </div>
                    <div className="p-4 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Extended Stats Row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-cyan-50 to-white border border-cyan-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-cyan-600 font-medium uppercase tracking-wider">Patents</p>
                      <h3 className="text-2xl font-bold text-cyan-900">{stats.patentsCount}</h3>
                      <p className="text-xs text-cyan-500">Filed and approved patents</p>
                    </div>
                    <div className="p-4 bg-cyan-100 rounded-lg">
                      <Award className="w-6 h-6 text-cyan-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-50 to-white border border-pink-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-pink-600 font-medium uppercase tracking-wider">Conferences</p>
                      <h3 className="text-2xl font-bold text-pink-900">{stats.conferenceCount}</h3>
                      <p className="text-xs text-pink-500">Conference presentations</p>
                    </div>
                    <div className="p-4 bg-pink-100 rounded-lg">
                      <Users className="w-6 h-6 text-pink-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-yellow-600 font-medium uppercase tracking-wider">Workshops</p>
                      <h3 className="text-2xl font-bold text-yellow-900">{stats.workshopsCount}</h3>
                      <p className="text-xs text-yellow-500">Workshops conducted</p>
                    </div>
                    <div className="p-4 bg-yellow-100 rounded-lg">
                      <GraduationCap className="w-6 h-6 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-md transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Citations</p>
                      <h3 className="text-2xl font-bold text-indigo-900">{stats.citationsCount}</h3>
                      <p className="text-xs text-indigo-500">Total research citations</p>
                    </div>
                    <div className="p-4 bg-indigo-100 rounded-lg">
                      <ArrowUpRight className="w-6 h-6 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Contributors Bar Chart */}
                {renderTopContributorsChart()}

                {/* Document Types Doughnut Chart */}
                <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 md:p-6 border-b border-emerald-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <PieChart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Document Distribution</h3>
                        <p className="text-emerald-100">
                          By document type
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 h-80">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      </div>
                    ) : getDocumentTypeData().labels.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                        <PieChart className="h-12 w-12 text-gray-300 mb-2" />
                        <p>No document types available for the selected period</p>
                      </div>
                    ) : (
                      <Doughnut data={getDocumentTypeData()} options={doughnutChartOptions} />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* New Faculty Performance Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Performance Radar Chart */}
                {renderFacultyPerformanceChart()}
                
                {/* Faculty Rankings */}
                {renderFacultyRankings()}
              </div>

              {/* Submission Trends Chart */}
              <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 md:p-6 border-b border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <LineChart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Submission Trends</h3>
                      <p className="text-purple-100">
                        Monthly submission activity
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 h-80">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : getSubmissionTrendData().labels.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center h-full">
                      <LineChart className="h-12 w-12 text-gray-300 mb-2" />
                      <p>No submission trend data available</p>
                    </div>
                  ) : (
                    <Line data={getSubmissionTrendData()} options={lineChartOptions} />
                  )}
                </CardContent>
              </Card>

              {/* Department Activity Highlights */}
              <Card className="w-full bg-white shadow-md border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 md:p-6 border-b border-amber-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Department Highlights</h3>
                      <p className="text-amber-100">
                        Recent achievements and highlights
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-md">
                          <GraduationCap className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-900">Academic Achievement</h4>
                          <p className="text-xs text-amber-700 mt-1">
                            {stats.publicationsCount > 0 
                              ? `${stats.publicationsCount} research publications submitted by faculty`
                              : 'No recent publications'}
                          </p>
                          {stats.citationsCount > 0 && (
                            <p className="text-xs text-amber-700 mt-1">
                              Total of {stats.citationsCount} citations received by department
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-md">
                          <Trophy className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-900">Projects & Patents</h4>
                          <p className="text-xs text-emerald-700 mt-1">
                            {stats.projectsCount > 0 
                              ? `${stats.projectsCount} active research projects in progress`
                              : 'No active projects'}
                          </p>
                          {stats.patentsCount > 0 && (
                            <p className="text-xs text-emerald-700 mt-1">
                              {stats.patentsCount} patents filed or approved this year
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-md">
                          <Medal className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900">Top Faculty</h4>
                          <p className="text-xs text-blue-700 mt-1">
                            {getChartData().labels[0] 
                              ? `${getChartData().labels[0]} leads with ${getChartData().datasets[0].data[0]} contributions`
                              : 'No faculty contributions yet'}
                          </p>
                          {facultyRankings.length > 0 && (
                            <p className="text-xs text-blue-700 mt-1">
                              Top 3 faculty account for {facultyRankings.slice(0, 3).reduce((sum, f) => sum + f.documents, 0)} documents
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-md">
                          <ArrowUpRight className="w-5 h-5 text-purple-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-purple-900">Trending Activity</h4>
                          <p className="text-xs text-purple-700 mt-1">
                            {getSubmissionTrendData().datasets[0].data.some(val => val > 0)
                              ? `${getSubmissionTrendData().labels[getSubmissionTrendData().datasets[0].data.indexOf(Math.max(...getSubmissionTrendData().datasets[0].data))]} saw peak activity`
                              : 'No recent submission activity'}
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            {activityHeatmap.some(v => v > 0) 
                              ? `Most active month had ${Math.max(...activityHeatmap)} submissions` 
                              : 'No monthly activity data'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-pink-100 rounded-md">
                          <Users className="w-5 h-5 text-pink-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-pink-900">Conferences & Workshops</h4>
                          <p className="text-xs text-pink-700 mt-1">
                            {stats.conferenceCount > 0 
                              ? `${stats.conferenceCount} conference presentations by faculty`
                              : 'No recent conference presentations'}
                          </p>
                          {stats.workshopsCount > 0 && (
                            <p className="text-xs text-pink-700 mt-1">
                              {stats.workshopsCount} workshops conducted by department
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-cyan-100 rounded-md">
                          <BarChart2 className="w-5 h-5 text-cyan-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-cyan-900">Department Overview</h4>
                          <p className="text-xs text-cyan-700 mt-1">
                            {stats.facultyCount} faculty members with {stats.documentsCount} total contributions
                          </p>
                          <p className="text-xs text-cyan-700 mt-1">
                            {getDocumentTypeData().labels.length} different document categories
                          </p>
                          <p className="text-xs text-cyan-700 mt-1">
                            {facultyPerformance.length > 0 
                              ? `${facultyPerformance.length} faculty with diverse contributions`
                              : 'Faculty performance data not available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
      
      {/* Render faculty detail modal */}
      {renderFacultyDetailModal()}
    </div>
  );
}

export default Dashboard;