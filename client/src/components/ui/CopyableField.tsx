"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

type Props = {
  value: string | number;
  maxWidth?: number | string;
  title?: string;
};

export function CopyableField({ value, maxWidth = 120, title }: Props) {
  const [copied, setCopied] = React.useState<boolean>(false);
  const display = String(value);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  }

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ maxWidth }}>
      <span title={title || display} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span>
      <Tooltip title={copied ? "Copied" : "Copy"}>
        <IconButton onClick={handleCopy} size="small" aria-label="copy">
          {copied ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}


