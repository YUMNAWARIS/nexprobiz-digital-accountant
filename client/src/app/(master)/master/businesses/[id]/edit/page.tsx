"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMasterBusiness, updateMasterBusiness, type UpdateBusinessRequest } from "@/services/api";
import { useFormik } from "formik";
import * as Yup from "yup";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { FormikTextField, FormActions } from "@/components/ui";

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = (params?.id as string) || "";
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    password: Yup.string()
      .matches(PASSWORD_REGEX, "Password must be 8+ chars, include upper, lower, digit")
      .notRequired(),
  });

  const formik = useFormik<UpdateBusinessRequest>({
    initialValues: { name: "", email: "", password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSuccess(null);
      try {
        const payload: UpdateBusinessRequest = { name: values.name, email: values.email };
        if (values.password) payload.password = values.password;
        const res = await updateMasterBusiness(businessId, payload);
        setSuccess(res.message || "Business updated successfully");
        setTimeout(() => router.push("/master/businesses"), 600);
      } catch (err: any) {
        setError(err?.message || "Failed to update business");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const submitting = formik.isSubmitting;
  const canSubmit = formik.isValid && !submitting;

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!businessId) return;
      setLoading(true);
      try {
        const res = await getMasterBusiness(businessId);
        if (!isMounted) return;
        formik.setValues({ name: res.business.name, email: res.business.email, password: "" }, false);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load business");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const headerActions = (
    <Stack direction="row" spacing={1}>
      {businessId && (
        <>
          <Link href={`/master/businesses`} className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm hover:opacity-90">
            Back to list
          </Link>
          <Link href={`/master/businesses/${businessId}`} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Details
          </Link>

        </>
      )}
    </Stack>
  );


  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
        <div>
          <Typography variant="h5" component="h1" gutterBottom>Edit Business</Typography>
          <Typography variant="body2" color="text.secondary">Update business name, email, and optionally reset the admin password.</Typography>
        </div>
        {headerActions}
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

      <form onSubmit={formik.handleSubmit}>
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
          <FormikTextField formik={formik} name="name" label="Business name" placeholder="Acme Inc" />
          <FormikTextField formik={formik} name="email" label="Business email" type="email" placeholder="contact@acme.com" autoComplete="email" />
          <FormikTextField formik={formik} name="password" label="Admin password (optional)" type="password" helpText="Leave blank to keep unchanged" autoComplete="new-password" />
          <Divider sx={{ my: 0.5 }} />
          <FormActions submitLabel="Save Changes" submitting={submitting} canSubmit={canSubmit} backHref="/master/businesses" backLabel="Back to list" />
        </Stack>
      </form>
    </Container>
  );
}
