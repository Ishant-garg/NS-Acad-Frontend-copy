import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const Query = () => {
  const [department, setDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedQuery, setSelectedQuery] = useState('');
  const [queryResult, setQueryResult] = useState('');

  useEffect(() => {
    const dept = (localStorage.getItem('department'));
    if (dept) {
      setDepartment(dept);
    }
  }, []);

  const queryCategories = {
    'Performance Metrics': [
      'Monthly performance overview',
      'Team productivity stats',
      'Quality metrics report',
      'Efficiency analysis'
    ],
    'Employee Data': [
      'Employee count by role',
      'Attendance statistics',
      'Training completion rates',
      'Skills distribution'
    ],
    'Resource Allocation': [
      'Current resource usage',
      'Resource availability',
      'Equipment allocation',
      'Budget utilization'
    ],
    'Project Status': [
      'Ongoing projects summary',
      'Project completion rates',
      'Delayed projects report',
      'Resource bottlenecks'
    ],
    'Compliance': [
      'Compliance status report',
      'Policy adherence metrics',
      'Required certifications status',
      'Audit readiness check'
    ],
    'Operations': [
      'Operational efficiency metrics',
      'Process bottlenecks',
      'Workflow analysis',
      'System utilization stats'
    ]
  };

  const generateQueryResult = (category, query) => {
    return `Results for ${query} in ${department} department:
${Math.random() > 0.5 ? 'Positive' : 'Needs Improvement'} - Score: ${(Math.random() * 100).toFixed(1)}%`;
  };

  const handleQuery = () => {
    if (selectedCategory && selectedQuery) {
      const result = generateQueryResult(selectedCategory, selectedQuery);
      setQueryResult(result);
    }
  };

  return (
    <Card className="w-full p-6 mx-auto my-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Department Query System</h2>
          <p className="text-gray-500">Department: {department}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Category</label>
            <Select 
              onValueChange={value => {
                setSelectedCategory(value);
                setSelectedQuery('');
                setQueryResult('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(queryCategories).map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Query</label>
              <Select
                onValueChange={value => {
                  setSelectedQuery(value);
                  setQueryResult('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a query" />
                </SelectTrigger>
                <SelectContent>
                  {queryCategories[selectedCategory].map(query => (
                    <SelectItem key={query} value={query}>
                      {query}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleQuery}
            disabled={!selectedCategory || !selectedQuery}
            className="w-full"
          >
            Run Query
          </Button>

          {queryResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">Query Results:</h3>
              <p className="whitespace-pre-line">{queryResult}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Query;