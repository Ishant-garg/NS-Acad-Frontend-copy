import { useEffect, useRef, useState } from 'react';
import { Plus, Loader2, Calendar } from 'lucide-react';
import { array } from '../assets/GlobalArrays';
import { getCurrentUser } from '../utils/auth';
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
} from "@/components/ui/alert-dialog";
import api from '../utils/api'
import Form from '../Components/Faculty/Performance/Form';
import List from '../Components/Faculty/Performance/List';
import PropTypes from 'prop-types';

const Home = ({ currentPage: PageID, changeCurrentPage }) => {
  const buttonRef = useRef(null);
  const buttonRef2 = useRef(null);
  const [pageData, setPageData] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [flag, setFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add state for tracking the currently selected view year
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  // Generate list of academic years (current year and previous 4 years)
  // Add an "All Years" option at the beginning
  const academicYears = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 6 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { value: year, label: `${year-1}-${year}` };
    })
  ];

  const user = getCurrentUser();
  const userID = user.id;

  useEffect(() => {
    setPageData(array.find(obj => PageID === obj.id));
  }, [PageID]);

  // Update this useEffect to use viewYear
  useEffect(() => {
    if (PageID) {
      getData(viewYear);
    }
  }, [PageID, viewYear]); // Now depends on viewYear too

  const submitFormData = async (data, fileID, selectedYear) => {
    buttonRef.current.click();
    
    const newObject = {
      "fileUploaded": fileID
    };
    data.push(newObject);
    try {
      console.log(`Saving data for year: ${selectedYear}`);
      await api.post(`/save/${PageID}`, { data, userID, year: selectedYear });
      
      // Set the viewYear to match the submitted year to show the new entry
      setViewYear(selectedYear);
      
      // getData will now use the updated viewYear
      getData(selectedYear);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Update getData to properly handle 'all' year option
  const getData = async (year = viewYear) => {
    try {
      setIsLoading(true);
      // Use the provided year or viewYear
      console.log(`Fetching data for PageID ${PageID}, userID ${userID}, year ${year}`);
      
      let response;
      
      // Special handling for 'all' years
      if (year === 'all') {
        console.log('Fetching ALL years data');
        // Make a specific API request for all years
        response = await api.post(`/read/${PageID}/all`, { 
          userID 
        });
      } else {
        // Normal request for a specific year
        response = await api.post(`/read/${PageID}`, { 
          userID,
          year
        });
      }
      
      console.log(`Data received for PageID ${PageID}:`, response.data);
      
      // Ensure fieldData is always an array
      if (Array.isArray(response.data)) {
        setFieldData(response.data);
        console.log(`Setting fieldData to array of length ${response.data.length}`);
      } else if (response.data) {
        // If data exists but is not an array, wrap it
        setFieldData([response.data]);
        console.log('Setting fieldData to array with single item');
      } else {
        // If no data or null, set empty array
        setFieldData([]);
        console.log('Setting fieldData to empty array');
      }
      
      setFlag(!flag);
    } catch (err) {
      console.error('Read error:', err);
      setFieldData([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = async (fileid) => {
    setIsLoading(true);
    if (fileid && fileid !== "") {
      await api.get(`/file/${fileid}`);
    }
    setIsLoading(false);
    buttonRef2.current.click();
  };

  // Handle year change
  const handleYearChange = (e) => {
    const selectedYear = e.target.value;
    // Convert to number only if it's not 'all'
    setViewYear(selectedYear === 'all' ? 'all' : parseInt(selectedYear));
  };

  return (
    <div className="flex-1 mt-[10vh] min-h-">
      {/* Enhanced Header Area */}
      <div className="h-20 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-8">
        <div className="flex items-center space-x-4 w-[90%]">
          <h1 className="text-xl font-bold text-slate-800 w-[80%]">
            {pageData.title || 'Dashboard'}
          </h1>
          {pageData.category && (
            <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
              {pageData.category}
            </span>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="inline-flex items-center gap-2 w-48 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium cursor-pointer">
              <Plus className="w-5 h-5" />
              Add New Entry
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-slate-900">
                Add New Entry
              </AlertDialogTitle>
              <AlertDialogDescription className="max-h-[70vh] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Form
                    pageFields={pageData.fields} 
                    submitFormData={submitFormData} 
                    cancel={cancel}
                    isLoading={isLoading}
                  />
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hidden" ref={buttonRef2} />
              <AlertDialogAction className="hidden" ref={buttonRef} />
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="p-8">
        {/* Improved Year selector */}
        <div className="mb-6 flex justify-end">
          <div className="w-64">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <label htmlFor="viewYear" className="text-sm font-medium text-gray-700">
                Academic Year
              </label>
            </div>
            <div className="relative">
              <select
                id="viewYear"
                value={viewYear}
                onChange={handleYearChange}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm cursor-pointer"
              >
                {academicYears.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">Total Entries</h3>
                <p className="text-3xl font-bold text-slate-900">{fieldData.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">Last Updated</h3>
                <p className="text-3xl font-bold text-slate-900">
                  {fieldData[0]?.timestamp ? new Date(fieldData[0].timestamp).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  {viewYear === 'all' ? 'All Years' : viewYear === new Date().getFullYear() ? 'Current Year' : 'Selected Year'}
                </h3>
                <p className="text-3xl font-bold text-slate-900">
                  {viewYear === 'all' ? 'All' : viewYear}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced List Component */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <List
            changeCurrentPage={changeCurrentPage}
            currentPage={PageID}
            pageFields={pageData.fields}
            fieldData={fieldData}
            flag={flag}
            selectedYear={viewYear}
          />
        </div>
      </div>
    </div>
  );
};

// Add prop validation
Home.propTypes = {
  currentPage: PropTypes.string.isRequired,
  changeCurrentPage: PropTypes.func.isRequired
};

export default Home;