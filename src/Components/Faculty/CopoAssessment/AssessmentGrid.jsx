import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

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
  const [tcaSelectedCOs, setTcaSelectedCOs] = useState({
    1: { co1: true, co2: false, co3: false, co4: false, co5: false, co6: false },
    2: { co1: false, co2: true, co3: false, co4: true, co5: false, co6: false },
    3: { co1: false, co2: false, co3: true, co4: false, co5: false, co6: false }
  });

  const cos = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelData = XLSX.utils.sheet_to_json(firstSheet);
      
      const updatedStudents = excelData.map(row => {
        const student = {
          rollNo: row['Roll No'] || row['RollNo'] || row['Roll Number'] || '',
          name: row['Name'] || row['Student Name'] || '',
          marks: {}
        };

        if (type === 'tms') {
          student.tmsMarks = [{
            type: tmsType,
            questions: Array(5).fill().map((_, idx) => ({
              partA: { maxMarks: 5, coNumber: selectedCOs[idx + 1].partA },
              partB: { maxMarks: 5, coNumber: selectedCOs[idx + 1].partB }
            }))
          }];
        } else if (type === 'tes') {
          student.tesMarks = [{
            questions: Array(5).fill().map((_, idx) => ({
              partA: { maxMarks: 7, coNumber: selectedCOs[idx + 1].partA },
              partB: { maxMarks: 7, coNumber: selectedCOs[idx + 1].partB },
              partC: { maxMarks: 6, coNumber: selectedCOs[idx + 1].partC }
            }))
          }];
        } else if (type === 'tca') {
          student.tcaMarks = [
            { assessmentNumber: 1, marks: {} },
            { assessmentNumber: 2, marks: {} }
          ];
        }

        return student;
      }).filter(student => student.rollNo && student.name);

      setStudents(updatedStudents);
      setNumberOfStudents(updatedStudents.length);
    };
    
    reader.readAsArrayBuffer(file);
  };

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

  useEffect(() => {
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
          updatedStudents[index].tcaMarks = [
            { assessmentNumber: 1, marks: {} },
            { assessmentNumber: 2, marks: {} }
          ];
        }
        const tcaIndex = updatedStudents[index].tcaMarks.findIndex(
          m => m.assessmentNumber === assessmentNumber
        );
        if (tcaIndex === -1) {
          updatedStudents[index].tcaMarks.push({
            assessmentNumber,
            marks: {}
          });
        }

        const [questionIndex, partIndex] = field.split('-').map(Number);
        const currentTCA = updatedStudents[index].tcaMarks.find(
          m => m.assessmentNumber === assessmentNumber
        );
        if (!currentTCA.marks[questionIndex]) {
          currentTCA.marks[questionIndex] = { parts: [] };
        }
        currentTCA.marks[questionIndex].parts[partIndex] = {
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

  const updateTCAMark = (index, assessmentNumber, co, part, value) => {
    const updatedStudents = [...students];
    if (!updatedStudents[index]) {
      updatedStudents[index] = {};
    }
    if (!updatedStudents[index].tcaMarks) {
      updatedStudents[index].tcaMarks = [
        { assessmentNumber: 1, marks: {} },
        { assessmentNumber: 2, marks: {} }
      ];
    }
    
    const assessment = updatedStudents[index].tcaMarks.find(m => m.assessmentNumber === assessmentNumber);
    if (!assessment) {
      updatedStudents[index].tcaMarks.push({ 
        assessmentNumber: assessmentNumber, 
        marks: {} 
      });
    }
    
    const tcaIndex = updatedStudents[index].tcaMarks.findIndex(m => m.assessmentNumber === assessmentNumber);
    
    // Set the marks for this part
    if (!updatedStudents[index].tcaMarks[tcaIndex].marks[part]) {
      updatedStudents[index].tcaMarks[tcaIndex].marks[part] = {};
    }
    
    updatedStudents[index].tcaMarks[tcaIndex].marks[part].value = Number(value) || 0;
    
    // Distribute the marks to selected COs
    const questionKey = assessmentNumber === 1 ? 
      (part.startsWith('q1') ? 1 : 3) : 
      2;
      
    const selectedCOsForQuestion = tcaSelectedCOs[questionKey];
    const selectedCOCount = Object.values(selectedCOsForQuestion).filter(Boolean).length;
    
    if (selectedCOCount > 0) {
      const marksPerCO = (Number(value) || 0) / selectedCOCount;
      
      // Store the distributed marks for each selected CO
      Object.entries(selectedCOsForQuestion).forEach(([coKey, isSelected]) => {
        if (isSelected) {
          if (!updatedStudents[index].tcaMarks[tcaIndex].marks[part].coDistribution) {
            updatedStudents[index].tcaMarks[tcaIndex].marks[part].coDistribution = {};
          }
          updatedStudents[index].tcaMarks[tcaIndex].marks[part].coDistribution[coKey] = marksPerCO;
        }
      });
    }
    
    setStudents(updatedStudents);
  };

  const calculateTCATotal = (index, assessmentNumber, questionKey) => {
    const student = students[index];
    if (!student?.tcaMarks) return 0;
    
    const assessment = student.tcaMarks.find(m => m.assessmentNumber === assessmentNumber);
    if (!assessment || !assessment.marks) return 0;
    
    // Determine which parts belong to this question
    let parts = [];
    if (assessmentNumber === 1) {
      if (questionKey === 1) {
        parts = ['q1p1', 'q1p2'];
      } else if (questionKey === 3) {
        parts = ['q2p1', 'q2p2'];
      }
    } else if (assessmentNumber === 2) {
      parts = ['q1p1', 'q1p2'];
    }
    
    // Sum up the marks for these parts
    return parts.reduce((sum, part) => {
      return sum + (assessment.marks[part]?.value || 0);
    }, 0);
  };

  const calculateTotalTCAMarks = (index) => {
    const student = students[index];
    if (!student?.tcaMarks) return 0;
    
    let total = 0;
    
    // Class Test 1
    const ct1 = student.tcaMarks.find(m => m.assessmentNumber === 1);
    if (ct1 && ct1.marks) {
      total += Object.values(ct1.marks).reduce((sum, mark) => sum + (mark.value || 0), 0);
    }
    
    // Class Test 2
    const ct2 = student.tcaMarks.find(m => m.assessmentNumber === 2);
    if (ct2 && ct2.marks) {
      total += Object.values(ct2.marks).reduce((sum, mark) => sum + (mark.value || 0), 0);
    }
    
    return total;
  };

  const handleTcaCOChange = (questionKey, coKey, checked) => {
    setTcaSelectedCOs(prev => ({
      ...prev,
      [questionKey]: {
        ...prev[questionKey],
        [coKey]: checked
      }
    }));
    
    // Update all existing students to redistribute marks
    const updatedStudents = [...students];
    updatedStudents.forEach((student, index) => {
      if (!student?.tcaMarks) return;
      
      // Determine which assessment and parts this change affects
      let assessmentNumber, parts;
      if (questionKey === 1) {
        assessmentNumber = 1;
        parts = ['q1p1', 'q1p2'];
      } else if (questionKey === 3) {
        assessmentNumber = 1;
        parts = ['q2p1', 'q2p2'];
      } else if (questionKey === 2) {
        assessmentNumber = 2;
        parts = ['q1p1', 'q1p2'];
      }
      
      const tcaIndex = student.tcaMarks.findIndex(m => m.assessmentNumber === assessmentNumber);
      if (tcaIndex === -1) return;
      
      // Redistribute marks for each part
      parts.forEach(part => {
        const mark = student.tcaMarks[tcaIndex].marks[part];
        if (!mark || !mark.value) return;
        
        const selectedCOsForQuestion = {
          ...tcaSelectedCOs[questionKey],
          [coKey]: checked
        };
        const selectedCOCount = Object.values(selectedCOsForQuestion).filter(Boolean).length;
        
        if (selectedCOCount > 0) {
          const marksPerCO = mark.value / selectedCOCount;
          
          if (!mark.coDistribution) {
            mark.coDistribution = {};
          }
          
          // Update distribution for all COs
          Object.entries(selectedCOsForQuestion).forEach(([coKey, isSelected]) => {
            if (isSelected) {
              mark.coDistribution[coKey] = marksPerCO;
            } else {
              delete mark.coDistribution[coKey];
            }
          });
        }
      });
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Student Data (Excel file)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          Excel file should have columns for "Roll No" (or "RollNo"/"Roll Number") and "Name" (or "Student Name")
        </p>
      </div>

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
          {/* CO Selection Row */}
          <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-3">CO Mapping</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Class Test 1 - Question 1</h4>
                <div className="flex flex-wrap gap-3">
                  {cos.map((co, idx) => (
                    <label key={`ct1-q1-${idx}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tcaSelectedCOs[1][`co${idx+1}`]}
                        onChange={(e) => handleTcaCOChange(1, `co${idx+1}`, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>{co}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Class Test 1 - Question 2</h4>
                <div className="flex flex-wrap gap-3">
                  {cos.map((co, idx) => (
                    <label key={`ct1-q2-${idx}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tcaSelectedCOs[3][`co${idx+1}`]}
                        onChange={(e) => handleTcaCOChange(3, `co${idx+1}`, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>{co}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Class Test 2 - Question 1</h4>
                <div className="flex flex-wrap gap-3">
                  {cos.map((co, idx) => (
                    <label key={`ct2-q1-${idx}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tcaSelectedCOs[2][`co${idx+1}`]}
                        onChange={(e) => handleTcaCOChange(2, `co${idx+1}`, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>{co}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center" colSpan="2">Question 1</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center">Total</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center" colSpan="2">Question 2</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center">Total</th>
                    <th className="border-b p-3 bg-gray-50 text-gray-700 text-center" colSpan="2">Question 1</th>
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
                      {/* Class Test 1 - Question 1 */}
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.marks?.q1p1?.value || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'q1', 'q1p1', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.marks?.q1p2?.value || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'q1', 'q1p2', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTCATotal(index, 1, 1)}
                      </td>
                      {/* Class Test 1 - Question 2 */}
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.marks?.q2p1?.value || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'q2', 'q2p1', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="1.5"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 1)?.marks?.q2p2?.value || ''}
                          onChange={(e) => updateTCAMark(index, 1, 'q2', 'q2p2', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTCATotal(index, 1, 3)}
                      </td>
                      {/* Class Test 2 - Question 1 */}
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 2)?.marks?.q1p1?.value || ''}
                          onChange={(e) => updateTCAMark(index, 2, 'q1', 'q1p1', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3" style={{ minWidth: '80px' }}>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          step="0.1"
                          value={students[index]?.tcaMarks?.find(m => m.assessmentNumber === 2)?.marks?.q1p2?.value || ''}
                          onChange={(e) => updateTCAMark(index, 2, 'q1', 'q1p2', e.target.value)}
                          className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </td>
                      <td className="border-b border-r p-3 bg-gray-50 text-center font-medium text-gray-700" style={{ minWidth: '80px' }}>
                        {calculateTCATotal(index, 2, 2)}
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
          
          {/* CO Distribution Summary */}
          <div className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-3">CO Distribution Summary</h3>
            <div className="grid grid-cols-6 gap-4">
              {cos.map((co, idx) => {
                const coKey = `co${idx+1}`;
                // Calculate how many questions use this CO
                const usedIn = [
                  tcaSelectedCOs[1][coKey] ? 'CT1-Q1' : null,
                  tcaSelectedCOs[3][coKey] ? 'CT1-Q2' : null,
                  tcaSelectedCOs[2][coKey] ? 'CT2-Q1' : null,
                ].filter(Boolean);
                
                return (
                  <div key={coKey} className="p-3 border rounded-md bg-white shadow-sm">
                    <h4 className="font-medium text-blue-600">{co}</h4>
                    <p className="text-sm text-gray-600 mt-1">Used in: {usedIn.length ? usedIn.join(', ') : 'None'}</p>
                  </div>
                );
              })}
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