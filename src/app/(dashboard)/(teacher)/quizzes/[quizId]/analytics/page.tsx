// TODO: Implement quiz analytics dashboard (score distribution, question difficulty breakdown)
export default function QuizAnalyticsPage({
  params,
}: {
  params: { quizId: string };
}) {
  return <div>Quiz Analytics {params.quizId}</div>;
}
