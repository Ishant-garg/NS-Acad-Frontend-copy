import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Copo = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [examType, setExamType] = useState('');
  const [copoData, setCopoData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample class and batch data (replace with API fetch)
  const classes = ['CSE 1', 'CSE 2', 'CSAI 1', 'CSAI 2'];
  const batches = ['2020-24', '2021-25', '2022-26', '2023-27'];

  const addCopo = () => {
    setCopoData([...copoData, {
      id: Date.now(),
      studentCount: 0,
      marks: []
    }]);
  };

  const removeCopo = (id) => {
    setCopoData(copoData.filter(copo => copo.id !== id));
  };

  const updateStudentCount = (id, count) => {
    setCopoData(copoData.map(copo => {
      if (copo.id === id) {
        return {
          ...copo,
          studentCount: count,
          marks: Array(parseInt(count) || 0).fill(0)
        };
      }
      return copo;
    }));
  };

  const updateMark = (copoId, index, value) => {
    setCopoData(copoData.map(copo => {
      if (copo.id === copoId) {
        const newMarks = [...copo.marks];
        newMarks[index] = parseFloat(value) || 0;
        return { ...copo, marks: newMarks };
      }
      return copo;
    }));
  };

  const calculateTotal = (marks) => {
    return marks.reduce((sum, mark) => sum + mark, 0);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Add your API call here
      console.log({
        class: selectedClass,
        batch: selectedBatch,
        examType,
        copoData
      });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">COPO Assessment</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600">Class</h3>
                <p className="text-lg font-bold text-slate-900">{selectedClass || '-'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600">Batch</h3>
                <p className="text-lg font-bold text-slate-900">{selectedBatch || '-'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600">Exam</h3>
                <p className="text-lg font-bold text-slate-900">
                  {examType ? (examType === 'mid' ? 'Mid Sem' : 'End Sem') : '-'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600">Students</h3>
                <p className="text-lg font-bold text-slate-900">
                  {copoData.reduce((sum, copo) => sum + parseInt(copo.studentCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Class, Batch, and Exam Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2  bg-white border border-gray-300 rounded-md"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full p-2  bg-white border border-gray-300 rounded-md"
                >
                  <option value="">Select Batch</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full p-2 border bg-white  border-gray-300 rounded-md"
                >
                  <option value="">Select Exam Type</option>
                  <option value="mid">Mid Semester</option>
                  <option value="end">End Semester</option>
                </select>
              </div>
            </div>

            {/* COPO Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">COPO Entries</h3>
                <button
                  onClick={addCopo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add COPO
                </button>
              </div>

              <div className="space-y-6">
                {copoData.map((copo, index) => (
                  <Card key={copo.id} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium">COPO {index + 1}</h4>
                      <button
                        onClick={() => removeCopo(copo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Students
                        </label>
                        <input
                          type="number"
                          value={copo.studentCount}
                          onChange={(e) => updateStudentCount(copo.id, e.target.value)}
                          className="w-full md:w-1/4 p-2 border bg-white border-gray-300 rounded-md"
                          min="0"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {copo.marks.map((mark, markIndex) => (
                          <div key={markIndex}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Student {markIndex + 1}
                            </label>
                            <input
                              type="number"
                              value={mark}
                              onChange={(e) => updateMark(copo.id, markIndex, e.target.value)}
                              className="w-full p-2 border bg-white  border-gray-300 rounded-md"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-lg font-medium">
                          Total: {calculateTotal(copo.marks)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !selectedClass || !selectedBatch || !examType}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Copo;