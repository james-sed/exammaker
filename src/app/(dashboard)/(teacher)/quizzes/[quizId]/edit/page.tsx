// TODO: Implement quiz editor page (settings tab + question builder tab)
export default function EditQuizPage({
  params,
}: {
  params: { quizId: string };
}) {
  return <div>Edit Quiz {params.quizId}</div>;
}
