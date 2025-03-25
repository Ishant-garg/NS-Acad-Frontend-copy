import React from 'react';

const AssessmentHeader = ({ formData, getUniqueBranches, getSections, getSubjects, updateFormData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium mb-1">Branch</label>
        <select 
          className="w-full bg-white p-2 border rounded"
          value={formData.branch}
          onChange={(e) => updateFormData('branch', e.target.value)}
        >
          <option value="">Select Branch</option>
          { getUniqueBranches().map(branch => (
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
        <label className="block text-sm font-medium mb-1">Subject</label>
        <select
          className="w-full bg-white p-2 border rounded"
          value={formData.subjectCode}
          onChange={(e) => updateFormData('subjectCode', e.target.value)}
          disabled={!formData.branch || !formData.section}
        >
          <option value="">Select Subject</option>
          {formData.branch && formData.section && 
            getSubjects(formData.branch, formData.section).map(subject => (
              <option key={subject.code} value={subject.code}>
                {subject.code} - {subject.name}
              </option>
            ))
          }
        </select>
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
  );
};

export default AssessmentHeader;
