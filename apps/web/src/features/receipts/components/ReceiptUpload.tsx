'use client';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { RECEIPT_MIME_TYPES } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useUploadReceipt } from '../hooks';

/** §24 — POST /receipts (multipart), then navigate to the review page which polls OCR. */
export function ReceiptUpload() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadReceipt();
  const router = useRouter();
  const t = useTranslations('receipts');
  return (
    <>
      <ErrorAlert error={upload.error} />
      <input
        ref={input}
        type="file"
        hidden
        accept={RECEIPT_MIME_TYPES.join(',')}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload.mutate(f, { onSuccess: (r) => router.push(`/receipts/${r.id}`) });
          e.target.value = '';
        }}
      />
      <Button
        variant="contained"
        startIcon={<UploadFileIcon />}
        onClick={() => input.current?.click()}
        disabled={upload.isPending}
      >
        {t('upload')}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        {t('uploadHint')}
      </Typography>
    </>
  );
}
