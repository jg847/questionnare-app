import { NextResponse } from 'next/server';

import { validateAdminOfferInput } from '@/lib/admin/offer-validation';
import { getAdminOfferById, updateAdminOffer } from '@/lib/db/admin-offers';
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const offer = await getAdminOfferById(params.id);

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load offer.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
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
    const existingOffer = await getAdminOfferById(params.id);

    if (!existingOffer) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
    }

    const offer = await updateAdminOffer(params.id, validation.data);
    const eventName = !offer.is_active && existingOffer.is_active
      ? 'offer_deactivated'
      : 'offer_updated';

    void Promise.resolve(
      insertAnalyticsEvent(eventName, 'admin', {
        offer_id: offer.id,
        slug: offer.slug,
        name: offer.name,
        is_active: offer.is_active,
      }),
    ).catch(() => undefined);

    return NextResponse.json({ offer });
  } catch (error) {
    return handleOfferMutationError(error);
  }
}