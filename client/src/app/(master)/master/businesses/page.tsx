"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMasterBusinesses, type Business } from "@/services/api";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { DataTable, type Column, CopyableField } from "@/components/ui";
import { timingFunction } from "@/utils";

export default function MasterBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getMasterBusinesses({ page, limit, search: searchQuery || undefined });
        if (!isMounted) return;
        setBusinesses(res.data || []);
        setTotalPages(res.meta?.total_pages || 1);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load businesses");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [page, limit, searchQuery]);

  // Debounce search input to avoid frequent requests
  const debouncedSetQuery = React.useMemo(() => timingFunction((value: string) => {
    setSearchQuery(value);
  }, 500), []);

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  const columns: Column<Business & { created_at: string; updated_at: string }>[]= [
    { key: "id", header: "Id", width: 140, render: (r) => <CopyableField value={r.id} maxWidth={120} /> },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "created_at", header: "Created At", render: (r) => formatDate(r.created_at) },
    { key: "updated_at", header: "Updated At", render: (r) => formatDate(r.updated_at) },
    {
      key: "actions",
      header: "Action",
      width: 160,
      render: (b) => (
        <div className="flex items-center gap-2">
          <IconLink href={`/master/businesses/${b.id}`} title="View details" type="eye" />
          <IconLink href={`/master/businesses/${b.id}/settings`} title="Business settings" type="gear" />
          <IconLink href={`/master/businesses/${b.id}/edit`} title="Edit business" type="edit" />
        </div>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <div>
          <Typography variant="h5" component="h1">Businesses</Typography>
          <Typography variant="body2" color="text.secondary">Manage registered businesses here.</Typography>
        </div>
        <Link href="/master/businesses/create" className="inline-flex items-center rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90">
          Create New Business Account
        </Link>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search by name or email"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => { const v = e.target.value; setPage(1); setSearch(v); debouncedSetQuery(v); }}
          fullWidth
        />
      </Stack>

      <DataTable
        title={undefined}
        columns={columns}
        rows={businesses}
        loading={loading}
        error={error}
        emptyLabel="No businesses found"
        pagination={{
          page,
          totalPages,
          onPrev: () => setPage((p) => Math.max(1, p - 1)),
          onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
        }}
      />
    </Container>
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

function IconLink({ href, title, type }: { href: string; title: string; type: "eye" | "gear" | "edit" }) {
  return (
    <Link
      href={href}
      title={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
      aria-label={title}
    >
      {type === "eye" ? (
        <span aria-hidden>👁️</span>
      ) : type === "gear" ? (
        <span aria-hidden>⚙️</span>
      ) : (
        <span aria-hidden>✏️</span>
      )}
    </Link>
  );
}



