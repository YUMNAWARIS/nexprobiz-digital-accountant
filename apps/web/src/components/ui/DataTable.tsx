'use client';
import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { PageMeta } from '@fa/contracts';
import { ApiError } from '@/lib/api-client';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  loading,
  error,
  getRowId,
  rowHref,
  onRowClick,
  emptyText = 'Keine Einträge.',
  pagination,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: unknown;
  getRowId: (row: T) => string;
  rowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  pagination?: PageMeta & { onPageChange: (page: number) => void };
}) {
  const router = useRouter();
  const clickable = Boolean(rowHref || onRowClick);
  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align}>
                  {c.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
            {!loading && !!error && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Alert severity="error">
                    {error instanceof ApiError
                      ? `${error.message} (${error.code})`
                      : String((error as Error).message ?? error)}
                  </Alert>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{emptyText}</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((r) => (
                <TableRow
                  key={getRowId(r)}
                  hover={clickable}
                  sx={{ cursor: clickable ? 'pointer' : undefined }}
                  onClick={() => (onRowClick ? onRowClick(r) : rowHref && router.push(rowHref(r)))}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align}>
                      {c.render(r)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, p) => pagination.onPageChange(p)}
            size="small"
          />
        </Box>
      )}
    </>
  );
}
