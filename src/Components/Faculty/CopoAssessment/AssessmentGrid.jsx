import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssessmentGrid = ({ 
  type, // 'tms', 'TCA', or 'TES'
  assessmentNumber, // For TCA (1,2,3)
  tmsType, // For tms ('Tutorial', 'MiniProject', 'SurpriseTest')
  config,
  subjectCode,
  subjectName,
  branch,
  section,
  semester,
  academicYear,
  facultyId
}) => {
  const [saveStatus, setSaveStatus] = useState('');
  const [numberOfStudents, setNumberOfStudents] = useState(20);
  const [students, setStudents] = useState([]);
  const [assessmentData, setAssessmentData] = useState(null);
  const [selectedCOs, setSelectedCOs] = useState({
    1: { partA: 'CO1', partB: 'CO1', partC: 'CO1' },
    2: { partA: 'CO1', partB: 'CO1', partC: 'CO1' },
    3: { partA: 'CO1', partB: 'CO1', partC: 'CO1' },
    4: { partA: 'CO1', partB: 'CO1', partC: 'CO1' },
    5: { partA: 'CO1', partB: 'CO1', partC: 'CO1' }
  });

  const cos = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'];

  useEffect(() => {
    
    const fetchAssessmentData = async () => {
      try {
        const response = await axios.get(`/course-assessment/${facultyId}`, {
          params: {
            type,
            assessmentNumber,
            tmsType,
            subjectCode,
            branch,
            section,
            semester,
            academicYear
          }
        });
        setAssessmentData(response.data);
        if (response.data.students) {
          setStudents(response.data.students);
          setNumberOfStudents(response.data.students.length);
        }
      } catch (error) {
        console.error('Error fetching assessment data:', error);
      }
    };
    fetchAssessmentData();
  }, [facultyId, type, assessmentNumber, tmsType]);

  const handleStudentCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setNumberOfStudents(Math.max(1, Math.min(count, 100)));
  };

  const updateStudent = (index, field, value) => {
    const updatedStudents = [...students];
    if (!updatedStudents[index]) {
      updatedStudents[index] = {};
    }
    updatedStudents[index][field] = value;
    setStudents(updatedStudents);
  };

  const updateStudentMark = (index, field, value) => {
    const updatedStudents = [...students];
    if (!updatedStudents[index]) {
      updatedStudents[index] = { marks: {} };
    }
    
    switch (type) {
      case 'tms':
        if (!updatedStudents[index].tmsMarks) {
          updatedStudents[index].tmsMarks = [];
        }
        const [questionNum, part] = field.split('-');
        if (!updatedStudents[index].tmsMarks[0]) {
          updatedStudents[index].tmsMarks[0] = {
            type: tmsType,
            questions: Array(5).fill().map((_, idx) => ({
              partA: { maxMarks: 5, coNumber: selectedCOs[idx + 1].partA },
              partB: { maxMarks: 5, coNumber: selectedCOs[idx + 1].partB }
            }))
          };
        }
        
        const questionData = updatedStudents[index].tmsMarks[0].questions[questionNum - 1];
        if (part === 'A' || part === 'B') {
          questionData[`part${part}`].marksObtained = value ? Number(value) : undefined;
          questionData[`part${part}`].coNumber = selectedCOs[questionNum][`part${part}`];
        }
        break;
        
      case 'tes':
        if (!updatedStudents[index].tesMarks) {
          updatedStudents[index].tesMarks = [];
        }
        const [qNum, prt] = field.split('-');
        if (!updatedStudents[index].tesMarks[0]) {
          updatedStudents[index].tesMarks[0] = {
            questions: Array(5).fill().map((_, idx) => ({
              partA: { maxMarks: 7, coNumber: selectedCOs[idx + 1].partA },
              partB: { maxMarks: 7, coNumber: selectedCOs[idx + 1].partB },
              partC: { maxMarks: 6, coNumber: selectedCOs[idx + 1].partC }
            }))
          };
        }
        
        const qData = updatedStudents[index].tesMarks[0].questions[qNum - 1];
        if (prt === 'A' || prt === 'B' || prt === 'C') {
          qData[`part${prt}`].marksObtained = value ? Number(value) : undefined;
          qData[`part${prt}`].coNumber = selectedCOs[qNum][`part${prt}`];
        }
        break;
        
      case 'tca':
        if (!updatedStudents[index].tcaMarks) {
          updatedStudents[index].tcaMarks = [];
        }
        const tcaIndex = updatedStudents[index].tcaMarks.findIndex(
          m => m.assessmentNumber === assessmentNumber
        );
        if (tcaIndex === -1) {
          updatedStudents[index].tcaMarks.push({
            assessmentNumber,
            questionMarks: []
          });
        }

        const [questionIndex, partIndex] = field.split('-').map(Number);
        const currentTCA = updatedStudents[index].tcaMarks.find(
          m => m.assessmentNumber === assessmentNumber
        );
        if (!currentTCA.questionMarks[questionIndex]) {
          currentTCA.questionMarks[questionIndex] = { parts: [] };
        }
        currentTCA.questionMarks[questionIndex].parts[partIndex] = {
          partNumber: partIndex + 1,
          marksObtained: Number(value),
          maxMarks: config.questions[questionIndex].parts[partIndex].maxMarks,
          coNumber: config.questions[questionIndex].parts[partIndex].selectedCO
        };
        break;
    }
    
    setStudents(updatedStudents);
  };

  const handleCOChange = (questionNum, part, value) => {
    setSelectedCOs(prev => ({
      ...prev,
      [questionNum]: {
        ...prev[questionNum],
        [`part${part}`]: value
      }
    }));

    // Update all existing students with the new CO
    const updatedStudents = students.map(student => {
      if (type === 'tms' && student?.tmsMarks?.[0]?.questions) {
        student.tmsMarks[0].questions[questionNum - 1][`part${part}`].coNumber = value;
      } else if (type === 'tes' && student?.tesMarks?.[0]?.questions) {
        student.tesMarks[0].questions[questionNum - 1][`part${part}`].coNumber = value;
      }
      return student;
    });
    setStudents(updatedStudents);
  };

  const saveAssessmentData = async () => {
    try {
      setSaveStatus('Saving...');
      
      const validStudents = students.filter(student => 
        student && student.rollNo && student.name
      );

      const assessmentData = {
        type,
        assessmentNumber,
        tmsType,
        subject: {
          code: subjectCode,
          name: subjectName
        },
        academicYear,
        semester,
        branch,
        section,
        facultyId,
        numberOfStudents: validStudents.length,
        students: validStudents
      };

      switch (type) {
        case 'tms':
          assessmentData.tmsConfig = {
            type: tmsType,
            maxMarks: config.maxMarks,
            weightage: config.weightage,
            coMapping: Object.entries(selectedCOs).map(([questionNum, cos]) => ({
              questionNumber: parseInt(questionNum),
              partA: { coNumber: cos.partA },
              partB: { coNumber: cos.partB }
            }))
          };
          break;
          
        case 'tca':
          assessmentData.tcaConfig = {
            numberOfAssessments: 2,
            weightage: config.weightage,
            assessments: [
              {
                assessmentNumber: 1,
                name: "Class Test 1 or Assignment",
                questions: [
                  {
                    questionNumber: 1,
                    coNumber: "CO1",
                    maxMarks: 3,
                    parts: [
                      { partNumber: 1, maxMarks: 1.5 },
                      { partNumber: 2, maxMarks: 1.5 }
                    ]
                  },
                  {
                    questionNumber: 2,
                    coNumber: "CO3",
                    maxMarks: 3,
                    parts: [
                      { partNumber: 1, maxMarks: 1.5 },
                      { partNumber: 2, maxMarks: 1.5 }
                    ]
                  }
                ]
              },
              {
                assessmentNumber: 2,
                name: "Class Test 2",
                questions: [
                  {
                    questionNumber: 1,
                    coNumber: "CO2+CO4",
                    maxMarks: 6,
                    parts: [
                      { partNumber: 1, maxMarks: 3 },
                      { partNumber: 2, maxMarks: 3 }
                    ]
                  }
                ]
              }
            ]
          };
          break;
          
        case 'tes':
          assessmentData.tesConfig = {
            numberOfQuestions: 5,
            weightage: config.weightage,
            coMapping: Object.entries(selectedCOs).map(([questionNum, cos]) => ({
              questionNumber: parseInt(questionNum),
              partA: { coNumber: cos.partA },
              partB: { coNumber: cos.partB },
              partC: { coNumber: cos.partC }
            }))
          };
          break;
      }
      console.log('assessment data : ',assessmentData);
      const response = await axios.post('/update/course-assessment/create', assessmentData);
      
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving assessment:', error);
      setSaveStatus('Error saving data');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const calculateTotalMarks = (studentIndex) => {
    const student = students[studentIndex];
    if (!student?.tmsMarks?.[0]?.questions) return 0;

    return student.tmsMarks[0].questions.reduce((total, q) => {
      return total + (q.partA?.marksObtained || 0) + (q.partB?.marksObtained || 0);
    }, 0);
  };

  const calculateTESTotal = (studentIndex) => {
    const student = students[studentIndex];
    if (!student?.tesMarks?.[0]?.questions) return 0;

    const questionTotals = student.tesMarks[0].questions.map(q => {
      if (q.partA?.marksObtained === -1 || q.partB?.marksObtained === -1 || q.partC?.marksObtained === -1) {
        return 0; // Skip this question if any part is marked as not attempted
      }
      return (q.partA?.marksObtained || 0) + (q.partB?.marksObtained || 0) + (q.partC?.marksObtained || 0);
    });

    // Sort in descending order and take top 4 (skip the lowest)
    return questionTotals.sort((a, b) => b - a).slice(0, 4).reduce((a, b) => a + b, 0);
  };

  const updateTCAMark = (index, assessmentNumber, co, part, value) => {
    const updatedStudents = [...students];
    if (!updatedStudents[index]) {
      updatedStudents[index] = {};
    }
    if (!updatedStudents[index].tcaMarks) {
      updatedStudents[index].tcaMarks = [
        { assessmentNumber: 1, co1: {}, co3: {} },
        { assessmentNumber: 2, co24: {} }
      ];
    }
    
    const assessment = updatedStudents[index].tcaMarks.find(m => m.assessmentNumber === assessmentNumber);
    if (!assessment) {
      if (assessmentNumber === 1) {
        updatedStudents[index].tcaMarks.push({ assessmentNumber: 1, co1: {}, co3: {} });
      } else {
        updatedStudents[index].tcaMarks.push({ assessmentNumber: 2, co24: {} });
      }
    }
    
    const tcaIndex = updatedStudents[index].tcaMarks.findIndex(m => m.assessmentNumber === assessmentNumber);
    if (!updatedStudents[index].tcaMarks[tcaIndex][co]) {
      updatedStudents[index].tcaMarks[tcaIndex][co] = {};
    }
    
    updatedStudents[index].tcaMarks[tcaIndex][co][part] = Number(value) || 0;
    setStudents(updatedStudents);
  };

  const calculateTCATotal = (index, assessmentNumber, co) => {
    const student = students[index];
    if (!student?.tcaMarks) return 0;
    const assessment = student.tcaMarks.find(m => m.assessmentNumber === assessmentNumber);
    if (!assessment || !assessment[co]) return 0;
    return (assessment[co].part1 || 0) + (assessment[co].part2 || 0);
  };

  const calculateTotalTCAMarks = (index) => {
    const student = students[index];
    if (!student?.tcaMarks) return 0;
    return (
      calculateTCATotal(index, 1, 'co1') +
      calculateTCATotal(index, 1, 'co3') +
      calculateTCATotal(index, 2, 'co24')
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Number of Students:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={numberOfStudents}
            onChange={handleStudentCountChange}
            className="w-24 p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </label>
      </div>

      {type === 'tca' && (
        <div className="space-y-6">
          <div style={{ overflowX: 'auto', width: '100%' }} className="rounded-lg shadow-sm border border-gray-200">
            <div style={{ minWidth: '1200px' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b p-3 bg-gray-50" style={{ minWidth: '120px' }} colSpan="2"></th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 font-semibold text-center" colSpan="6">
                      Class Test 1 or Assignment
                    </th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 font-semibold text-center" colSpan="3">
                      Class Test 2
                    </th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 font-semibold" rowSpan="2" style={{ minWidth: '80px' }}>
                      Total
                    </th>
                  </tr>
                  <tr>
                    <th className="border-b p-3 bg-gray-50 text-gray-700" style={{ minWidth: '120px' }}>Roll No</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700" style={{ minWidth: '120px' }}>Name</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center" colSpan="2">CO1</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center">Total</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center" colSpan="2">CO3</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center">Total</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center" colSpan="2">CO2+CO4</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: numberOfStudents }).map((_, index) => (
                    <tr key={index}>
                      <td className="border-b border-r p-3" style={{ minWidth: '120px' }}>
                        <input
                          type="text"
                          value={students[index]?.rollNo || ''}
                          onChange={(e) => updateStudent(index, 'rollNo', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '120px' }}>
                        <input
                          type="text"
                          value={students[index]?.name || ''}
                          onChange={(e) => updateStudent(index, 'name', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      {/* CO1 Marks */}
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.co1?.part1 || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'co1', 'part1', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.co1?.part2 || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'co1', 'part2', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTCATotal(index, 1, 'co1')}
                      </td>
                      {/* CO3 Marks */}
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.co3?.part1 || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'co3', 'part1', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.co3?.part2 || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'co3', 'part2', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTCATotal(index, 1, 'co3')}
                      </td>
                      {/* CO2+CO4 Marks */}
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 2)?.co24?.part1 || ''}
                          onChange={(e) => updateTCAMark(index, 2, 'co24', 'part1', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 2)?.co24?.part2 || ''}
                          onChange={(e) => updateTCAMark(index, 2, 'co24', 'part2', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTCATotal(index, 2, 'co24')}
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTotalTCAMarks(index)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(type === 'tms' || type === 'tes') && (
        <div className="space-y-6">
          {/* CO Selection Row */}
          <div style={{ overflowX: 'auto', width: '100%' }} className="rounded-lg shadow-sm border border-gray-200">
            <div style={{ minWidth: type === 'tes' ? '1200px' : '1000px' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b p-3 bg-gray-50" style={{ minWidth: '120px' }} colSpan="2"></th>
                    {[1, 2, 3, 4, 5].map(qNum => (
                      <th key={qNum} colSpan={type === 'tes' ? 3 : 2} className="border-b p-3 bg-gray-50 text-gray-700 font-semibold">
                        Question {qNum}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="border-b p-3" style={{ minWidth: '120px' }} colSpan="2"></th>
                    {[1, 2, 3, 4, 5].map(qNum => (
                      <React.Fragment key={qNum}>
                        <td className="border-b border-r p-3" style={{ minWidth: '100px' }}>
                          <div className="text-center mb-2 text-sm font-medium text-gray-600">Part A</div>
                          <select
                            value={selectedCOs[qNum].partA}
                            onChange={(e) => handleCOChange(qNum, 'A', e.target.value)}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                          >
                            {cos.map(co => (
                              <option key={co} value={co}>{co}</option>
                            ))}
                          </select>
                        </td>
                        <td className="border-b border-r p-3" style={{ minWidth: '100px' }}>
                          <div className="text-center mb-2 text-sm font-medium text-gray-600">Part B</div>
                          <select
                            value={selectedCOs[qNum].partB}
                            onChange={(e) => handleCOChange(qNum, 'B', e.target.value)}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                          >
                            {cos.map(co => (
                              <option key={co} value={co}>{co}</option>
                            ))}
                          </select>
                        </td>
                        {type === 'tes' && (
                          <td className="border-b border-r p-3" style={{ minWidth: '100px' }}>
                            <div className="text-center mb-2 text-sm font-medium text-gray-600">Part C</div>
                            <select
                              value={selectedCOs[qNum].partC}
                              onChange={(e) => handleCOChange(qNum, 'C', e.target.value)}
                              className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                              {cos.map(co => (
                                <option key={co} value={co}>{co}</option>
                              ))}
                            </select>
                          </td>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
          </div>

          {/* Marks Input Table */}
          <div style={{ overflowX: 'auto', width: '100%' }} className="rounded-lg shadow-sm border border-gray-200">
            <div style={{ minWidth: type === 'tes' ? '1200px' : '1000px' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 font-semibold" style={{ minWidth: '120px' }}>Roll No</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 font-semibold" style={{ minWidth: '120px' }}>Name</th>
                    {[1, 2, 3, 4, 5].map(qNum => (
                      <th key={qNum} colSpan={type === 'tes' ? 3 : 2} className="border-b p-3 bg-gray-50 text-gray-700 font-semibold">
                        Question {qNum}
                      </th>
                    ))}
                    <th className="border-b p-3 bg-gray-50 text-gray-700 font-semibold" style={{ minWidth: '80px' }}>Total</th>
                  </tr>
                  <tr>
                    <th className="border-b border-r p-3"></th>
                    <th className="border-b border-r p-3"></th>
                    {[1, 2, 3, 4, 5].map(qNum => (
                      <React.Fragment key={qNum}>
                        <th className="border-b border-r p-3 text-sm font-medium text-gray-600" style={{ minWidth: '100px' }}>A</th>
                        <th className="border-b border-r p-3 text-sm font-medium text-gray-600" style={{ minWidth: '100px' }}>B</th>
                        {type === 'tes' && (
                          <th className="border-b border-r p-3 text-sm font-medium text-gray-600" style={{ minWidth: '100px' }}>C</th>
                        )}
                      </React.Fragment>
                    ))}
                    <th className="border-b border-r p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: numberOfStudents }).map((_, index) => (
                    <tr key={index}>
                      <td className="border-b border-r p-3" style={{ minWidth: '120px' }}>
                        <input
                          type="text"
                          value={students[index]?.rollNo || ''}
                          onChange={(e) => updateStudent(index, 'rollNo', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '120px' }}>
                        <input
                          type="text"
                          value={students[index]?.name || ''}
                          onChange={(e) => updateStudent(index, 'name', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      {[1, 2, 3, 4, 5].map(qNum => (
                        <React.Fragment key={qNum}>
                          <td className="border-b border-r p-3" style={{ minWidth: '100px' }}>
                            <input
                              type="number"
                              min={type === 'tes' ? -1 : 0}
                              max={type === 'tes' ? 7 : 5}
                              value={type === 'tms' 
                                ? students[index]?.tmsMarks?.[0]?.questions?.[qNum-1]?.partA?.marksObtained || ''
                                : students[index]?.tesMarks?.[0]?.questions?.[qNum-1]?.partA?.marksObtained || ''
                              }
                              onChange={(e) => updateStudentMark(index, `${qNum}-A-marks`, e.target.value)}
                              className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                              placeholder={type === 'tes' ? "-1" : ""}
                            />
                          </td>
                          <td className="border-b border-r p-3" style={{ minWidth: '100px' }}>
                            <input
                              type="number"
                              min={type === 'tes' ? -1 : 0}
                              max={type === 'tes' ? 7 : 5}
                              value={type === 'tms'
                                ? students[index]?.tmsMarks?.[0]?.questions?.[qNum-1]?.partB?.marksObtained || ''
                                : students[index]?.tesMarks?.[0]?.questions?.[qNum-1]?.partB?.marksObtained || ''
                              }
                              onChange={(e) => updateStudentMark(index, `${qNum}-B-marks`, e.target.value)}
                              className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                              placeholder={type === 'tes' ? "-1" : ""}
                            />
                          </td>
                          {type === 'tes' && (
                            <td className="border-b border-r p-3" style={{ minWidth: '100px' }}>
                              <input
                                type="number"
                                min={-1}
                                max={6}
                                value={students[index]?.tesMarks?.[0]?.questions?.[qNum-1]?.partC?.marksObtained || ''}
                                onChange={(e) => updateStudentMark(index, `${qNum}-C-marks`, e.target.value)}
                                className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                                placeholder="-1"
                              />
                            </td>
                          )}
                        </React.Fragment>
                      ))}
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {type === 'tms' ? calculateTotalMarks(index) : calculateTESTotal(index)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveAssessmentData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save Assessment Data
        </button>
        {saveStatus && (
          <span className={`ml-4 py-2 ${saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  );
};

export default AssessmentGrid;