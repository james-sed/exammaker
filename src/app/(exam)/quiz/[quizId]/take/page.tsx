// TODO: Implement active quiz-taking interface with server-enforced countdown timer and question runner
export default function TakeQuizPage({
  params,
}: {
  params: { quizId: string };
}) {
  return <div>Take Quiz {params.quizId}</div>;
}
