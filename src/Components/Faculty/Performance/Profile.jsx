import  { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Building2, 
  Mail, 
  UserCircle,
  PlusCircle,
  X,
  GraduationCap,
  Trash2
} from 'lucide-react';
import { fetchUserData } from '../../../utils/auth';
import api from '../../../utils/api';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, classId: null });

  const getUserData = async () => {
    const user = await fetchUserData();
    setUserData(user);
  };

  useEffect(() => {
    getUserData();
  }, []);

  const handleDeleteClass = async (classId) => {
    try {
      console.log({
        classId,
        userId: userData._id
      })
      await api.delete('/auth/deleteClass', {
        data: { classId, userId: userData._id } 
      });
      await getUserData();
      setDeleteConfirmation({ show: false, classId: null });
    } catch (error) {
      console.error("Error deleting class", error);
    }
  };
  
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <UserCircle className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{userData.fullname}</h1>
              <p className="text-gray-500 flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {userData.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{userData.department}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">{userData.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Classes You Teach</h2>
            </div>
            <button 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData.classes.map((c, index) => (
              <div 
                key={index}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 mb-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{c.branch}</h3>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmation({ show: true, classId: c._id })}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-600">Section: {c.section}</p>
                <p className="text-gray-600">Batch: {c.year}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      <AddClassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId={userData._id}
        onClassAdded={getUserData}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Delete</h2>
            <p className='my-2'>Are you sure you want to delete  
            this action cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                onClick={() => handleDeleteClass(deleteConfirmation.classId)}
              >
                Delete
              </button>
              <button 
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setDeleteConfirmation({ show: false, classId: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddClassModal = ({ isOpen, onClose, userId, onClassAdded }) => {
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('');
  const [subjects, setSubjects] = useState([{ code: '', name: '' }]);

  const branches = ["CSE", "ECE", "ME", "Civil"];
  const sections = ["1", "2", "3"];
  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  const addSubject = () => {
    setSubjects([...subjects, { code: '', name: '' }]);
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index][field] = value;
    setSubjects(updatedSubjects);
  };

  const removeSubject = (index) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };


  const handleAddClass = async () => {
    try {
      const filteredSubjects = subjects.filter(s => s.code && s.name);
      await api.post('/auth/addClass', { userId, branch, section, year, subjects: filteredSubjects });
      await onClassAdded();
      onClose();
    } catch (error) {
      console.error("Error adding class", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Class</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)}
               className="block w-full px-3 py-2 text-black bg-blue-100 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            >
              <option value="">Select Branch</option>
              {branches.map((b) => <option key={b} value={b} className="text-black bg-gray-100">{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select 
              value={section} 
              onChange={(e) => setSection(e.target.value)}
              className="block w-full px-3 py-2 text-black bg-blue-100 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"

            >
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s} value={s} className="text-black bg-gray-100">{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="block w-full px-3 py-2 text-black bg-blue-100 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"

            >
              <option value="">Select Year</option>
              {years.map((y) => <option key={y} value={y} className="text-black bg-gray-100">{y}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-700">Subjects</h3>
            <button 
              type="button"
              onClick={addSubject}
              className="text-blue-600 hover:text-blue-800"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          {subjects.map((subject, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Code (e.g. CS101)"
                value={subject.code}
                onChange={(e) => handleSubjectChange(index, 'code', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Subject Name"
                value={subject.name}
                onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                className="flex-2 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeSubject(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button 
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            onClick={handleAddClass}
          >
            Save Class
          </button>
          <button 
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


export default Profile;