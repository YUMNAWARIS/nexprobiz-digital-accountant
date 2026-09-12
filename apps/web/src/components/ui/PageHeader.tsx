import { Box, Stack, Typography } from '@mui/material';
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
