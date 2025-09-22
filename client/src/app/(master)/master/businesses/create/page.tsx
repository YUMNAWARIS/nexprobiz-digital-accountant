"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createMasterBusiness, type CreateBusinessRequest } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { FormikTextField, FormActions } from "@/components/ui";

export default function CreateBusinessPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const validationSchema = Yup.object({
    name: Yup.string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(255, "Name must be at most 255 characters")
      .required("Business name is required"),
    email: Yup.string()
      .email("Invalid business email")
      .required("Business email is required"),
    user_email: Yup.string()
      .email("Invalid user email")
      .required("User email is required"),
    password: Yup.string()
      .matches(PASSWORD_REGEX, "Password must be 8+ chars, include upper, lower, digit")
      .required("Password is required"),
  });

  const formik = useFormik<CreateBusinessRequest>({
    initialValues: { name: "", email: "", user_email: "", password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSuccess(null);
      try {
        const res = await createMasterBusiness(values);
        setSuccess(res.message || "Business created successfully");
        setTimeout(() => router.push("/master/businesses"), 600);
      } catch (err: any) {
        setError(err?.message || "Failed to create business");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const submitting = formik.isSubmitting;
  const canSubmit = formik.isValid && !submitting;

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
        <div>
          <Typography variant="h5" component="h1" gutterBottom>Create Business</Typography>
          <Typography variant="body2" color="text.secondary">Provision a new business and its admin user.</Typography>
        </div>
        <Link href="/master/businesses" className="text-sm underline">Cancel</Link>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

      <form onSubmit={formik.handleSubmit}>
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
          <FormikTextField formik={formik} name="name" label="Business name" placeholder="Acme Inc" />
          <FormikTextField formik={formik} name="email" label="Business email" type="email" placeholder="contact@acme.com" autoComplete="email" />
          <FormikTextField formik={formik} name="user_email" label="Admin user email" type="email" placeholder="admin@acme.com" autoComplete="email" />
          <FormikTextField formik={formik} name="password" label="Admin password" type={showPassword ? "text" : "password"} helpText="8+ chars, include upper, lower, digit" autoComplete="new-password" />
          <Divider sx={{ my: 0.5 }} />
          <FormActions submitLabel="Create Business" submitting={submitting} canSubmit={canSubmit} backHref="/master/businesses" backLabel="Back to list" />
        </Stack>
      </form>
    </Container>
  );
}

function FormField({ label, error, help, children }: { label: string; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-800 dark:text-white-200">{label}</label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{help}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
