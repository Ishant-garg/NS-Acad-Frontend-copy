// src/pages/Testing.js

import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import ReportGeneratorButton from '../Components/Faculty/ApaarReport/ReportGeneratorButton';


const Testing = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
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
  }, []);

  // No more useMemo or PDF generation logic here!

  if (!user) {
    return <div className="text-center p-10">Please log in to generate a report.</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Generate User Report</h1>
        
        {error && <div className="my-4 text-center p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}

        <p className="text-gray-600 mb-6 max-w-2xl text-center">
            Your report data is ready to be generated. Select a year and click the button below to download the report as a PDF.
        </p>

        {/* --- Render the reusable button component --- */}
        <ReportGeneratorButton reportData={rawData} isLoading={loading} />

      </div>
    </div>
  );
};

export default Testing;