"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Link from "next/link";

type Props = {
  submitLabel: string;
  submitting?: boolean;
  canSubmit?: boolean;
  backHref: string;
  backLabel?: string;
};

export function FormActions({ submitLabel, submitting, canSubmit, backHref, backLabel = "Back" }: Props) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
      <Button type="submit" variant="contained" color="primary" disabled={!canSubmit || !!submitting}>
        {submitting ? `${submitLabel}...` : submitLabel}
      </Button>
      <Button component={Link as any} href={backHref} variant="outlined" color="inherit">
        {backLabel}
      </Button>
    </Stack>
  );
}


