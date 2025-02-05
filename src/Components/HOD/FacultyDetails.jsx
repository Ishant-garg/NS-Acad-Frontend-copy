import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { User, ArrowLeft, Eye, FileDown } from "lucide-react";
import api from "../../utils/api";
import { array } from "../../assets/GlobalArrays";

const FacultyDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("UserId:", userId);
    if (userId) {
      fetchFacultyDetails();
    }
  }, [userId]);

  const fetchFacultyDetails = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/read/faculty/details`, { userId });
      console.log("API Response:", response.data);
      setFacultyData(response.data);
    } catch (err) {
      setError("Failed to fetch faculty details");
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleViewFile = async (fileId) => {
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

      // Create and open URL
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank");

      // Clean up
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Error viewing file:", error);
    }
  };

  const handleDownloadFile = async (fileId) => {
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
    }
  };

  const getPageTitle = (pageID) => {
    const pageInfo = array.find((page) => page.id === pageID);
    return pageInfo ? pageInfo.title : pageID;
  };
  const renderDataGrid = (dataArray) => {
    // Group data by pageID
    const groupedByPageID = dataArray.reduce((acc, facultyItem) => {
      const { pageID, formData } = facultyItem;
      if (!acc[pageID]) {
        acc[pageID] = [];
      }
      acc[pageID].push(...formData);
      return acc;
    }, {});

    return Object.entries(groupedByPageID).map(
      ([pageID, formDataArray], pageIndex) => {
        // Get headers from the first row
        const headers = formDataArray[0].reduce((acc, item) => {
          return [...acc, ...Object.keys(item).map((key) => key.split(",")[0])];
        }, []);

        return (
          <div key={pageIndex} className="mb-8">
            <h2 className="text-lg font-semibold mb-2">
              {" "}
              {getPageTitle(pageID)}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    {headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="border text-blue-600 border-gray-300 px-4 py-2 bg-blue-50"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                 
                <tbody>
                  {formDataArray.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => {
                        const [key, value] = Object.entries(cell)[0];
                        return (
                          <td
                            key={cellIdx}
                            className="border border-gray-300 px-4 py-2"
                          >
                            {key === "fileUploaded" ? (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleViewFile(value)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="View PDF"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFile(value)}
                                    className="p-1 text-green-600 hover:text-green-800"
                                    title="Download PDF"
                                  >
                                    <FileDown size={16} />
                                  </button>
                                </div>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    );
  };

  return (
    <div className="flex-1 p-8 mt-[10vh] bg-gradient-to-b from-blue-50 to-blue-100 min-h-[90vh]">
      <Card className="w-full bg-white shadow-xl border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 border-b border-blue-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Faculty Details
              </h2>
              {facultyData?.department && (
                <p className="text-blue-100 text-sm mt-1">
                  {facultyData.department}
                </p>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {loading && (
            <div className="text-center text-blue-600 py-4">
              Loading faculty details...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">
              {error}
            </div>
          )}

          {/* {facultyData ? (
            Array.isArray(facultyData) ? (
              <div className="space-y-6">{renderDataGrid(facultyData)}</div>
            ) : (
              <div className="space-y-6">{renderDataGrid(facultyData)}</div>
            )
          ) : (
            !loading &&
            !error && (
              <div className="text-blue-600">No faculty data available.</div>
            )
          )} */}
          {loading ? (
            <div className="text-center text-blue-600 py-4">
              Loading faculty details...
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">
              {error}
            </div>
          ) : facultyData ? (
            <>
              <div className="space-y-6">{renderDataGrid(facultyData)}</div>
            </>
          ) : (
            <div className="text-blue-600">No faculty data available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyDetails;
