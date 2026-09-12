/**
 * §39 XRechnung 3.0.2 (UBL 2.1 syntax). Pure: InvoiceDocumentData → XML string.
 * Sandbox scope: structurally complete EN 16931 core with the XRechnung customization id;
 * not advertised as validator-certified (see docs/DEVIATIONS.md).
 */
import { add, moneyFromDb, toDecimal, ZERO, type Money } from '@fa/contracts';
import { create } from 'xmlbuilder2';
import type { InvoiceDocumentData } from './invoice-document-data';
import { KLEINUNTERNEHMER_TEXT } from './invoice-document-data';

export const XRECHNUNG_CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0';
export const XRECHNUNG_PROFILE_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';
export const XRECHNUNG_VERSION = '3.0.2';

const UNIT_CODES: Record<string, string> = {
  hour: 'HUR',
  stunde: 'HUR',
  h: 'HUR',
  day: 'DAY',
  tag: 'DAY',
  piece: 'C62',
  stück: 'C62',
  unit: 'C62',
  pauschal: 'LS',
};
const unitCode = (u: string) => UNIT_CODES[u.toLowerCase()] ?? 'C62';
const pct = (rate: string) =>
  toDecimal(rate as Money)
    .times(100)
    .toDecimalPlaces(2)
    .toString(); // "0.1900" → "19" (display only)

