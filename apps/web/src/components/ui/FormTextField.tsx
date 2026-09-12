'use client';
import { TextField, type TextFieldProps } from '@mui/material';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

/** RHF + MUI binding. Empty strings become null for optional fields when `nullable`. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  nullable,
  ...props
}: { control: Control<T>; name: FieldPath<T>; nullable?: boolean } & Omit<TextFieldProps, 'name'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ''}
          onChange={(e) =>
            field.onChange(nullable && e.target.value === '' ? null : e.target.value)
          }
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? props.helperText}
          fullWidth
        />
      )}
    />
  );
}
