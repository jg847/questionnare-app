/** @jest-environment node */

jest.mock('@/lib/db/admin-offers', () => ({
  createAdminOffer: jest.fn(),
  getAdminOfferById: jest.fn(),
  getOfferCategories: jest.fn(),
  listAdminOffers: jest.fn(),
  updateAdminOffer: jest.fn(),
}));

jest.mock('@/lib/db/chat-repository', () => ({
  insertAnalyticsEvent: jest.fn(),
}));

import { GET as listGet, POST as createPost } from '@/app/api/admin/offers/route';
import { GET as detailGet, PATCH as patchOffer } from '@/app/api/admin/offers/[id]/route';
import {
  createAdminOffer,
  getAdminOfferById,
  getOfferCategories,
  listAdminOffers,
  updateAdminOffer,
} from '@/lib/db/admin-offers';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';

const mockedCreateAdminOffer = jest.mocked(createAdminOffer);
const mockedGetAdminOfferById = jest.mocked(getAdminOfferById);
const mockedGetOfferCategories = jest.mocked(getOfferCategories);
const mockedListAdminOffers = jest.mocked(listAdminOffers);
const mockedUpdateAdminOffer = jest.mocked(updateAdminOffer);
const mockedInsertAnalyticsEvent = jest.mocked(insertAnalyticsEvent);

const detail = {
  id: 'offer-1',
  name: 'TaskFlow',
  slug: 'taskflow',
  description: 'Project management',
  category: 'project-management',
  tags: ['planning'],
  affiliate_url: 'https://example.com/taskflow',
  logo_url: undefined,
  pricing_model: 'subscription',
  commission_info: undefined,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('admin offers routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists offers with categories', async () => {
    mockedListAdminOffers.mockResolvedValue([
      {
        id: 'offer-1',
        name: 'TaskFlow',
        slug: 'taskflow',
        category: 'project-management',
        pricing_model: 'subscription',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
    ]);
    mockedGetOfferCategories.mockResolvedValue(['project-management']);

    const response = await listGet(new Request('http://localhost/api/admin/offers?status=all'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      offers: [
        expect.objectContaining({
          id: 'offer-1',
          slug: 'taskflow',
        }),
      ],
      categories: ['project-management'],
    });
  });

  it('creates an offer and emits analytics', async () => {
    mockedCreateAdminOffer.mockResolvedValue(detail);
    mockedInsertAnalyticsEvent.mockResolvedValue(undefined);

    const response = await createPost(
      new Request('http://localhost/api/admin/offers', {
        method: 'POST',
        body: JSON.stringify({
          ...detail,
          tags: 'planning',
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedInsertAnalyticsEvent).toHaveBeenCalledWith(
      'offer_created',
      'admin',
      expect.objectContaining({ offer_id: 'offer-1' }),
    );
  });

  it('rejects duplicate slugs cleanly', async () => {
    mockedCreateAdminOffer.mockRejectedValue({ code: '23505' });

    const response = await createPost(
      new Request('http://localhost/api/admin/offers', {
        method: 'POST',
        body: JSON.stringify({
          ...detail,
          tags: 'planning',
        }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it('loads offer detail for edit flows', async () => {
    mockedGetAdminOfferById.mockResolvedValue(detail);

    const response = await detailGet(new Request('http://localhost/api/admin/offers/offer-1'), {
      params: { id: 'offer-1' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ offer: detail });
  });

  it('updates an offer and emits deactivation analytics when active status is turned off', async () => {
    mockedGetAdminOfferById.mockResolvedValueOnce(detail);
    mockedUpdateAdminOffer.mockResolvedValue({ ...detail, is_active: false });
    mockedInsertAnalyticsEvent.mockResolvedValue(undefined);

    const response = await patchOffer(
      new Request('http://localhost/api/admin/offers/offer-1', {
        method: 'PATCH',
        body: JSON.stringify({
          ...detail,
          tags: 'planning',
          is_active: false,
        }),
      }),
      {
        params: { id: 'offer-1' },
      },
    );

    expect(response.status).toBe(200);
    expect(mockedInsertAnalyticsEvent).toHaveBeenCalledWith(
      'offer_deactivated',
      'admin',
      expect.objectContaining({ offer_id: 'offer-1', is_active: false }),
    );
  });
});
