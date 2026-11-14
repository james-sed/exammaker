// TODO: Implement exam submission results page showing total score, breakdown, and feedback
export default function QuizResultsPage({
  params,
}: {
  params: { quizId: string; attemptId: string };
}) {
  return <div>Quiz Results {params.attemptId}</div>;
}
