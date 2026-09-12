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
  return (
    <>
      <PageHeader
        title="Bank-CSV importieren"
        actions={
          <Button component={Link} href="/banking" variant="outlined">
            Zur Übersicht
          </Button>
        }
      />
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              1. Vorlage herunterladen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Erwartete Spalten (genau in dieser Reihenfolge): <code>{BANK_CSV_HEADER_LINE}</code>.
              Datumsformat <code>YYYY-MM-DD</code>, Beträge mit Punkt als Dezimaltrennzeichen,
              Abgänge negativ, Währung <code>EUR</code>.
            </Typography>
            <ErrorAlert error={templateError} />
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => bankingApi.template().catch(setTemplateError)}
            >
              CSV-Vorlage
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              2. Datei hochladen
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
              {importCsv.isPending ? 'Importiere…' : 'CSV auswählen'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              max. 5 MB · doppelte Zeilen werden automatisch übersprungen
            </Typography>
          </CardContent>
        </Card>
        {result && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Ergebnis
              </Typography>
              <Alert severity={result.failed > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                {result.rows} Zeilen · {result.imported} importiert · {result.duplicates} Duplikate
                · {result.failed} fehlerhaft
              </Alert>
              {result.errors.length > 0 && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Zeile</TableCell>
                      <TableCell>Fehler</TableCell>
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
                Importierte Transaktionen prüfen
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </>
  );
}
