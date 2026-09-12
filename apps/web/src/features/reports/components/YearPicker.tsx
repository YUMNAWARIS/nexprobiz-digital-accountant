'use client';
import { MenuItem, TextField } from '@mui/material';
export const CURRENT_YEAR = new Date().getFullYear();
export function YearPicker({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  const years = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
  return (
    <TextField
      select
      size="small"
      label="Jahr"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      sx={{ minWidth: 120 }}
    >
      {years.map((y) => (
        <MenuItem key={y} value={y}>
          {y}
        </MenuItem>
      ))}
    </TextField>
  );
}
