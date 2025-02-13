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
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from '../../../utils/auth';
import api from '../../../utils/api';
import PdfBadge from './PdfBadge';

const List = ({ currentPage, pageFields, fieldData: initialFieldData, flag }) => {
  const [fields, setFields] = useState([]);
  const [fieldData, setFieldData] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const user = getCurrentUser();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/read/${currentPage}`, { 
        userID: user?.id 
      });
      setFieldData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      console.error('Data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/save/delete/${currentPage}/${id}`, { 
        userID: user?.id 
      });
      await fetchData();
      setShowDeleteDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete record');
      console.error('Delete error:', err);
    }
  };

  useEffect(() => {
    if (flag) setFieldData(initialFieldData);
  }, [flag, initialFieldData]);

  useEffect(() => {
    setFields(pageFields);
    fetchData();
  }, [pageFields, currentPage]);

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

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
                  colSpan={fields?.length + 3}
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
                  {item.map((item1, index1) => (
                    Object.keys(item1)[0] !== 'fileUploaded' ? (
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
                    )
                  ))}
                  {user?.role === 'faculty' && (
                    <TableCell className="text-center">
                      <Dialog 
                        open={showDeleteDialog && deleteId === index} 
                        onOpenChange={(open) => !open && setShowDeleteDialog(false)}
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
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this record? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(index)}
                              className="ml-2"
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={fields?.length + 3}
                  className="h-32 text-center text-slate-500"
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