export function renderXRechnung(data: InvoiceDocumentData): string {
  const { invoice: inv, seller } = data;
  const klein = seller.vatRegime === 'KLEINUNTERNEHMER';
  const CUR = { currencyID: 'EUR' };

  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('ubl:Invoice', {
    'xmlns:ubl': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  });
  root.ele('cbc:CustomizationID').txt(XRECHNUNG_CUSTOMIZATION_ID);
  root.ele('cbc:ProfileID').txt(XRECHNUNG_PROFILE_ID);
  root.ele('cbc:ID').txt(inv.invoiceNumber ?? '');
  root.ele('cbc:IssueDate').txt(inv.issueDate ?? '');
  if (inv.dueDate) root.ele('cbc:DueDate').txt(inv.dueDate);
  root.ele('cbc:InvoiceTypeCode').txt('380');
  if (inv.notes) root.ele('cbc:Note').txt(inv.notes);
  if (klein) root.ele('cbc:Note').txt(KLEINUNTERNEHMER_TEXT);
  root.ele('cbc:DocumentCurrencyCode').txt('EUR');
  // BT-10 Buyer reference is mandatory in XRechnung; sandbox uses the client VAT id or the invoice number.
  root.ele('cbc:BuyerReference').txt(inv.clientSnapshot.vatId ?? inv.invoiceNumber ?? '');
  if (inv.serviceDate) {
    const p = root.ele('cac:InvoicePeriod');
    p.ele('cbc:StartDate').txt(inv.serviceDate);
    p.ele('cbc:EndDate').txt(inv.serviceDate);
  }

  // Seller (BG-4)
  const sp = root.ele('cac:AccountingSupplierParty').ele('cac:Party');
  if (seller.email) sp.ele('cbc:EndpointID', { schemeID: 'EM' }).txt(seller.email);
  sp.ele('cac:PartyName')
    .ele('cbc:Name')
    .txt(seller.businessName ?? seller.legalName);
  const sa = sp.ele('cac:PostalAddress');
  sa.ele('cbc:StreetName').txt(seller.address.street);
  sa.ele('cbc:CityName').txt(seller.address.city);
  sa.ele('cbc:PostalZone').txt(seller.address.postalCode);
  sa.ele('cac:Country').ele('cbc:IdentificationCode').txt(seller.address.country);
  if (seller.vatId) {
    const ts = sp.ele('cac:PartyTaxScheme');
    ts.ele('cbc:CompanyID').txt(seller.vatId);
    ts.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
  }
  if (seller.taxNumber) {
    const ts = sp.ele('cac:PartyTaxScheme');
    ts.ele('cbc:CompanyID').txt(seller.taxNumber);
    ts.ele('cac:TaxScheme').ele('cbc:ID').txt('FC');
  }
  sp.ele('cac:PartyLegalEntity').ele('cbc:RegistrationName').txt(seller.legalName);
  const sc = sp.ele('cac:Contact');
  sc.ele('cbc:Name').txt(seller.legalName);
  if (seller.phone) sc.ele('cbc:Telephone').txt(seller.phone);
  if (seller.email) sc.ele('cbc:ElectronicMail').txt(seller.email);

  // Buyer (BG-7)
  const cp = root.ele('cac:AccountingCustomerParty').ele('cac:Party');
  cp.ele('cac:PartyName')
    .ele('cbc:Name')
    .txt(inv.clientSnapshot.name ?? '');
  const ca = cp.ele('cac:PostalAddress');
  ca.ele('cbc:StreetName').txt(inv.clientSnapshot.street ?? '');
  ca.ele('cbc:CityName').txt(inv.clientSnapshot.city ?? '');
  ca.ele('cbc:PostalZone').txt(inv.clientSnapshot.postalCode ?? '');
  ca.ele('cac:Country')
    .ele('cbc:IdentificationCode')
    .txt(inv.clientSnapshot.country ?? 'DE');
  if (inv.clientSnapshot.vatId) {
    const ts = cp.ele('cac:PartyTaxScheme');
    ts.ele('cbc:CompanyID').txt(inv.clientSnapshot.vatId);
    ts.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
  }
  cp.ele('cac:PartyLegalEntity')
    .ele('cbc:RegistrationName')
    .txt(inv.clientSnapshot.name ?? '');

  // Payment information (BG-16)
  const pm = root.ele('cac:PaymentMeans');
  pm.ele('cbc:PaymentMeansCode').txt('58');
  if (inv.invoiceNumber) pm.ele('cbc:PaymentID').txt(inv.invoiceNumber);
  const acct = pm.ele('cac:PayeeFinancialAccount');
  acct.ele('cbc:ID').txt(seller.iban ?? '');
  acct.ele('cbc:Name').txt(seller.legalName);
  if (seller.bic) acct.ele('cac:FinancialInstitutionBranch').ele('cbc:ID').txt(seller.bic);
  if (inv.dueDate) root.ele('cac:PaymentTerms').ele('cbc:Note').txt(`Zahlbar bis ${inv.dueDate}`);

  // Tax total (BG-22/23) — one subtotal per treatment group, from persisted line amounts
  const groups = new Map<string, { treatment: string; rate: string; net: Money; tax: Money }>();
  for (const l of inv.lines) {
    const g = groups.get(l.taxTreatment) ?? {
      treatment: l.taxTreatment,
      rate: l.taxRate,
      net: ZERO,
      tax: ZERO,
    };
    g.net = add(g.net, moneyFromDb(l.netAmount));
    g.tax = add(g.tax, moneyFromDb(l.taxAmount));
    groups.set(l.taxTreatment, g);
  }
  const tt = root.ele('cac:TaxTotal');
  tt.ele('cbc:TaxAmount', CUR).txt(inv.taxTotal);
  for (const g of groups.values()) {
    const st = tt.ele('cac:TaxSubtotal');
    st.ele('cbc:TaxableAmount', CUR).txt(g.net);
    st.ele('cbc:TaxAmount', CUR).txt(g.tax);
    const cat = st.ele('cac:TaxCategory');
    if (g.treatment === 'KLEINUNTERNEHMER_19') {
      cat.ele('cbc:ID').txt('E');
      cat.ele('cbc:Percent').txt('0');
      cat.ele('cbc:TaxExemptionReasonCode').txt('VATEX-EU-79-C');
      cat.ele('cbc:TaxExemptionReason').txt(KLEINUNTERNEHMER_TEXT);
    } else {
      cat.ele('cbc:ID').txt('S');
      cat.ele('cbc:Percent').txt(pct(g.rate));
    }
    cat.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
  }

  // Monetary totals (BG-22)
  const lm = root.ele('cac:LegalMonetaryTotal');
  lm.ele('cbc:LineExtensionAmount', CUR).txt(inv.subtotalNet);
  lm.ele('cbc:TaxExclusiveAmount', CUR).txt(inv.subtotalNet);
  lm.ele('cbc:TaxInclusiveAmount', CUR).txt(inv.grossTotal);
  lm.ele('cbc:PayableAmount', CUR).txt(inv.grossTotal);

  // Lines (BG-25)
  for (const l of inv.lines) {
    const il = root.ele('cac:InvoiceLine');
    il.ele('cbc:ID').txt(String(l.position));
    il.ele('cbc:InvoicedQuantity', { unitCode: unitCode(l.unit) }).txt(l.quantity);
    il.ele('cbc:LineExtensionAmount', CUR).txt(l.netAmount);
    const item = il.ele('cac:Item');
    item.ele('cbc:Name').txt(l.description.slice(0, 100));
    const tc = item.ele('cac:ClassifiedTaxCategory');
    tc.ele('cbc:ID').txt(l.taxTreatment === 'KLEINUNTERNEHMER_19' ? 'E' : 'S');
    tc.ele('cbc:Percent').txt(l.taxTreatment === 'KLEINUNTERNEHMER_19' ? '0' : pct(l.taxRate));
    tc.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
    il.ele('cac:Price').ele('cbc:PriceAmount', CUR).txt(l.unitPrice);
  }

  return root.end({ prettyPrint: true });
}
