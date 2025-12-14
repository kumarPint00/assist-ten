import AssessmentCreationLayout from "../../../src/components/admin/AssessmentCreationLayout";
import AssessmentSetupContainer from "../../../src/containers/AssessmentSetupContainer/AssessmentSetupContainer";

export default function AssessmentPage() {
  return (
    <AssessmentCreationLayout>
      <AssessmentSetupContainer />
    </AssessmentCreationLayout>
  );
}
