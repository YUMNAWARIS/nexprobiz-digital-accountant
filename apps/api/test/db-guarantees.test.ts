/** The database enforcement objects the plan relies on (§3 "Beyond the literal spec"). */
import { createHarness, type Harness } from './setup/harness';

describe('database guarantees', () => {
  let h: Harness;
  let tenantId: string;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
    const [t] = await h.adminDb('tenants').insert({ name: 't' }).returning<{ id: string }[]>('id');
    tenantId = t!.id;
  });
  afterAll(() => h.close());

  it('audit_events rejects UPDATE and DELETE (§11.25)', async () => {
    await h.adminDb.raw("select set_config('app.tenant_id', ?, false)", [tenantId]);
    const [ev] = await h
      .adminDb('audit_events')
      .insert({
        tenant_id: tenantId,
        event_type: 'X',
        entity_type: 'Y',
        entity_id: tenantId,
      })
      .returning<{ id: string }[]>('id');
    await expect(
      h.adminDb('audit_events').where({ id: ev!.id }).update({ event_type: 'Z' }),
    ).rejects.toThrow(/AUDIT_EVENTS_APPEND_ONLY/);
    await expect(h.adminDb('audit_events').where({ id: ev!.id }).delete()).rejects.toThrow(
      /AUDIT_EVENTS_APPEND_ONLY/,
    );
  });

  it('journal entry must balance at COMMIT (§11.21)', async () => {
    await expect(
      h.adminDb.transaction(async (trx) => {
        await trx.raw("select set_config('app.tenant_id', ?, true)", [tenantId]);
        const [je] = await trx('journal_entries')
          .insert({
            tenant_id: tenantId,
            source_type: 'INVOICE',
            source_id: tenantId,
            posting_date: '2026-01-01',
            description: 'x',
            status: 'POSTED',
          })
          .returning<{ id: string }[]>('id');
        await trx('journal_lines').insert([
          {
            journal_entry_id: je!.id,
            account_number: '1400',
            direction: 'DEBIT',
            amount: '119.00',
          },
          {
            journal_entry_id: je!.id,
            account_number: '8400',
            direction: 'CREDIT',
            amount: '100.00',
          },
        ]);
      }),
    ).rejects.toThrow(/JOURNAL_UNBALANCED/);
  });

  it('RLS: runtime role without app.tenant_id sees nothing; with the wrong tenant sees nothing', async () => {
    await h.adminDb.raw("select set_config('app.tenant_id', ?, false)", [tenantId]);
    await h.adminDb('clients').insert({ tenant_id: tenantId, name: 'Example GmbH' });

    const none = await h.db('clients').count<{ count: string }[]>('* as count').first();
    expect(Number(none?.count)).toBe(0);

    const other = await h.db.transaction(async (trx) => {
      await trx.raw("select set_config('app.tenant_id', ?, true)", [
        '00000000-0000-0000-0000-000000000000',
      ]);
      return trx('clients').count<{ count: string }[]>('* as count').first();
    });
    expect(Number(other?.count)).toBe(0);

    const mine = await h.db.transaction(async (trx) => {
      await trx.raw("select set_config('app.tenant_id', ?, true)", [tenantId]);
      return trx('clients').count<{ count: string }[]>('* as count').first();
    });
    expect(Number(mine?.count)).toBe(1);
  });

  it('RLS WITH CHECK: runtime role cannot insert a row for another tenant', async () => {
    await expect(
      h.db.transaction(async (trx) => {
        await trx.raw("select set_config('app.tenant_id', ?, true)", [tenantId]);
        await trx('clients').insert({
          tenant_id: '00000000-0000-0000-0000-000000000000',
          name: 'evil',
        });
      }),
    ).rejects.toThrow(/row-level security/);
  });
});
