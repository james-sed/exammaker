import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create an Account | ExamMaker",
  description: "Sign up for ExamMaker as a teacher or student",
};

export default function RegisterPage() {
  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Choose your role and start crafting or taking quizzes in seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
