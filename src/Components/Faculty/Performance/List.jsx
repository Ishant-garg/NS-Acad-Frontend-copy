import React, { useEffect, useState } from 'react';
import { FaFilePdf, FaTrash } from "react-icons/fa6";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { getCurrentUser } from '../../../utils/auth';
import api from '../../../utils/api';
import PdfBadge from './PdfBadge';
import { AlertCircle, Loader2 } from "lucide-react";
import { useParams } from 'react-router-dom';

const List = ({ pageFields, fieldData: initialFieldData, flag, selectedYear }) => {
  const params = useParams();
  const currentPage = params.currentPage || "c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566";
  const [fields, setFields] = useState([]);
  const [fieldData, setFieldData] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const user = getCurrentUser();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const yearToUse = selectedYear && selectedYear !== 'all' 
        ? selectedYear 
        : new Date().getFullYear();
        
      console.log(`Refreshing data after deletion: page ID: ${currentPage}, user ID: ${user?.id}, year: ${yearToUse}`);
      
      let requestData = {
        userID: user?.id
      };
      
      if (selectedYear !== 'all') {
        requestData.year = yearToUse;
      }
      
      const response = await api.post(`/read/${currentPage}`, requestData);
      
      if (response.data === null || response.data === undefined) {
        setFieldData([]);
      } else if (Array.isArray(response.data)) {
        setFieldData(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setFieldData([]);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setFieldData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const yearToUse = selectedYear && selectedYear !== 'all' 
        ? selectedYear 
        : new Date().getFullYear();
        
      console.log(`Deleting record with ID: ${id}, for page: ${currentPage}, user: ${user?.id}, year: ${yearToUse}`);
      
      await api.post(`/save/delete/${currentPage}/${id}`, { 
        userID: user?.id,
        year: yearToUse
      });
      
      await fetchData();
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    console.log('List component received data:', initialFieldData);
    if (Array.isArray(initialFieldData)) {
      setFieldData(initialFieldData);
      setIsLoading(false);
    } else if (initialFieldData) {
      setFieldData([initialFieldData]);
      setIsLoading(false);
    } else {
      setFieldData([]);
      setIsLoading(false);
    }
  }, [initialFieldData, flag]);

  useEffect(() => {
    setFields(pageFields);
  }, [pageFields]);

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  console.log('Rendering List component with data:', fieldData, 'Selected year:', selectedYear);

  const showYearColumn = selectedYear === 'all';

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="rounded-xl bg-white shadow-xl border border-slate-200">
        <Table>
          <TableCaption className="pb-6 text-slate-600 font-medium">
            Faculty Performance Records
            <div className="text-sm text-slate-400 mt-1">
              {user?.role === 'faculty' ? 'Your' : 'Department'} Records
            </div>
          </TableCaption>
          
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-950 to-slate-900">
              <TableHead className="text-center font-semibold text-slate-100">
                S.NO.
              </TableHead>
              {showYearColumn && (
                <TableHead className="text-center font-semibold text-slate-100">
                  Academic Year
                </TableHead>
              )}
              {fields?.map((item, index) => (
                <TableHead 
                  key={index}
                  className="text-center font-semibold text-slate-100"
                >
                  {item[0]}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold text-slate-100">
                Document
              </TableHead>
              {user?.role === 'faculty' && (
                <TableHead className="text-center font-semibold text-slate-100">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={showYearColumn ? fields?.length + 4 : fields?.length + 3}
                  className="h-32 text-center"
                >
                  <div className="animate-pulse flex justify-center">
                    Loading records...
                  </div>
                </TableCell>
              </TableRow>
            ) : fieldData?.length > 0 ? (
              fieldData.map((item, index) => (
                <TableRow 
                  key={index}
                  className="hover:bg-blue-50 transition-all duration-200"
                >
                  <TableCell className="text-center font-medium text-slate-700">
                    {index + 1}
                  </TableCell>
                  {showYearColumn && (
                    <TableCell className="text-center font-medium text-slate-700">
                      {Array.isArray(item) && item.find(obj => obj.yearAdded)?.yearAdded 
                        ? `${item.find(obj => obj.yearAdded).yearAdded - 1}-${item.find(obj => obj.yearAdded).yearAdded}` 
                        : '-'}
                    </TableCell>
                  )}
                  {Array.isArray(item) ? item.map((item1, index1) => {
                    if (Object.keys(item1)[0] === 'yearAdded') {
                      return null;
                    }
                    
                    return Object.keys(item1)[0] !== 'fileUploaded' ? (
                      <TableCell 
                        key={index1} 
                        className="text-center text-slate-600"
                      >
                        {Object.values(item1)}
                      </TableCell>
                    ) : (
                      <TableCell 
                        key={index1} 
                        className="text-center"
                      >
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-blue-100"
                            >
                              <FaFilePdf 
                                className="w-5 h-5 text-blue-600"
                              />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Document Preview</DialogTitle>
                              <DialogDescription>
                                <PdfBadge
                                  className="w-full h-[70vh]"
                                  title="PDF Preview"
                                />
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    );
                  }).filter(Boolean) : (
                    <TableCell colSpan={fields?.length + 1} className="text-center text-slate-500">
                      Invalid data format
                    </TableCell>
                  )}
                  {user?.role === 'faculty' && (
                    <TableCell className="text-center">
                      <Dialog 
                        open={showDeleteDialog && deleteId === index} 
                        onOpenChange={(open) => {
                          if (!open) {
                            setShowDeleteDialog(false);
                            setDeleteError(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="hover:bg-red-100 hover:text-red-600 rounded-full"
                            onClick={() => {
                              setDeleteId(index);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <FaTrash className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl shadow-2xl border-0">
                          <div className="bg-red-50 p-4 border-b border-red-100">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-semibold text-red-700 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Confirm Deletion
                              </DialogTitle>
                              <DialogDescription className="text-gray-600 mt-2">
                                Are you sure you want to delete this record? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                          </div>
                          {deleteError && (
                            <div className="bg-red-50 p-4 border-t border-red-100">
                              <div className="flex items-center text-red-600">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                <span className="text-sm font-medium">{deleteError}</span>
                              </div>
                            </div>
                          )}
                          <div className="p-6 bg-white">
                            <DialogFooter className="flex space-x-3 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDeleteDialog(false);
                                  setDeleteError(null);
                                }}
                                className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                                disabled={isDeleting}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(index)}
                                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </DialogFooter>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={showYearColumn ? fields?.length + 4 : fields?.length + 3} 
                  className="h-32 text-center text-slate-500 py-12"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default List;
