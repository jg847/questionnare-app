import { validateAdminOfferInput } from '@/lib/admin/offer-validation';

describe('validateAdminOfferInput', () => {
  it('accepts valid offer input and normalizes tags and slug', () => {
    const result = validateAdminOfferInput({
      name: 'TaskFlow',
      slug: 'TaskFlow',
      description: 'Project management for small teams.',
      category: 'project-management',
      tags: 'planning, collaboration',
      affiliate_url: 'https://example.com/taskflow',
      logo_url: 'https://example.com/logo.png',
      pricing_model: 'subscription',
      commission_info: '10%',
      is_active: true,
    });

    expect(result).toEqual({
      data: {
        name: 'TaskFlow',
        slug: 'taskflow',
        description: 'Project management for small teams.',
        category: 'project-management',
        tags: ['planning', 'collaboration'],
        affiliate_url: 'https://example.com/taskflow',
        logo_url: 'https://example.com/logo.png',
        pricing_model: 'subscription',
        commission_info: '10%',
        is_active: true,
      },
    });
  });

  it('rejects missing required fields and invalid urls', () => {
    const result = validateAdminOfferInput({
      name: '',
      slug: '',
      description: '',
      category: '',
      tags: '',
      affiliate_url: 'invalid-url',
      logo_url: 'not-a-url',
    });

    expect(result.errors).toMatchObject({
      name: expect.any(String),
      slug: expect.any(String),
      description: expect.any(String),
      category: expect.any(String),
      tags: expect.any(String),
      affiliate_url: expect.any(String),
      logo_url: expect.any(String),
    });
  });
});
