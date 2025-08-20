// src/components/ReportGeneratorButton.js

import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchUserData } from '../../../utils/auth';

const ReportGeneratorButton = ({ reportData, isLoading }) => {
  // console.log("ReportGeneratorButton props:", { reportData, isLoading });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [userData, setUserData] = useState(null);

  // Fetch user data for faculty details
  useEffect(() => {
    const getUserData = async () => {
      try {
        const user = await fetchUserData();
        setUserData(user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    getUserData();
  }, []);

  const availableYears = useMemo(() => {
    if (!reportData) return [];
    const years = new Set();

    reportData.forEach(item => {
      // Check if item has a year property (from the data structure)
      if (item.year) {
        years.add(item.year);
      }

      // Also check formData for createdAt dates as fallback
      if (item.formData) {
        item.formData.forEach(submission => {
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

    // Convert years to academic year format (YYYY-YY) and sort newest first
    return Array.from(years)
      .sort((a, b) => b - a)
      .map(year => `${year}-${String(year + 1).slice(-2)}`);
  }, [reportData]);

  // Set default year to the most recent available year
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]); // First item is the most recent due to sorting
    }
  }, [availableYears, selectedYear]);

  // Convert academic year format back to numeric year for filtering
  const getNumericYear = (academicYear) => {
    if (!academicYear || academicYear === 'all') return null;
    return parseInt(academicYear.split('-')[0]);
  };

  // Filter and group data based on the selected academic year
  const filteredAndGroupedData = useMemo(() => {
    if (!reportData) return {};

    const targetYear = getNumericYear(selectedYear);
    if (!targetYear) return {};

    return reportData.reduce((acc, item) => {
      const { pageID } = item;

      // Only include items that match the selected year
      if (item.year !== targetYear) {
        return acc;
      }

      if (!acc[pageID]) {
        acc[pageID] = [];
      }

      if (item.formData && item.formData.length > 0) {
        // All submissions from this item are already from the correct year
        // since we filtered at the item level
        acc[pageID].push(...item.formData);
      }

      return acc;
    }, {});
  }, [reportData, selectedYear]);

  // Academic format PDF generation matching university template
  const addUniversityHeader = (doc, user, academicYear = '2024-25') => {
    const pageWidth = doc.internal.pageSize.width;

    // University header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    // Center align university name
    const universityText = 'NETAJI SUBHAS UNIVERSITY OF TECHNOLOGY';
    const universityWidth = doc.getTextWidth(universityText);
    doc.text(universityText, (pageWidth - universityWidth) / 2, 20);

    const addressText = 'DWARKA, SECTOR 3, DELHI – 110078';
    const addressWidth = doc.getTextWidth(addressText);
    doc.text(addressText, (pageWidth - addressWidth) / 2, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const reportTitle = 'FACULTY ANNUAL PERFORMANCE REPORT';
    const titleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, 45);

    // Report period and faculty details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fromDate = `From JULY 01, ${parseInt(academicYear.split('-')[0])}`;
    const toDate = `to JUNE 30, ${parseInt(academicYear.split('-')[0]) + 1}`;
    const periodText = `${fromDate} ${toDate} (Academic Year ${academicYear})`;
    doc.text(periodText, 20, 60);

    const facultyName = user?.fullname || 'Not Provided';
    const department = user?.department || 'Not Provided';
    const role = user?.role || 'Not Provided';

    doc.text(`Name: ${facultyName}`, 20, 75);
    doc.text(`Dept./School: ${department}`, 20, 85);
    doc.text(`Designation: ${role} _____________ Date of Appointment _______________`, 20, 95);

    return 110; // Return Y position after header
  };

  const addPersonalDataSection = (doc, startY, user) => {
    let currentY = startY;

    // PART I - PERSONAL DATA
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PART I – PERSONAL DATA', 20, currentY);
    currentY += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const personalData = [
      ['1.', 'Name of the Faculty', ':', user?.fullname || 'Not Provided'],
      ['2.', 'Designation', ':', user?.role || 'Not Provided'],
      ['3.', 'Date Of Birth', ':', 'Not Provided'],
      ['4.', 'Academic Qualifications:', '', 'Not Provided'],
      ['5.', 'Whether the officer belongs to Scheduled Caste / Scheduled Tribe', ':', 'Not Provided'],
      ['6.', 'Date of continuous appointment to the present grade', '', 'Date: Not Provided    Grade: Not Provided']
    ];

    personalData.forEach(([num, label, colon, value]) => {
      doc.text(num, 20, currentY);
      doc.text(label, 35, currentY);
      if (colon) doc.text(colon, 140, currentY);
      doc.text(value, 150, currentY);
      currentY += 12;
    });

    return currentY + 10;
  };

  const addSelfAppraisalSection = (doc, startY, user, academicYear) => {
    let currentY = startY;

    // PART II - SELF APPRAISAL
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PART II – SELF APPRAISAL', 20, currentY);
    currentY += 15;

    // Faculty basic info table
    const facultyInfoHeaders = [
      ['Name', user?.fullname || 'Not Provided'],
      ['Present position', user?.role || 'Not Provided'],
      ['Academic Year', academicYear === 'all' ? '2024-25' : academicYear],
      ['Teaching Process', '']
    ];

    autoTable(doc, {
      head: [],
      body: facultyInfoHeaders,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' }, 1: { cellWidth: 120 } },
      margin: { left: 20, right: 20 }
    });

    currentY = doc.lastAutoTable.finalY + 15;
    return currentY;
  };

  const addCategoryTable = (doc, startY, categoryTitle, headers, data, sectionNumber) => {
    let currentY = startY;

    // Skip categories with no data
    if (!data || data.length === 0) {
      return currentY;
    }

    // Check if we need a new page
    if (currentY > 220) {
      doc.addPage();
      currentY = 30;
    }

    // Add section title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionNumber}. ${categoryTitle}:`, 20, currentY);
    currentY += 10;

    // Create table with headers and data only (no empty rows)
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // S.No. column
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto'
    });

    return doc.lastAutoTable.finalY + 15;
  };

  const formatFieldName = (fieldName) => {
    // Convert camelCase or snake_case to proper title case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const getCategoryTitle = (pageId) => {
    // Enhanced category mapping based on academic format
    const categoryMap = {
      'c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566': 'Details of Mandatory Teachers Training (8 modules) successfully completed online through SWAYAM portal',
      '2544a712-bd7d-46ee-8ca8-12c51f8bed35': 'Details of FDPs recognised by AICTE / UGC / TEQIP / NITTTR /PMMMNMTT / IISc/ IIT /University/ Government/ DTE / Board of Technical Education/ CoA /IIA /SPA/ ITPI / NRCs / ARPIT research organization/ other institute of National Importance/ Design Studio attended',
      '5c97fdc9-12a4-4551-af1c-b9962e962be3': 'Details of M.Tech Project Supervision',
      '5f7b6f6d-fc1a-4086-85ff-adc1c3a4ffd7': 'Details of B.Tech Project Supervision',
      '08f9f04e-eb8e-4a10-9779-e2c93f10c8bd': 'Details of PhD students guided',
      // Add more academic categories
      'research-publications': 'Details of Research publications in SCI journals/UGC/AICTE approved list of journals',
      'patents': 'Details of patent published/granted',
      'research-projects': 'Details of Research Projects',
      'moocs': 'Details of MOOCs course completed with E-Certification by NPTEL-AICTE',
      'industrial-training': 'Detail of Industrial Training undertaken',
      'moocs-content': 'Details of MOOCs/e-content developed'
    };
    return categoryMap[pageId] || `Academic Activity Details`;
  };

  // Enhanced data validation and formatting
  const validateAndFormatData = (submissions) => {
    return submissions.filter(submission => {
      // Filter out incomplete or invalid submissions
      return submission && Array.isArray(submission) && submission.length > 0;
    }).map(submission => {
      // Ensure all fields have proper values
      return submission.map(field => {
        const [key, value] = Object.entries(field)[0];
        return {
          [key]: value !== undefined && value !== null ? String(value).trim() : '-'
        };
      });
    });
  };

  const handleGeneratePdf = () => {
    const dataToProcess = filteredAndGroupedData;
    const hasAnyData = Object.values(dataToProcess).some(submissions => submissions.length > 0);

    if (!hasAnyData) {
        alert(`No data available for the academic year ${selectedYear}.`);
        return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();

      // Add university header and personal data using real user data
      let currentY = addUniversityHeader(doc, userData, selectedYear);
      currentY = addPersonalDataSection(doc, currentY, userData);

      // Add new page for self appraisal
      doc.addPage();
      currentY = addSelfAppraisalSection(doc, 30, userData, selectedYear);

      let sectionNumber = 1;

      // Process each category according to academic format
      Object.entries(dataToProcess).forEach(([pageId, submissions]) => {
        if (submissions.length === 0) return;

        // Validate and format the data
        const validatedSubmissions = validateAndFormatData(submissions);
        if (validatedSubmissions.length === 0) return;

        // Get category title and prepare data
        const categoryTitle = getCategoryTitle(pageId);

        // Prepare headers and data based on category
        let headers, tableData;

        if (pageId === 'c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566') {
          // Mandatory Teachers Training
          headers = ['S. No.', 'Module No. and Name', 'Enclosure No.'];
          tableData = validatedSubmissions.map((submission, index) => {
            const moduleField = submission.find(field =>
              Object.keys(field)[0].toLowerCase().includes('module') ||
              Object.keys(field)[0].toLowerCase().includes('name') ||
              Object.keys(field)[0].toLowerCase().includes('text')
            );
            const moduleName = moduleField ? Object.values(moduleField)[0] || 'Not Provided' : 'Not Provided';
            return [index + 1, moduleName, ''];
          });
        } else if (pageId === '2544a712-bd7d-46ee-8ca8-12c51f8bed35') {
          // Faculty Development Programs
          headers = ['S. No.', 'Detail of FDP', 'Duration', 'Enclosure No.'];
          tableData = validatedSubmissions.map((submission, index) => {
            const detailField = submission.find(field =>
              Object.keys(field)[0].toLowerCase().includes('detail') ||
              Object.keys(field)[0].toLowerCase().includes('fdp') ||
              Object.keys(field)[0].toLowerCase().includes('text')
            );
            const durationField = submission.find(field =>
              Object.keys(field)[0].toLowerCase().includes('duration') ||
              Object.keys(field)[0].toLowerCase().includes('time')
            );

            const detail = detailField ? Object.values(detailField)[0] || 'Not Provided' : 'Not Provided';
            const duration = durationField ? Object.values(durationField)[0] || 'Not Provided' : 'Not Provided';

            return [index + 1, detail, duration, ''];
          });
        } else if (pageId === '5c97fdc9-12a4-4551-af1c-b9962e962be3' || pageId === '5f7b6f6d-fc1a-4086-85ff-adc1c3a4ffd7') {
          // Project Supervision (M.Tech/B.Tech)
          headers = ['S. No.', 'Title', 'Students Name', 'Roll No.', 'Year', 'Enclosure No.'];
          tableData = validatedSubmissions.map((submission, index) => {
            const titleField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('title'));
            const nameField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('name'));
            const rollField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('roll'));
            const yearField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('year'));

            return [
              index + 1,
              titleField ? Object.values(titleField)[0] || 'Not Provided' : 'Not Provided',
              nameField ? Object.values(nameField)[0] || 'Not Provided' : 'Not Provided',
              rollField ? Object.values(rollField)[0] || 'Not Provided' : 'Not Provided',
              yearField ? Object.values(yearField)[0] || 'Not Provided' : 'Not Provided',
              ''
            ];
          });
        } else if (pageId === '08f9f04e-eb8e-4a10-9779-e2c93f10c8bd') {
          // PhD Scholar Supervision
          headers = ['S. No.', 'PhD student detail', 'Supervisor/Co-supervisor detail', 'Whether thesis submitted or awarded', 'Date of award', 'Enclosure No.'];
          tableData = validatedSubmissions.map((submission, index) => {
            const nameField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('name'));
            const titleField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('title'));
            const statusField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('status'));
            const dateField = submission.find(field => Object.keys(field)[0].toLowerCase().includes('date'));

            const studentDetail = nameField ? Object.values(nameField)[0] || 'Not Provided' : 'Not Provided';
            const thesisTitle = titleField ? Object.values(titleField)[0] || '' : '';
            const fullDetail = thesisTitle ? `${studentDetail} - ${thesisTitle}` : studentDetail;

            return [
              index + 1,
              fullDetail,
              'Not Provided',
              statusField ? Object.values(statusField)[0] || 'Not Provided' : 'Not Provided',
              dateField ? Object.values(dateField)[0] || 'Not Provided' : 'Not Provided',
              ''
            ];
          });
        } else {
          // Generic format for other categories
          const allHeaders = Array.from(new Set(
            validatedSubmissions.flatMap(record =>
              record.map(field => Object.keys(field)[0])
            )
          )).filter(header => header !== 'createdAt').sort();

          headers = ['S. No.', ...allHeaders.map(header => formatFieldName(header)), 'Enclosure No.'];
          tableData = validatedSubmissions.map((submission, index) => {
            const row = [index + 1];
            allHeaders.forEach(header => {
              const field = submission.find(f => Object.keys(f)[0] === header);
              row.push(field ? Object.values(field)[0] || 'Not Provided' : 'Not Provided');
            });
            row.push(''); // Enclosure No.
            return row;
          });
        }

        currentY = addCategoryTable(doc, currentY, categoryTitle, headers, tableData, sectionNumber);
        sectionNumber++;
      });

      // Save the PDF with academic format naming
      const fileName = `Faculty_Annual_Performance_Report_${selectedYear}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const hasData = reportData && reportData.length > 0;

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!hasData) return null;

    const totalCategories = Object.keys(filteredAndGroupedData).length;
    const totalSubmissions = Object.values(filteredAndGroupedData).reduce((sum, submissions) => sum + submissions.length, 0);
    const categoriesWithData = Object.values(filteredAndGroupedData).filter(submissions => submissions.length > 0).length;

    return {
      totalCategories,
      totalSubmissions,
      categoriesWithData
    };
  }, [filteredAndGroupedData, hasData]);

  return (
    <div className="space-y-6">
      {/* Report Summary Card */}
      {hasData && summaryStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Report Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{summaryStats.totalSubmissions}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-green-600">{summaryStats.categoriesWithData}</div>
              <div className="text-sm text-gray-600">Categories with Data</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="text-2xl font-bold text-purple-600">{summaryStats.totalCategories}</div>
              <div className="text-sm text-gray-600">Total Categories</div>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Controls */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Faculty Appraisal Report
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Create a comprehensive PDF report of faculty performance data
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-grow w-full sm:w-auto">
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Report Period
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!hasData || isLoading || isGenerating}
                className="w-full sm:w-64 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                {availableYears.length === 0 ? (
                  <option value="">No data available</option>
                ) : (
                  availableYears.map(year => (
                    <option key={year} value={year}>Academic Year {year}</option>
                  ))
                )}
              </select>
              {selectedYear && availableYears.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing data for academic year {selectedYear}
                </p>
              )}
            </div>

            <button
              onClick={handleGeneratePdf}
              disabled={!hasData || isLoading || isGenerating}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading Data...
                </>
              ) : isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Report
                </>
              )}
            </button>
          </div>

          {!hasData && !isLoading && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800 text-sm">No data available for report generation.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGeneratorButton;