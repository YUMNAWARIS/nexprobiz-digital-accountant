'use client';
import { MenuItem, TextField } from '@mui/material';
import { useTranslations } from 'next-intl';
export const CURRENT_YEAR = new Date().getFullYear();
export function YearPicker({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  const t = useTranslations('reports');
  const years = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
  return (
    <TextField
      select
      size="small"
      label={t('year')}
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
