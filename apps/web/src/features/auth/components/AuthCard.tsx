import { Box, Card, CardContent, Typography } from '@mui/material';
import { SANDBOX } from '@fa/contracts';
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="overline" color="warning.main">
            {SANDBOX.HEADER_WARNING}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 1, mb: 3 }}>
            {title}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
