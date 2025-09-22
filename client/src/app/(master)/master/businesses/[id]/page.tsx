"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import Link from "next/link";
import { CopyableField } from "@/components/ui";
import { getMasterBusiness, type Business } from "@/services/api";

export default function MasterBusinessDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const businessId = useMemo(() => params?.id, [params]);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!businessId) return;
      setLoading(true);
      try {
        const res = await getMasterBusiness(businessId);
        if (!active) return;
        setBusiness(res.business);
        setError(null);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to fetch business");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [businessId]);

  const headerActions = (
    <Stack direction="row" spacing={1}>
      {business && (
        <>
          <Link href={`/master/businesses`} className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm hover:opacity-90">
            Back to list
          </Link>
          <Link href={`/master/businesses/${business.id}/edit`} className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm hover:opacity-90">
            Edit
          </Link>
          <Link href={`/master/businesses/${business.id}/settings`} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Settings
          </Link>
          
        </>
      )}
    </Stack>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <div>
          <Typography variant="h5" component="h1">{business?.name || "Business Details"}</Typography>
          <Typography variant="body2" color="text.secondary">Overview of the business profile and key attributes.</Typography>
        </div>
        {headerActions}
      </Stack>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onBack={() => router.back()} />
      ) : business ? (
        <DetailsContent business={business} />
      ) : (
        <ErrorState message="Business not found" onBack={() => router.back()} />
      )}
    </Container>
  );
}

function DetailsContent({ business }: { business: Business }) {
  const data = business.data || {};
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid sx={{ xs: 12, md: 8 }}>
              <Stack spacing={1}>
                <Typography variant="h6">General</Typography>
                <KeyValue label="Business ID" value={<CopyableField value={String(business.id)} maxWidth={260} />} />
                <KeyValue label="Name" value={business.name} />
                <KeyValue label="Email" value={business.email} />
                <KeyValue label="Created" value={formatDate(business.created_at)} />
                <KeyValue label="Updated" value={formatDate(business.updated_at)} />
              </Stack>
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Stack spacing={1}>
                <Typography variant="h6">Classification</Typography>
                <KeyValue label="Industry" value={data.industry || "-"} />
                <KeyValue label="Business Type" value={data.business_type || "-"} />
                <KeyValue label="MCC" value={data.mcc || "-"} />
                <KeyValue label="Country" value={data.country || "-"} />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Legal Identity</Typography>
              <KeyValue label="Legal Name" value={data.legal_name || "-"} />
              <KeyValue label="Registration No." value={data.registration_no || "-"} />
              <AddressBlock title="Legal Address" address={data.legal_address} />
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Doing Business As (DBA)</Typography>
              <KeyValue label="DBA Name" value={data.dba_name || "-"} />
              <AddressBlock title="DBA Address" address={data.dba_address} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Product / Service Details</Typography>
          <Typography variant="body2" color="text.secondary">
            {data.product_service_details || "-"}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>{label}</Typography>
      <Divider orientation="vertical" flexItem />
      <Box sx={{ flex: 1 }}>
        {typeof value === "string" ? <Typography variant="body1">{value}</Typography> : value}
      </Box>
    </Stack>
  );
}

function AddressBlock({ title, address }: { title: string; address?: { line1?: string; line2?: string; zip?: string; city?: string; country?: string } }) {
  const hasAny = address && (address.line1 || address.line2 || address.zip || address.city || address.country);
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      {hasAny ? (
        <>
          {address?.line1 && <Typography variant="body2">{address.line1}</Typography>}
          {address?.line2 && <Typography variant="body2">{address.line2}</Typography>}
          {(address?.city || address?.zip) && (
            <Typography variant="body2">{[address?.city, address?.zip].filter(Boolean).join(", ")}</Typography>
          )}
          {address?.country && <Typography variant="body2">{address.country}</Typography>}
        </>
      ) : (
        <Typography variant="body2">-</Typography>
      )}
    </Stack>
  );
}

function LoadingSkeleton() {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid sx={{ xs: 12, md: 8 }}>
              <Skeleton variant="text" width={200} height={28} />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="text" width={i % 2 === 0 ? 320 : 240} />
              ))}
            </Grid>
            <Grid sx={{ xs: 12, md: 4 }}>
              <Skeleton variant="text" width={180} height={28} />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="text" width={i % 2 === 0 ? 220 : 160} />
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card variant="outlined"><CardContent><Skeleton variant="text" width={200} height={28} /><Skeleton variant="text" width={320} /></CardContent></Card>
        </Grid>
        <Grid sx={{ xs: 12, md: 6 }}>
          <Card variant="outlined"><CardContent><Skeleton variant="text" width={200} height={28} /><Skeleton variant="text" width={320} /></CardContent></Card>
        </Grid>
      </Grid>
      <Card variant="outlined"><CardContent><Skeleton variant="text" width={240} height={28} /><Skeleton variant="text" width={480} /></CardContent></Card>
    </Stack>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="body1" color="error">{message}</Typography>
      <Button variant="outlined" onClick={onBack}>Go Back</Button>
    </Stack>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}


