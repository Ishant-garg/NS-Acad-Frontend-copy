import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { User, ArrowLeft } from 'lucide-react';
import api from '../../../utils/api';

const FacultyDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchFacultyDetails();
    }
  }, [userId]);

  const fetchFacultyDetails = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/read/faculty/details`, { userId });
      if (response.statusText !== "OK") {
        throw new Error('Failed to fetch faculty details');
      }
      console.log(response.data);
      setFacultyData(response.data);
    } catch (err) {
      setError('Failed to fetch faculty details');
      console.error('Faculty details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDataGrid = (dataArray) => {
    return dataArray.map((row, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {row.map((item, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="bg-blue-50 p-4 rounded-lg transition-all duration-200 hover:shadow-md"
          >
            <h3 className="text-blue-700 font-semibold mb-2">
              {item.heading}
            </h3>
            <p className="text-blue-900">
              {item.data || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    ));
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

          {facultyData && Array.isArray(facultyData) && (
            <div className="space-y-6">
              {renderDataGrid(facultyData)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyDetails;