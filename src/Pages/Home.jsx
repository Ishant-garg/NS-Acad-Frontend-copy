import { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Plus, Loader2, Calendar, ClipboardList, AlertCircle } from 'lucide-react';

// Local Imports
import { array as PageConfigArray } from '../assets/GlobalArrays';
import { getCurrentUser } from '../utils/auth';
import api from '../utils/api';

// UI Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/Components/ui/alert-dialog";
import Form from '../Components/Faculty/Performance/Form';
import List from '../Components/Faculty/Performance/List';

// --- Constants ---
const ALL_YEARS_VALUE = 'all';
const ACADEMIC_YEAR_RANGE = 6; // Display last 6 years + "All"

/**
 * The main component for displaying and managing performance data entries.
 * Fully responsive for mobile, tablet, and desktop devices.
 */
const Home = ({ currentPage: PageID, changeCurrentPage }) => {
  // --- Refs ---
  const alertDialogActionRef = useRef(null);
  const alertDialogCancelRef = useRef(null);

  // --- State ---
  const [pageData, setPageData] = useState({});
  const [fieldData, setFieldData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // --- Derived State & Data ---
  const user = getCurrentUser();
  const userID = user.id;

  const academicYears = useMemo(() => [
    { value: ALL_YEARS_VALUE, label: 'All Years' },
    ...Array.from({ length: ACADEMIC_YEAR_RANGE }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { value: year, label: `AY ${year - 1}-${year}` };
    })
  ], []);

  // --- Effects ---
  useEffect(() => {
    const currentPageData = PageConfigArray.find(obj => PageID === obj.id);
    setPageData(currentPageData || {});
  }, [PageID]);

  useEffect(() => {
    if (PageID && userID) {
      getData(viewYear);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PageID, viewYear, userID]);

  // --- Data Fetching & Submission ---
  const getData = async (year = viewYear) => {
    setIsLoading(true);
    try {
      const endpoint = year === ALL_YEARS_VALUE ? `/read/${PageID}/all` : `/read/${PageID}`;
      const payload = { userID };
      if (year !== ALL_YEARS_VALUE) {
        payload.year = year;
      }
      const response = await api.post(endpoint, payload);
      setFieldData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setFieldData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitFormData = async (data, fileID, selectedYear) => {
    alertDialogActionRef.current?.click();
    const payload = {
      data: [...data, { "fileUploaded": fileID }],
      userID,
      year: selectedYear,
    };
    try {
      console.log("Submitting form data:", payload.data);
      await api.post(`/save/${PageID}`, payload);
      if (viewYear !== selectedYear) {
        setViewYear(selectedYear);
      } else {
        getData(selectedYear);
      }
    } catch (err) {
      console.error('Error saving form data:', err);
    }
  };

  const cancelForm = async (fileid) => {
    setIsLoading(true);
    if (fileid) {
      try {
        await api.get(`/file/${fileid}`);
      } catch (err) {
        console.error('Error handling file on cancel:', err);
      }
    }
    alertDialogCancelRef.current?.click();
    setIsLoading(false);
  };
  
  // --- Event Handlers ---
  const handleYearChange = (e) => {
    const selectedValue = e.target.value;
    setViewYear(selectedValue === ALL_YEARS_VALUE ? ALL_YEARS_VALUE : parseInt(selectedValue));
  };
  
  // --- Render ---
  return (
    <div className="flex-1 mt-[10vh] bg-slate-50 min-h-[90vh]">
      
      {/* Page Header - Responsive */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-[10vh] z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:h-20">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {pageData.title || 'Loading...'}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Year Selector */}
              <div className="relative flex-grow sm:flex-grow-0">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <select
                  id="viewYear"
                  value={viewYear}
                  onChange={handleYearChange}
                  className="w-full sm:w-48 appearance-none rounded-md border border-slate-300 bg-white py-2 pl-10 pr-8 text-slate-700 font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm cursor-pointer transition-colors"
                  aria-label="Select Academic Year"
                >
                  {academicYears.map((yearOpt) => (
                    <option key={yearOpt.value} value={yearOpt.value}>
                      {yearOpt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Entry Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">ADD</span>
                    <span className="sm:hidden">ADD</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95vw] rounded-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-slate-900">
                      Add New {pageData.title} Entry
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="text-base text-slate-600 max-h-[70vh] overflow-y-auto pr-2">
                        <Form
                          pageFields={pageData.fields} 
                          submitFormData={submitFormData} 
                          cancel={cancelForm}
                          isLoading={isLoading}
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="pt-4">
                    <AlertDialogCancel className="hidden" ref={alertDialogCancelRef} />
                    <AlertDialogAction className="hidden" ref={alertDialogActionRef} />
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <main className="p-4 sm:p-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Entries" value={fieldData.length} icon={ClipboardList} color="blue" isLoading={isLoading} />
          <StatCard title="Last Updated" value={fieldData[0]?.timestamp ? new Date(fieldData[0].timestamp).toLocaleDateString() : 'N/A'} icon={Calendar} color="green" isLoading={isLoading} />
          <StatCard title="Viewing Year" value={academicYears.find(y => y.value === viewYear)?.label || viewYear} icon={Calendar} color="purple" isLoading={isLoading} />
        </section>

        {/* Entries List */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">
              {pageData.title} Records
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Showing records for {academicYears.find(y => y.value === viewYear)?.label || viewYear}.
            </p>
          </div>
          <div className="min-h-[400px]">
            {isLoading ? (
              <LoadingState />
            ) : fieldData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <List
                  changeCurrentPage={changeCurrentPage}
                  currentPage={PageID}
                  pageFields={pageData.fields}
                  fieldData={fieldData}
                  selectedYear={viewYear}
                />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

// --- Sub-components for better readability ---

const StatCard = ({ title, value, icon: Icon, color, isLoading }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };
  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : value}
          </div>
        </div>
        <div className={`p-3 rounded-full ${classes.bg}`}>
          <Icon className={`w-6 h-6 ${classes.text}`} />
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 p-4">
    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    <p className="mt-4 text-lg font-medium">Loading Entries...</p>
    <p>Please wait a moment.</p>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-slate-500 p-8">
    <AlertCircle className="w-16 h-16 text-slate-400 mb-4" />
    <h3 className="text-xl font-semibold text-slate-800">No Entries Found</h3>
    <p className="mt-2 max-w-sm">
      There are no records for the selected academic year. You can add one using the button above.
    </p>
  </div>
);


// --- Prop Validation ---
Home.propTypes = {
  currentPage: PropTypes.string.isRequired,
  changeCurrentPage: PropTypes.func.isRequired,
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
};

export default Home;
