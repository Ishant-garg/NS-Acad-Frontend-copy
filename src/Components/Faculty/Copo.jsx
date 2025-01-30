import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '../../../utils/api';

const CopoAssessment = () => {
  const [formData, setFormData] = useState({
    branch: '',
    section: '',
    courseCode: '',
    numberOfCopos: 0
  });

  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assessmentConfig, setAssessmentConfig] = useState({
    tms: { name: 'TMS (Theory Mid Sem)', questionCount: 5, maxMarks: 15, questions: [] },
    tca: { name: 'TCA (Theory Continuous Assessment)', questionCount: 5, maxMarks: 15, questions: [] },
    tes: { name: 'TES (Theory End Sem)', questionCount: 5, maxMarks: 40, questions: [] }
  });

  const [studentMarks, setStudentMarks] = useState({});
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/read/classes');
        setClassesData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch class data');
        setLoading(false);
      }
    };

    fetchClasses();
    initializeQuestions();
  }, []);

  const initializeQuestions = () => {
    Object.keys(assessmentConfig).forEach(type => {
      updateAssessmentQuestions(type, assessmentConfig[type].questionCount);
    });
  };

  const getUniqueBranches = () => {
    return Array.from(new Set(classesData.map(cls => cls.branch)));
  };

  const getSections = (selectedBranch) => {
    return Array.from(new Set(
      classesData
        .filter(cls => cls.branch === selectedBranch)
        .map(cls => cls.section)
    ));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'branch') {
        newData.section = '';
      }
      return newData;
    });
  };

  const updateAssessmentQuestions = (type, count) => {
    setAssessmentConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        questionCount: parseInt(count) || 0,
        questions: Array(parseInt(count) || 0).fill().map(() => ({
          parts: [],
          totalMarks: 0
        }))
      }
    }));
  };

  const updateQuestionParts = (type, questionIndex, partCount) => {
    setAssessmentConfig(prev => {
      const newConfig = { ...prev };
      const question = newConfig[type].questions[questionIndex];
      question.parts = Array(parseInt(partCount) || 0).fill().map(() => ({
        maxMarks: 0,
        selectedCO: ''
      }));
      question.totalMarks = 0;
      return newConfig;
    });
  };

  const updatePartDetails = (type, questionIndex, partIndex, field, value) => {
    setAssessmentConfig(prev => {
      const newConfig = { ...prev };
      const part = newConfig[type].questions[questionIndex].parts[partIndex];
      part[field] = value;
      
      const totalMarks = newConfig[type].questions[questionIndex].parts.reduce(
        (sum, part) => sum + (parseInt(part.maxMarks) || 0), 0
      );
      newConfig[type].questions[questionIndex].totalMarks = totalMarks;
      
      return newConfig;
    });
  };

  const updateStudentMark = (type, studentId, questionIndex, partIndex, mark) => {
    setStudentMarks(prev => {
      const newMarks = { ...prev };
      if (!newMarks[studentId]) {
        newMarks[studentId] = { tms: {}, tca: {}, tes: {} };
      }
      if (!newMarks[studentId][type][questionIndex]) {
        newMarks[studentId][type][questionIndex] = {};
      }
      newMarks[studentId][type][questionIndex][partIndex] = parseInt(mark) || 0;
      return newMarks;
    });
  };

  const updateStudent = (index, field, value) => {
    setStudents(prev => {
      const newStudents = [...prev];
      if (!newStudents[index]) {
        newStudents[index] = { id: Date.now().toString(), rollNo: '', name: '' };
      }
      newStudents[index][field] = value;
      return newStudents;
    });
  };

  const calculateStudentTotal = (type, studentId) => {
    let total = 0;
    const studentData = studentMarks[studentId]?.[type] || {};
    
    Object.keys(studentData).forEach(qIndex => {
      Object.keys(studentData[qIndex]).forEach(pIndex => {
        total += studentData[qIndex][pIndex] || 0;
      });
    });
    
    return total;
  };
