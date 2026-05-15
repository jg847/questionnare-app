import type { MetadataRoute } from 'next';

import {
  buildPageUrl,
  categoryPages,
  comparisonPages,
  compliancePages,
} from '@/lib/content/site-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '/',
    '/category',
    '/compare',
    '/quiz',
    '/faq',
    ...categoryPages.map((page) => `/category/${page.slug}`),
    ...comparisonPages.map((page) => `/compare/${page.slug}`),
    ...compliancePages.map((page) => `/${page.slug}`),
  ];

  return pages.map((pathname) => ({
    url: buildPageUrl(pathname),
    changeFrequency: pathname === '/' ? 'weekly' : 'monthly',
    priority: pathname === '/' ? 1 : pathname.startsWith('/category/') ? 0.8 : 0.6,
  }));
}