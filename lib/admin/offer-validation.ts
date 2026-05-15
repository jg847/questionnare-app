import type { AdminOfferInput } from '@/types/admin';

type RawAdminOfferInput = Record<string, unknown>;

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateAdminOfferInput(input: RawAdminOfferInput): {
  data?: AdminOfferInput;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = toOptionalString(input.name);
  const slug = toOptionalString(input.slug)?.toLowerCase();
  const description = toOptionalString(input.description);
  const category = toOptionalString(input.category);
  const affiliateUrl = toOptionalString(input.affiliate_url);
  const logoUrl = toOptionalString(input.logo_url);
  const pricingModel = toOptionalString(input.pricing_model);
  const commissionInfo = toOptionalString(input.commission_info);
  const tags = parseTags(input.tags);
  const isActive =
    typeof input.is_active === 'boolean'
      ? input.is_active
      : input.is_active === 'false'
        ? false
        : true;

  if (!name) {
    errors.name = 'Name is required.';
  }

  if (!slug) {
    errors.slug = 'Slug is required.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  }

  if (!category) {
    errors.category = 'Category is required.';
  }

  if (!affiliateUrl) {
    errors.affiliate_url = 'Affiliate URL is required.';
  } else if (!isValidUrl(affiliateUrl)) {
    errors.affiliate_url = 'Affiliate URL must be a valid http or https URL.';
  }

  if (logoUrl && !isValidUrl(logoUrl)) {
    errors.logo_url = 'Logo URL must be a valid http or https URL.';
  }

  if (!tags.length) {
    errors.tags = 'At least one tag is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      name: name!,
      slug: slug!,
      description: description!,
      category: category!,
      tags,
      affiliate_url: affiliateUrl!,
      logo_url: logoUrl,
      pricing_model: pricingModel,
      commission_info: commissionInfo,
      is_active: isActive,
    },
  };
}