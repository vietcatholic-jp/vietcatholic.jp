"use client";

import { EditRegistrationForm } from "@/components/registration/edit-registration-form";
import { Registration } from "@/lib/types";
import { useRouter } from "next/navigation";

interface EditRegistrationWrapperProps {
  registration: Registration;
}

export function EditRegistrationWrapper({ registration }: EditRegistrationWrapperProps) {
  const router = useRouter();

  const handleSave = () => {
    // Redirect back to dashboard after successful save
    router.push('/dashboard');
  };

  const handleCancel = () => {
    // Redirect back to dashboard if user cancels
    router.push('/dashboard');
  };

  return (
    <EditRegistrationForm 
      registration={registration}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
