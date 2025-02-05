import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useAssessment = () => {
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
    assessmentConfig[type].questions.forEach((question) => {
      question.parts.forEach((part) => {
        if (part.selectedCO === `CO${coNumber}`) {
          total += parseInt(part.maxMarks) || 0;
        }
      });
    });
    return total;
  };

  return {
    formData,
    loading,
    error,
    assessmentConfig,
    studentMarks,
    students,
    getUniqueBranches,
    getSections,
    updateFormData,
    updateAssessmentQuestions,
    updateQuestionParts,
    updatePartDetails,
    updateStudentMark,
    updateStudent,
    calculateStudentTotal,
    calculateCOTotal,
    calculateMaxCOMarks
  };
};