'use client';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { BANK_CSV_HEADER_LINE, type BankImportResponse } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { bankingApi } from '@/features/banking/api';
import { useImportBankCsv } from '@/features/banking/hooks';

/** §26 — one normalized CSV format; result reports rows/imported/duplicates/failed + line errors. */
export default function BankImportPage() {
  const input = useRef<HTMLInputElement>(null);
  const importCsv = useImportBankCsv();
  const [result, setResult] = useState<BankImportResponse | null>(null);
  const [templateError, setTemplateError] = useState<unknown>(null);
  const t = useTranslations('banking');
  return (
    <>
      <PageHeader
        title={t('importTitle')}
        actions={
          <Button component={Link} href="/banking" variant="outlined">
            {t('toOverview')}
          </Button>
        }
      />
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {t('step1')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('expectedColumns')} <code>{BANK_CSV_HEADER_LINE}</code>. {t('formatHint')}
            </Typography>
            <ErrorAlert error={templateError} />
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => bankingApi.template().catch(setTemplateError)}
            >
              {t('template')}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {t('step2')}
            </Typography>
            <ErrorAlert error={importCsv.error} />
            <input
              ref={input}
              type="file"
              hidden
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv.mutate(f, { onSuccess: setResult });
                e.target.value = '';
              }}
            />
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => input.current?.click()}
              disabled={importCsv.isPending}
            >
              {importCsv.isPending ? t('importing') : t('chooseCsv')}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {t('uploadHint')}
            </Typography>
          </CardContent>
        </Card>
        {result && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {t('result')}
              </Typography>
              <Alert severity={result.failed > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                {t('resultLine', {
                  rows: result.rows,
                  imported: result.imported,
                  duplicates: result.duplicates,
                  failed: result.failed,
                })}
              </Alert>
              {result.errors.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('line')}</TableCell>
                      <TableCell>{t('error')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.errors.map((e) => (
                      <TableRow key={`${e.line}-${e.message}`}>
                        <TableCell>{e.line}</TableCell>
                        <TableCell>{e.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button component={Link} href="/banking?classification=UNREVIEWED" sx={{ mt: 2 }}>
                {t('reviewImported')}
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </>
  );
}
