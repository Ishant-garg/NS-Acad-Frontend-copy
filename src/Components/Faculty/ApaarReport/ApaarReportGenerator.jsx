import React, { memo, useEffect, useState } from 'react';
import ReportGeneratorButton from './ReportGeneratorButton';
import api from '../../../utils/api';
import { getCurrentUser } from '../../../utils/auth';

const ApaarReportGenerator = () => {
  console.log("it is rendering");
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/read/allData?userId=${user.id}`);
        setRawData(response.data);
      } catch (err) {
        setError("Failed to fetch report data. Please try again later.");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center p-6 bg-gray-100 rounded-lg">
        <p className="font-semibold text-gray-700">Please log in to generate a report.</p>
      </div>
    );
  }
  
  return (
    <div className="w-full p-8 mb-8 bg-white rounded-lg shadow-md flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Generate User Report</h2>
      
      {error && (
        <div className="my-4 w-full text-center p-3 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-gray-600 mb-6 text-center">
          Your report data is ready to be generated. Select a year and click the button below to download the report as a PDF.
      </p>

      <ReportGeneratorButton reportData={rawData} isLoading={loading} />
    </div>
  );
};

export default memo(ApaarReportGenerator);