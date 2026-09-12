import { Alert } from '@mui/material';
import { SANDBOX } from '@fa/contracts';
/** §63 — displayed permanently in the sandbox header. */
export function SandboxBanner() {
  return (
    <Alert
      severity="warning"
      variant="filled"
      square
      sx={{ borderRadius: 0, justifyContent: 'center', py: 0 }}
    >
      <strong>{SANDBOX.HEADER_WARNING}</strong>
    </Alert>
  );
}
