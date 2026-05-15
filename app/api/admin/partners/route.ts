import { NextResponse } from 'next/server';

import { createAdminPartner, listAdminPartners } from '@/lib/db/admin-revenue';

export async function GET() {
  try {
    const partners = await listAdminPartners();
    return NextResponse.json({ partners });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load partners.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof payload.name !== 'string' || !payload.name.trim()) {
    return NextResponse.json({ error: 'Partner name is required.' }, { status: 400 });
  }

  if (typeof payload.slug !== 'string' || !payload.slug.trim()) {
    return NextResponse.json({ error: 'Partner slug is required.' }, { status: 400 });
  }

  try {
    const partner = await createAdminPartner({
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      network: typeof payload.network === 'string' ? payload.network : undefined,
      default_currency:
        typeof payload.default_currency === 'string' ? payload.default_currency : undefined,
      commission_model:
        typeof payload.commission_model === 'string' ? payload.commission_model : undefined,
    });

    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create partner.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}