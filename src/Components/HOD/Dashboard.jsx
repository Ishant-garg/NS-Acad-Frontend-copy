import  { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from '../../utils/api';
import { fetchUserData } from '../../utils/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const [department, setDepartment] = useState('');
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userData = await fetchUserData();
        setUserData(userData);
        const dept = userData.department;
        if (dept) {
          setDepartment(dept);
          await fetchFacultyData(dept);
        }
      } catch (err) {
        setError('Failed to fetch initial data');
        console.error('Initial data fetch error:', err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchFacultyData = async (department) => {
    setLoading(true);
    try {
      const response = await api.post(`/read/faculty/list`, { department });
      if (response.statusText !== "OK") {
        throw new Error('Failed to fetch faculty data');
      }
      const data = await response.data;
      setFacultyData(data);
    } catch (err) {
      setError('Failed to fetch faculty data');
      console.error('Faculty data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyClick = (userId) => {
    navigate(`/faculty/${userId}`);
  };

  const displayColumns = ['fullname', 'email', 'username'];

  return (
    <div className="flex-1 p-8 mt-[10vh] bg-gradient-to-b from-blue-50 to-blue-100 min-h-[90vh]">
      <Card className="w-full bg-white shadow-xl border-blue-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Faculty Dashboard</h2>
                <p className="text-blue-100 text-sm mt-1">Department: {department}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <Filter className="w-4 h-4" />
              <span>{facultyData.length} Faculty Members</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {loading && (
            <div className="text-center text-blue-600 py-4">
              Loading faculty data...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 mb-4">
              {error}
            </div>
          )}

          {facultyData.length > 0 && (
            <div className="rounded-md border border-blue-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    {displayColumns.map((column) => (
                      <TableHead
                        key={column}
                        className="text-blue-700 font-semibold"
                      >
                        {column.charAt(0).toUpperCase() + column.slice(1)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyData.map((faculty, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => handleFacultyClick(faculty._id)}
                    >
                      {displayColumns.map((column) => (
                        <TableCell
                          key={column}
                          className="text-blue-900"
                        >
                          {faculty[column] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && facultyData.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No faculty data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;