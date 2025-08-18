// src/components/ReportGeneratorButton.js

import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportGeneratorButton = ({ reportData, isLoading }) => {
  // console.log("ReportGeneratorButton props:", { reportData, isLoading });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');

  const availableYears = useMemo(() => {
    if (!reportData) return [];
    const years = new Set();
    reportData.forEach(item => {
      if (item.formData) {
        item.formData.forEach(submission => {
          // *** ASSUMPTION: Your date field is named 'createdAt' ***
          // Find the field object that contains the createdAt key.
          const dateField = submission.find(field => Object.keys(field)[0] === 'createdAt');
          if (dateField && dateField.createdAt) {
            try {
              const year = new Date(dateField.createdAt).getFullYear();
              if (!isNaN(year)) {
                 years.add(year);
              }
            } catch (e) {
              console.error("Could not parse date:", dateField.createdAt);
            }
          }
        });
      }
    });
    // Return a sorted array of unique years, newest first
    return Array.from(years).sort((a, b) => b - a);
  }, [reportData]);

  // This powerful memo hook filters AND groups the data based on the selected year.
  // It only recalculates when the raw data or the selected year changes.
  const filteredAndGroupedData = useMemo(() => {
    if (!reportData) return {};

    return reportData.reduce((acc, item) => {
      const { pageID } = item;
      if (!acc[pageID]) {
        acc[pageID] = [];
      }

      if (item.formData && item.formData.length > 0) {
        // Filter submissions by the selected year before adding them
        const filteredSubmissions = item.formData.filter(submission => {
          if (selectedYear === 'all') {
            return true; // Include all if 'all' is selected
          }
          const dateField = submission.find(field => Object.keys(field)[0] === 'createdAt');
          if (dateField && dateField.createdAt) {
            try {
              return new Date(dateField.createdAt).getFullYear() === parseInt(selectedYear, 10);
            } catch(e) {
              return false;
            }
          }
          return false; // Exclude if no date field is found
        });
        
        if (filteredSubmissions.length > 0) {
          acc[pageID].push(...filteredSubmissions);
        }
      }
      return acc;
    }, {});
  }, [reportData, selectedYear]);

  const handleGeneratePdf = () => {
    const dataToProcess = filteredAndGroupedData;
    if (Object.keys(dataToProcess).every(key => dataToProcess[key].length === 0)) {
        alert(`No data available for the year ${selectedYear}.`);
        return;
    }

    setIsGenerating(true);

    const doc = new jsPDF();
    const reportTitle = `User Submission Report (${selectedYear === 'all' ? 'All Years' : selectedYear})`;
    let finalY = 15;

    doc.setFontSize(20);
    doc.text(reportTitle, 14, finalY);
    finalY += 15;

    Object.entries(dataToProcess).forEach(([pageId, submissions]) => {
      if (submissions.length === 0) return; // Skip pages with no data for the selected year

      // (The rest of the PDF generation logic is identical to before)
      if (finalY > 250) {
          doc.addPage();
          finalY = 15;
      }

      doc.setFontSize(14);
      doc.text(`Report for Page ID:`, 14, finalY);
      finalY += 7;
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      doc.text(pageId, 14, finalY);
      doc.setFont('helvetica', 'normal');
      finalY += 5;

      const headers = Array.from(new Set(submissions.flatMap(record => record.map(field => Object.keys(field)[0])))).sort();
      const rowsAsObjects = submissions.map(record => record.reduce((acc, field) => { const [key, value] = Object.entries(field)[0]; acc[key] = value; return acc; }, {}));
      const tableBody = rowsAsObjects.map(row => headers.map(header => row[header] || '-'));

      autoTable(doc, {
        head: [headers],
        body: tableBody,
        startY: finalY + 5,
        theme: 'striped',
        headStyles: { fillColor: [15, 35, 75] },
      });
      finalY = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`user-report-${selectedYear}.pdf`);
    setIsGenerating(false);
  };
  
  const hasData = reportData && reportData.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white shadow-md rounded-lg border border-gray-200">
      <div className='flex-grow'>
        <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Report Year
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          disabled={!hasData || isLoading || isGenerating}
          className="w-full sm:w-48 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="all">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleGeneratePdf}
        disabled={!hasData || isLoading || isGenerating}
        className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed self-end"
      >
        {isLoading ? 'Loading Data...' : isGenerating ? 'Generating PDF...' : 'Download Report'}
      </button>
    </div>
  );
};

export default ReportGeneratorButton;