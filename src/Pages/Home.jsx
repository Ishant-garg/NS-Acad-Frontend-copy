import React, { useEffect, useRef, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import List from '../Components/List';
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
import Form from '../Components/Form';
import api from '../utils/api'
import axios from 'axios';

const Home = ({ currentPage: PageID, changeCurrentPage }) => {
  const buttonRef = useRef(null);
  const buttonRef2 = useRef(null);
  const [pageData, setPageData] = useState("");
  const [fieldData, setFieldData] = useState([]);
  const [flag, setFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const user = getCurrentUser();
  const userID = user.id;

  useEffect(() => {
    setPageData(array.find(obj => PageID === obj.id));
  }, [PageID]);

  const submitFormData = async (data, fileID) => {
    buttonRef.current.click();
    
    const newObject = {
      "fileUploaded": fileID
    };
    data.push(newObject);
    try {
      await api.post(`/save/${PageID}`, { data, userID });
      getData();
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const getData = async () => {
    try {
      const response = await api.post(`/read/${PageID}`, { userID });
      setFieldData(response.data);
      setFlag(!flag);
    } catch (err) {
      console.error('Read error:', err);
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

  return (
    <div className="flex-1 mt-[10vh] min-h-">
      {/* Enhanced Header Area */}
      <div className="h-20 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-8">
        <div className="flex items-center space-x-4 w-[90%] ">
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
            <div className="inline-flex items-center gap-2 w-48 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium">
              <Plus className="w-5 h-5" />
              Add New Entry
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-slate-900">
                Add New Entry
              </AlertDialogTitle>
              <AlertDialogDescription>
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
                <h3 className="text-sm font-medium text-slate-600 mb-1">Category</h3>
                <p className="text-3xl font-bold text-slate-900">{pageData.category || '-'}</p>
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
          />
        </div>
      </div>
    </div>
  );
};

export default Home;