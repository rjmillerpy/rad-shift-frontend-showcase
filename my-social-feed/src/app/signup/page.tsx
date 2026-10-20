import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

// AuthForm reads ?redirect= via useSearchParams, which Next requires to sit
// inside a Suspense boundary so the rest of the page can be prerendered.
export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
