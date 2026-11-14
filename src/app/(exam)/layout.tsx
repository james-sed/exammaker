// TODO: Implement distraction-free full-screen layout without sidebar/header for taking exams
export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="exam-layout">{children}</div>;
}
