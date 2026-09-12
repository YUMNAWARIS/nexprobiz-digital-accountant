'use client';
import { Card, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AUDIT_EVENT_TYPE, type AuditEventType } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { auditApi } from '@/features/audit/api';
import { useFormat } from '@/lib/format';

/** Story 15.2 — read-only. Nothing here can modify a record. */
export default function AuditPage() {
  const [eventType, setEventType] = useState<AuditEventType | ''>('');
  const [page, setPage] = useState(1);
  const t = useTranslations('audit');
  const tc = useTranslations('common');
  const { dateTime } = useFormat();
  const q = useQuery({
    queryKey: ['audit', eventType, page],
    queryFn: () => auditApi.list({ eventType: eventType || undefined, page, pageSize: 50 }),
  });
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <Stack direction="row" sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label={t('event')}
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value as AuditEventType | '');
            setPage(1);
          }}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">{tc('all')}</MenuItem>
          {AUDIT_EVENT_TYPE.map((e) => (
            <MenuItem key={e} value={e}>
              {t(e)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Card>
        <DataTable
          rows={q.data?.data ?? []}
          loading={q.isLoading}
          error={q.error}
          getRowId={(r) => r.id}
          columns={[
            { key: 'time', header: t('time'), render: (r) => dateTime(r.occurredAt) },
            { key: 'event', header: t('event'), render: (r) => t(r.eventType) },
            {
              key: 'entity',
              header: t('entity'),
              render: (r) => (
                <span title={r.entityId}>
                  {r.entityType} · {r.entityId.slice(0, 8)}
                </span>
              ),
            },
            { key: 'actor', header: t('actor'), render: (r) => r.actorEmail ?? t('system') },
            {
              key: 'meta',
              header: t('details'),
              render: (r) => (
                <code style={{ fontSize: 12 }}>{r.metadata ? JSON.stringify(r.metadata) : ''}</code>
              ),
            },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
    </>
  );
}
