"use client";

import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: "left" | "center" | "right" | "inherit" | "justify";
  render?: (row: T) => React.ReactNode;
};

type Pagination = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

type Props<T> = {
  title?: string;
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
  loading?: boolean;
  error?: string | null;
  pagination?: Pagination;
};

export function DataTable<T extends Record<string, any>>({
  title,
  columns,
  rows,
  emptyLabel = "No data",
  loading,
  error,
  pagination,
}: Props<T>) {
  return (
    <Paper variant="outlined" sx={{ width: "100%" }}>
      {title ? (
        <Typography variant="subtitle1" sx={{ px: 2, pt: 1.5 }}>{title}</Typography>
      ) : null}

      <TableContainer>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={String(col.key)} align={col.align} sx={{ width: col.width }}>{col.header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary">Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={idx} hover>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} align={col.align}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination ? (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Page {pagination.page} of {pagination.totalPages}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={pagination.onPrev} disabled={pagination.page <= 1}>Prev</Button>
              <Button size="small" variant="outlined" onClick={pagination.onNext} disabled={pagination.page >= pagination.totalPages}>Next</Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}


