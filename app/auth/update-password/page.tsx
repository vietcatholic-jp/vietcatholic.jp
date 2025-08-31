import { Suspense } from "react";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  );
}
