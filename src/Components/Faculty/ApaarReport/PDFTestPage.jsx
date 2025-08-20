// Test page for PDF generation
import React from 'react';
import ReportGeneratorButton from './ReportGeneratorButton';

const PDFTestPage = () => {
  // Sample test data matching the expected format
  const sampleReportData = [
    {
      pageID: 'c4e293e9-1f5c-4edd-a3e5-fa0dfc23e566',
      formData: [
        [
          { academic_year: '2023-24' },
          { text: 'Module 1: Orientation Towards Technical Education and Curriculum Aspects' },
          { createdAt: '2024-01-15T10:30:00Z' }
        ],
        [
          { academic_year: '2023-24' },
          { text: 'Module 2: Professional Ethics & Sustainability' },
          { createdAt: '2024-02-20T14:45:00Z' }
        ],
        [
          { academic_year: '2023-24' },
          { text: 'Module 3: Communication Skills, Modes & Knowledge Dissemination' },
          { createdAt: '2024-03-10T09:15:00Z' }
        ]
      ]
    },
    {
      pageID: '2544a712-bd7d-46ee-8ca8-12c51f8bed35',
      formData: [
        [
          { academic_year: '2023-24' },
          { text: 'Emerging technology in computing and communication' },
          { text: '1 Week' },
          { createdAt: '2024-01-25T11:00:00Z' }
        ],
        [
          { academic_year: '2023-24' },
          { text: 'Advance Pedagogy' },
          { text: '2 Weeks' },
          { createdAt: '2024-02-15T16:30:00Z' }
        ]
      ]
    },
    {
      pageID: '5c97fdc9-12a4-4551-af1c-b9962e962be3',
      formData: [
        [
          { academic_year: '2023-24' },
          { text: 'AI based privacy-aware resilient framework for IoT device classification and attacks detection for Indian Scenario' },
          { text: 'John Doe' },
          { text: 'MT2021001' },
          { text: '2023' },
          { createdAt: '2024-01-10T08:00:00Z' }
        ]
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">PDF Generation Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sample Data Preview</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Categories:</strong> {sampleReportData.length}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Total Submissions:</strong> {sampleReportData.reduce((sum, item) => sum + item.formData.length, 0)}
            </p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">Available Categories:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mandatory Teachers Training (SWAYAM)</li>
                <li>• Faculty Development Programs</li>
                <li>• M.Tech Project Supervision</li>
              </ul>
            </div>
          </div>
        </div>

        <ReportGeneratorButton 
          reportData={sampleReportData} 
          isLoading={false} 
        />
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Enhanced PDF Features</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>✓ University header with NSUT branding</p>
            <p>✓ Real faculty data from user profile</p>
            <p>✓ Part I - Personal Data with actual user information</p>
            <p>✓ Part II - Self Appraisal with complete academic tables</p>
            <p>✓ Proper handling of missing data ("Not Provided")</p>
            <p>✓ Complete table structures with empty rows for future entries</p>
            <p>✓ All standard academic categories included</p>
            <p>✓ Professional formatting matching university standards</p>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Included Academic Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
            <p>• Mandatory Teachers Training (SWAYAM)</p>
            <p>• Faculty Development Programs</p>
            <p>• M.Tech/B.Tech Project Supervision</p>
            <p>• PhD Scholar Supervision</p>
            <p>• MOOC Courses Completed</p>
            <p>• Industrial Training</p>
            <p>• Research Publications</p>
            <p>• Patents Published/Granted</p>
            <p>• Research Projects</p>
            <p>• MOOCs/e-content Developed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTestPage;