const calculateCOTotal = (type, studentId, coNumber) => {
    let total = 0;
    const studentData = studentMarks[studentId]?.[type] || {};
    
    Object.keys(studentData).forEach(qIndex => {
      Object.keys(studentData[qIndex]).forEach(pIndex => {
        const part = assessmentConfig[type].questions[qIndex].parts[pIndex];
        if (part?.selectedCO === `CO${coNumber}`) {
          total += studentData[qIndex][pIndex] || 0;
        }
      });
    });
    
    return total;
  };

  const calculateMaxCOMarks = (type, coNumber) => {
    let total = 0;
    assessmentConfig[type].questions.forEach((question, qIndex) => {
      question.parts.forEach((part) => {
        if (part.selectedCO === `CO${coNumber}`) {
          total += parseInt(part.maxMarks) || 0;
        }
      });
    });
    return total;
  };

  const renderCombinedGrid = (type) => {
    const config = assessmentConfig[type];
    
    return (
      <div className="overflow-x-auto mt-6">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2">Roll No.</th>
              <th className="border p-2">Name of Students</th>
              {config.questions.map((question, qIndex) => (
                <React.Fragment key={qIndex}>
                  <th className="border p-2 bg-blue-50" colSpan={3}>
                    Q{qIndex + 1}
                  </th>
                </React.Fragment>
              ))}
              <th className="border p-2">Total Marks</th>
              {Array.from({ length: formData.numberOfCopos }).map((_, index) => (
                <th key={`co-${index}`} className="border p-2 bg-green-50">
                  CO{index + 1} ({calculateMaxCOMarks(type, index + 1)})
                </th>
              ))}
            </tr>
            <tr>
              <th colSpan={2} className="border p-2 bg-gray-50">Parts</th>
              {config.questions.map((_, qIndex) => (
                <td key={`parts-${qIndex}`} className="border p-2" colSpan={3}>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    className="w-20 p-1 bg-white border rounded"
                    onChange={(e) => updateQuestionParts(type, qIndex, e.target.value)}
                  />
                </td>
              ))}
              <td colSpan={formData.numberOfCopos + 1} className="border bg-gray-50"></td>
            </tr>
            <tr>
              <th colSpan={2} className="border p-2 bg-gray-50">CO Number</th>
              {config.questions.map((question, qIndex) => (
                question.parts.map((_, pIndex) => (
                  <td key={`co-${qIndex}-${pIndex}`} className="border p-2">
                    <select
                      className="w-20 p-1 border bg-white rounded"
                      onChange={(e) => updatePartDetails(type, qIndex, pIndex, 'selectedCO', e.target.value)}
                    >
                      <option value="">CO</option>
                      {Array.from({ length: formData.numberOfCopos }, (_, i) => (
                        <option key={i} value={`CO${i + 1}`}>CO{i + 1}</option>
                      ))}
                    </select>
                  </td>
                ))
              ))}
              <td colSpan={formData.numberOfCopos + 1} className="border bg-gray-50"></td>
            </tr>
            <tr>
              <th colSpan={2} className="border p-2 bg-gray-50">Maximum Marks</th>
              {config.questions.map((question, qIndex) => (
                question.parts.map((_, pIndex) => (
                  <td key={`marks-${qIndex}-${pIndex}`} className="border p-2">
                    <input
                      type="number"
                      min="0"
                      className="w-16 p-1 bg-white border rounded"
                      onChange={(e) => updatePartDetails(type, qIndex, pIndex, 'maxMarks', e.target.value)}
                    />
                  </td>
                ))
              ))}
              <td colSpan={formData.numberOfCopos + 1} className="border bg-gray-50"></td>
            </tr>
          </thead>
          <tbody>
            {[...Array(20)].map((_, index) => (
              <tr key={index}>
                <td className="border p-2">
                  <input
                    type="text"
                    className="w-full bg-white p-1 border rounded"
                    onChange={(e) => updateStudent(index, 'rollNo', e.target.value)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    className="w-full p-1 border bg-white rounded"
                    onChange={(e) => updateStudent(index, 'name', e.target.value)}
                  />
                </td>
                {config.questions.map((question, qIndex) => (
                  question.parts.map((part, pIndex) => (
                    <td key={`${qIndex}-${pIndex}`} className="border p-2">
                      <input
                        type="number"
                        min="0"
                        max={part.maxMarks}
                        className="w-16 p-1 border bg-white rounded"
                        onChange={(e) => updateStudentMark(type, `student${index}`, qIndex, pIndex, e.target.value)}
                      />
                    </td>
                  ))
                ))}
                <td className="border p-2 bg-gray-50 font-medium">
                  {calculateStudentTotal(type, `student${index}`)}
                </td>
                {Array.from({ length: formData.numberOfCopos }).map((_, coIndex) => (
                  <td key={`co-total-${coIndex}`} className="border p-2 bg-green-50 font-medium">
                    {calculateCOTotal(type, `student${index}`, coIndex + 1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAssessmentContent = (type) => {
    return (
      <div className="space-y-6">
        {renderCombinedGrid(type)}
      </div>
    );
  };

  if (loading) return <div className="p-6">Loading class data...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>COPO Assessment Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <select 
                className="w-full bg-white p-2 border rounded"
                value={formData.branch}
                onChange={(e) => updateFormData('branch', e.target.value)}
              >
                <option value="">Select Branch</option>
                {getUniqueBranches().map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select
                className="w-full bg-white p-2 border rounded"
                value={formData.section}
                onChange={(e) => updateFormData('section', e.target.value)}
                disabled={!formData.branch}
              >
                <option value="">Select Section</option>
                {formData.branch && getSections(formData.branch).map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Course Code</label>
              <input
                type="text"
                className="w-full p-2 bg-white border rounded"
                value={formData.courseCode}
                onChange={(e) => updateFormData('courseCode', e.target.value)}
                placeholder="Enter Course Code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Number of COs</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 bg-white border rounded"
                value={formData.numberOfCopos}
                onChange={(e) => updateFormData('numberOfCopos', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <Tabs defaultValue="tms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tms">TMS</TabsTrigger>
              <TabsTrigger value="tca">TCA</TabsTrigger>
              <TabsTrigger value="tes">TES</TabsTrigger>
            </TabsList>
            <TabsContent value="tms">{renderAssessmentContent('tms')}</TabsContent>
            <TabsContent value="tca">{renderAssessmentContent('tca')}</TabsContent>
            <TabsContent value="tes">{renderAssessmentContent('tes')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CopoAssessment;