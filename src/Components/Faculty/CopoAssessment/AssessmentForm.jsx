import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { useAssessment } from '../../../hooks/useAssessment';
import AssessmentGrid from './AssessmentGrid';
import AssessmentHeader from './AssessmentHeader';
import CoPoMappingTable from "./CoPoMappingTable";
import CoPoMappingForm from "./CoPoMappingForm";

const AssessmentForm = () => {
  const {
    formData,
    loading,
    error,
    assessmentConfig,
    studentMarks,
    students,
    getUniqueBranches,
    getSections,
    getSubjects,
    updateFormData,
    updateAssessmentQuestions,
    updateQuestionParts,
    updatePartDetails,
    updateStudentMark,
    updateStudent,
    calculateStudentTotal,
    calculateCOTotal,
    calculateMaxCOMarks
  } = useAssessment();

  if (loading) return <div className="p-6">Loading class data...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const renderAssessmentContent = (type) => (
    <div className="space-y-6">
      <AssessmentGrid
        type={type}
        config={assessmentConfig[type]}
        formData={formData}
        updateQuestionParts={updateQuestionParts}
        updatePartDetails={updatePartDetails}
        updateStudent={updateStudent}
        updateStudentMark={updateStudentMark}
        calculateStudentTotal={calculateStudentTotal}
        calculateCOTotal={calculateCOTotal}
        calculateMaxCOMarks={calculateMaxCOMarks}
      />
    </div>
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>COPO Assessment Form</CardTitle>
          <CoPoMappingTable/>
          <CoPoMappingForm/>
        </CardHeader>
        <CardContent>
          <AssessmentHeader
            formData={formData}
            getUniqueBranches={getUniqueBranches}
            getSections={getSections}
            getSubjects={getSubjects}
            updateFormData={updateFormData}
          />

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

export default AssessmentForm;
