"use client";

import { useEffect, useState } from "react";
import { getMasterStats, type MasterStatsResponse } from "@/services/api";

export default function MasterHome() {
  const [data, setData] = useState<MasterStatsResponse["stats"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getMasterStats();
        if (isMounted) setData(res.stats);
      } catch (err: any) {
        if (isMounted) setError(err?.message || "Failed to load stats");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-0">
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Welcome to the master dashboard.</p>

      {loading && (
        <div className="text-sm text-gray-500">Loading stats...</div>
      )}

      {error && !loading && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={data.users.total} subtitle="All user accounts" />
          <StatCard title="Active Users" value={data.users.active} subtitle="Can sign in" />
          <StatCard title="Inactive Users" value={data.users.inactive} subtitle="Disabled accounts" />
          <StatCard title="Blocked Users" value={data.users.blocked} subtitle="Access blocked" />
          <StatCard title="Deleted Users" value={data.users.deleted} subtitle="Soft-deleted" />
          <StatCard title="Locked Users" value={data.users.locked} subtitle="Temporarily locked" />
          <StatCard title="Businesses" value={data.businesses} subtitle="Total businesses" />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="text-xs uppercase text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-2">{subtitle}</div> : null}
    </div>
  );
}


