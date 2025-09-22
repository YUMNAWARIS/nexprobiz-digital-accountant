"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { getBusinessSettings, updateBusinessSettings } from "@/services/api/index";
import { FormikTextField } from "@/components/ui";
import { useFormik } from "formik";

type KV = { key: string; value: string };

export default function MasterBusinessSettingsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const businessId = useMemo(() => params?.id, [params]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const formik = useFormik<{ default_timezone: string }>({
        initialValues: { default_timezone: "" },
        onSubmit: async (values) => {
            if (!businessId) return;
            setSaving(true);
            try {
                await updateBusinessSettings(businessId, { settings: { default_timezone: values.default_timezone || "" } });
                setSuccess("Settings saved");
            } catch (err: any) {
                setError(err?.message || "Failed to save settings");
            } finally {
                setSaving(false);
            }
        },
    });

    useEffect(() => {
        let active = true;
        (async () => {
            if (!businessId) return;
            setLoading(true);
            try {
                const res = await getBusinessSettings(businessId);
                if (!active) return;
                formik.setValues({ default_timezone: String((res as any).default_timezone || "") }, false);
                setError(null);
            } catch (err: any) {
                if (!active) return;
                setError(err?.message || "Failed to fetch settings");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
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
        <Container maxWidth="lg" sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <div>
                    <Typography variant="h5">Business Settings</Typography>
                    <Typography variant="body2" color="text.secondary">Manage business settings.</Typography>
                </div>
                <Stack direction="row" spacing={1}>
                    {headerActions}
                </Stack>
            </Stack>



            <form onSubmit={formik.handleSubmit}>
                <>
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="h6">Configuration</Typography>
                                    <Button variant="contained" onClick={() => formik.submitForm()} disabled={saving || loading}>Save</Button>
                                </Stack>
                                <Divider />
                                <FormikTextField formik={formik} name="default_timezone" label="Default Timezone" placeholder="PKT" />

                            </Stack>
                        </CardContent>
                    </Card>

                </>
            </form>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert severity="error" variant="filled" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>
            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess(null)}>
                <Alert severity="success" variant="filled" onClose={() => setSuccess(null)}>{success}</Alert>
            </Snackbar>
        </Container>
    );
}

