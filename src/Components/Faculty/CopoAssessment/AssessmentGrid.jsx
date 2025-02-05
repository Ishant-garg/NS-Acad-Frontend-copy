import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssessmentGrid = ({ 
  type, // 'TMS', 'TCA', or 'TES'
  assessmentNumber, // For TCA (1,2,3)
  tmsType, // For TMS ('Tutorial', 'MiniProject', 'SurpriseTest')
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

  useEffect(() => {
    
    const fetchAssessmentData = async () => {
      try {
        const response = await axios.get(`/api/course-assessment/${facultyId}`, {
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
      case 'TMS':
        if (!updatedStudents[index].tmsMarks) {
          updatedStudents[index].tmsMarks = [];
        }
        updatedStudents[index].tmsMarks = [{
          type: tmsType,
          marksObtained: Number(value),
          maxMarks: config.maxMarks,
          coNumber: config.coNumber,
          date: new Date()
        }];
        break;
        
      case 'TCA':
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
        
      case 'TES':
        if (!updatedStudents[index].tesSurvey) {
          updatedStudents[index].tesSurvey = {
            surveyDate: new Date(),
            responses: []
          };
        }
        const [questionNumber] = field.split('-').map(Number);
        updatedStudents[index].tesSurvey.responses[questionNumber] = {
          questionNumber: questionNumber + 1,
          rating: Number(value),
          coNumber: config.coMapping[questionNumber]
        };
        break;
    }
    
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
        case 'TMS':
          assessmentData.tmsConfig = {
            type: tmsType,
            maxMarks: config.maxMarks,
            weightage: config.weightage,
            coMapping: config.coMapping
          };
          break;
          
        case 'TCA':
          assessmentData.tcaConfig = {
            numberOfAssessments: 3,
            weightage: config.weightage,
            questionPatterns: config.questions.map((q, i) => ({
              assessmentNumber,
              numberOfQuestions: config.questions.length,
              marksPerQuestion: q.parts.reduce((sum, p) => sum + p.maxMarks, 0),
              coMapping: q.parts.map((p, j) => ({
                questionNumber: i + 1,
                partNumber: j + 1,
                coNumber: p.selectedCO
              }))
            }))
          };
          break;
          
        case 'TES':
          assessmentData.tesConfig = {
            numberOfQuestions: config.questions.length,
            weightage: config.weightage,
            coMapping: config.coMapping
          };
          break;
      }

      const response = await axios.post('/api/course-assessment/create', assessmentData);
      
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving assessment:', error);
      setSaveStatus('Error saving data');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const renderHeader = () => {
    switch (type) {
      case 'TMS':
        return (
          <tr className="bg-gray-50">
            <th className="border p-2">Roll No.</th>
            <th className="border p-2">Name of Students</th>
            <th className="border p-2 bg-blue-50">
              {tmsType} (CO{config.coNumber}) - Max Marks: {config.maxMarks}
            </th>
          </tr>
        );
        
      case 'TCA':
        return (
          <tr className="bg-gray-50">
            <th className="border p-2">Roll No.</th>
            <th className="border p-2">Name of Students</th>
            {config.questions.map((question, qIndex) => (
              <React.Fragment key={qIndex}>
                <th className="border p-2 bg-blue-50" colSpan={question.parts.length}>
                  Q{qIndex + 1}
                </th>
              </React.Fragment>
            ))}
            <th className="border p-2">Total</th>
          </tr>
        );
        
      case 'TES':
        return (
          <tr className="bg-gray-50">
            <th className="border p-2">Roll No.</th>
            <th className="border p-2">Name of Students</th>
            {config.questions.map((_, index) => (
              <th key={index} className="border p-2 bg-green-50">
                Q{index + 1} (CO{config.coMapping[index]})
              </th>
            ))}
          </tr>
        );
    }
  };

  const renderStudentRows = () => {
    return [...Array(numberOfStudents)].map((_, index) => (
      <tr key={index}>
        <td className="border p-2">
          <input
            type="text"
            className="w-full bg-white p-1 border rounded"
            value={students[index]?.rollNo || ''}
            onChange={(e) => updateStudent(index, 'rollNo', e.target.value)}
          />
        </td>
        <td className="border p-2">
          <input
            type="text"
            className="w-full p-1 border bg-white rounded"
            value={students[index]?.name || ''}
            onChange={(e) => updateStudent(index, 'name', e.target.value)}
          />
        </td>
        {renderMarkInputs(index)}
      </tr>
    ));
  };

  const renderMarkInputs = (studentIndex) => {
    switch (type) {
      case 'TMS':
        return (
          <td className="border p-2">
            <input
              type="number"
              min="0"
              max={config.maxMarks}
              className="w-16 p-1 border bg-white rounded"
              value={students[studentIndex]?.tmsMarks?.[0]?.marksObtained || ''}
              onChange={(e) => updateStudentMark(studentIndex, 'marks', e.target.value)}
            />
          </td>
        );
        
      case 'TCA':
        return (
          <>
            {config.questions.map((question, qIndex) => 
              question.parts.map((part, pIndex) => (
                <td key={`${qIndex}-${pIndex}`} className="border p-2">
                  <input
                    type="number"
                    min="0"
                    max={part.maxMarks}
                    className="w-16 p-1 border bg-white rounded"
                    value={students[studentIndex]?.tcaMarks?.find(m => m.assessmentNumber === assessmentNumber)
                      ?.questionMarks?.[qIndex]?.parts?.[pIndex]?.marksObtained || ''}
                    onChange={(e) => updateStudentMark(studentIndex, `${qIndex}-${pIndex}`, e.target.value)}
                  />
                </td>
              ))
            )}
            <td className="border p-2 bg-gray-50 font-medium">
              {calculateTotalMarks(studentIndex)}
            </td>
          </>
        );
        
      case 'TES':
        return config.questions.map((_, qIndex) => (
          <td key={qIndex} className="border p-2">
            <select
              className="w-16 p-1 border bg-white rounded"
              value={students[studentIndex]?.tesSurvey?.responses?.[qIndex]?.rating || ''}
              onChange={(e) => updateStudentMark(studentIndex, `${qIndex}`, e.target.value)}
            >
              <option value="">-</option>
              {[1, 2, 3, 4, 5].map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </td>
        ));
    }
  };

  const calculateTotalMarks = (studentIndex) => {
    if (!students[studentIndex]?.tcaMarks) return 0;
    
    const tcaEntry = students[studentIndex].tcaMarks.find(
      m => m.assessmentNumber === assessmentNumber
    );
    
    if (!tcaEntry) return 0;
    
    return tcaEntry.questionMarks.reduce((total, q) => 
      total + q.parts.reduce((sum, p) => sum + (p.marksObtained || 0), 0), 0
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="font-medium">Number of Students:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={numberOfStudents}
            onChange={handleStudentCountChange}
            className="w-20 p-1 border rounded bg-white"
          />
        </label>
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="w-full border-collapse border">
          <thead>
            {renderHeader()}
          </thead>
          <tbody>
            {renderStudentRows()}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-end">
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