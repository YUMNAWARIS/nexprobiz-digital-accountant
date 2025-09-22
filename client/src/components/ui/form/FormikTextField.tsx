"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";
import FormHelperText from "@mui/material/FormHelperText";
import Box from "@mui/material/Box";
import type { FormikProps } from "formik";

type Props = {
  formik: FormikProps<any>;
  name: string;
  label: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder?: string;
  helpText?: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function FormikTextField({ formik, name, label, type = "text", placeholder, helpText, autoComplete, disabled=false }: Props) {
  const error = Boolean((formik.touched as any)[name] && (formik.errors as any)[name]);
  const helper = ((formik.touched as any)[name] && (formik.errors as any)[name]) || helpText || "";

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        label={label}
        name={name}
        type={type}
        placeholder={placeholder}
        value={(formik.values as any)[name] ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={error}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      {helper ? (
        <FormHelperText error={error}>{helper}</FormHelperText>
      ) : null}
    </Box>
  );
}


