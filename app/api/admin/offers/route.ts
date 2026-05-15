import { NextResponse } from 'next/server';

import { validateAdminOfferInput } from '@/lib/admin/offer-validation';
import {
  createAdminOffer,
  getOfferCategories,
  listAdminOffers,
} from '@/lib/db/admin-offers';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';

function handleOfferMutationError(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  ) {
    return NextResponse.json(
      {
        error: 'An offer with that slug already exists.',
        fieldErrors: { slug: 'Slug must be unique.' },
      },
      { status: 409 },
    );
  }

  const message = error instanceof Error ? error.message : 'Offer request failed.';
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const [offers, categories] = await Promise.all([
      listAdminOffers({
        query: searchParams.get('query') ?? undefined,
        status:
          (searchParams.get('status') as 'all' | 'active' | 'inactive' | null) ??
          'all',
        category: searchParams.get('category') ?? undefined,
      }),
      getOfferCategories(),
    ]);

    return NextResponse.json({ offers, categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load offers.';
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

  const validation = validateAdminOfferInput(payload);

  if (!validation.data) {
    return NextResponse.json(
      { error: 'Invalid offer input.', fieldErrors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const offer = await createAdminOffer(validation.data);
    void Promise.resolve(
      insertAnalyticsEvent('offer_created', 'admin', {
        offer_id: offer.id,
        slug: offer.slug,
        name: offer.name,
      }),
    ).catch(() => undefined);

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    return handleOfferMutationError(error);
  }
}