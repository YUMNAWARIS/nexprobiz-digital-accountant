import { createHarness, type Harness } from './setup/harness';
import {
  auth,
  finalizedInvoice,
  invoice100,
  PROFILE_KLEINUNTERNEHMER,
  setupTenant,
} from './setup/fixtures';

const waitForDocs = async (h: Harness, token: string, id: string) => {
  for (let i = 0; i < 40; i++) {
    const r = await h.http.get(`/api/v1/invoices/${id}`).set(auth(token));
    if (r.body.pdfDocumentId && r.body.xrechnungDocumentId)
      return r.body as { pdfDocumentId: string; xrechnungDocumentId: string };
    await new Promise((res) => setTimeout(res, 100));
  }
  throw new Error('documents not generated');
};

describe('Epic 6 — Invoice documents (§39–§41)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(() => h.close());

  it('Story 6.1: PDF is generated after finalize, stored in blob storage, and later downloads return the stored artifact', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId);
    const inv = await waitForDocs(h, t.token, f.id);
    const docs = await h
      .adminDb('documents')
      .whereIn('id', [inv.pdfDocumentId, inv.xrechnungDocumentId]);
    expect(docs.map((d) => d.type).sort()).toEqual(['INVOICE_PDF', 'XRECHNUNG_XML']);
    expect(docs.every((d) => /^[0-9a-f]{64}$/.test(d.sha256) && d.blob_name.includes('/'))).toBe(
      true,
    );

    const pdf = await h.http.get(`/api/v1/invoices/${f.id}/pdf`).set(auth(t.token));
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.headers['content-disposition']).toContain('Rechnung-2026-000001.pdf');
    expect(
      Buffer.from(pdf.body as Buffer)
        .subarray(0, 5)
        .toString(),
    ).toBe('%PDF-');
    // second download is byte-identical → served from storage, not re-rendered
    const again = await h.http.get(`/api/v1/invoices/${f.id}/pdf`).set(auth(t.token));
    expect(Buffer.compare(Buffer.from(pdf.body as Buffer), Buffer.from(again.body as Buffer))).toBe(
      0,
    );
  });

  it('Story 6.2 / §40 fixture 1: German B2B 19% — all required values present', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId, {
      ...invoice100(t.clientId),
      lines: [
        {
          description: 'Software development services',
          quantity: '10.0000',
          unit: 'hour',
          unitPrice: '80.0000',
          taxTreatment: 'STANDARD_19',
        },
      ],
    });
    await waitForDocs(h, t.token, f.id);
    const r = await h.http
      .get(`/api/v1/invoices/${f.id}/xrechnung`)
      .set(auth(t.token))
      .buffer(true)
      .parse((res, cb) => {
        const c: Buffer[] = [];
        res.on('data', (d: Buffer) => c.push(d));
        res.on('end', () => cb(null, Buffer.concat(c)));
      });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/application\/xml/);
    const xml = (r.body as Buffer).toString('utf8');
    expect(xml).toContain('urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0');
    expect(xml).toContain('<cbc:ID>2026-000001</cbc:ID>'); // invoice number
    expect(xml).toContain('<cbc:IssueDate>2026-09-06</cbc:IssueDate>');
    expect(xml).toContain('<cbc:StartDate>2026-09-06</cbc:StartDate>'); // service date
    expect(xml).toContain('<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>');
    expect(xml).toContain('<cbc:RegistrationName>Anna Beispiel</cbc:RegistrationName>'); // supplier identity
    expect(xml).toContain('<cbc:CompanyID>DE123456789</cbc:CompanyID>');
    expect(xml).toContain('<cbc:Name>Example GmbH</cbc:Name>'); // customer identity
    expect(xml).toContain('<cbc:CompanyID>DE987654321</cbc:CompanyID>');
    expect(xml).toContain(
      '<cbc:TaxExclusiveAmount currencyID="EUR">800.00</cbc:TaxExclusiveAmount>',
    ); // net
    expect(xml).toContain('<cbc:Percent>19</cbc:Percent>'); // VAT rate
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">152.00</cbc:TaxAmount>'); // VAT amount
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">952.00</cbc:PayableAmount>'); // gross
    expect(xml).toContain('<cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>'); // payment information
    expect(xml).toContain('<cbc:ID>DE89370400440532013000</cbc:ID>');
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="HUR">10.0000</cbc:InvoicedQuantity>');
  });

  it('Story 6.2 / §40 fixture 2: Kleinunternehmer — no VAT charged, exemption information present', async () => {
    const t = await setupTenant(h, PROFILE_KLEINUNTERNEHMER);
    const f = await finalizedInvoice(h, t.token, t.clientId);
    await waitForDocs(h, t.token, f.id);
    const r = await h.http
      .get(`/api/v1/invoices/${f.id}/xrechnung`)
      .set(auth(t.token))
      .buffer(true)
      .parse((res, cb) => {
        const c: Buffer[] = [];
        res.on('data', (d: Buffer) => c.push(d));
        res.on('end', () => cb(null, Buffer.concat(c)));
      });
    const xml = (r.body as Buffer).toString('utf8');
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">0.00</cbc:TaxAmount>');
    expect(xml).toContain('<cbc:ID>E</cbc:ID>');
    expect(xml).toContain('§ 19 UStG');
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">100.00</cbc:PayableAmount>');
    expect(xml).not.toContain('<cbc:Percent>19</cbc:Percent>');
  });

  it('draft has no documents (409); cross-tenant download is 404', async () => {
    const a = await setupTenant(h);
    const d = await h.http.post('/api/v1/invoices').set(auth(a.token)).send(invoice100(a.clientId));
    expect(
      (await h.http.get(`/api/v1/invoices/${d.body.id}/pdf`).set(auth(a.token))).body.code,
    ).toBe('INVOICE_NOT_FINALIZED');
    const b = await setupTenant(h);
    const f = await finalizedInvoice(h, b.token, b.clientId);
    await waitForDocs(h, b.token, f.id);
    expect((await h.http.get(`/api/v1/invoices/${f.id}/pdf`).set(auth(a.token))).status).toBe(404);
  });
});
