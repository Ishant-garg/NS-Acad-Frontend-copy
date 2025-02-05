import React from 'react';
import AssessmentForm from '../../../Components/Faculty/CopoAssessment/AssessmentForm';

const CoAnalysis = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">COPO Assessment</h1>
        <AssessmentForm />
      </div>
    </div>
  );
};

export default CoAnalysis;