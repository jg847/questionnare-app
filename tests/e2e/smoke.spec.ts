import { expect, test } from '@playwright/test';

const adminPassword = process.env.ADMIN_SECRET ?? 'copilot-test-secret';

test('homepage renders the public chat hero', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: /find the right software with arlo in one guided chat/i,
    }),
  ).toBeVisible();
});

test('user can complete the public chat flow and see inline recommendations', async ({
  page,
}) => {
  let trackedPayload: Record<string, unknown> | null = null;

  await page.route('**/api/chat', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        reply: 'Here are the best options for your workflow.',
        needsMoreInfo: false,
        recommendations: [
          {
            offer_id: 'offer-1',
            rank: 1,
            match_score: 94,
            match_reason: 'Strong fit for small-team planning.',
            name: 'TaskFlow',
            description: 'Project management with collaboration and reporting.',
            affiliate_url: 'https://example.com/taskflow',
            logo_url: null,
          },
        ],
      }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/track/click', async (route) => {
    trackedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      body: JSON.stringify({ tracked: true }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('https://example.com/**', async (route) => {
    await route.fulfill({
      body: '<html><body>Vendor</body></html>',
      contentType: 'text/html',
      status: 200,
    });
  });

  await page.goto('/');

  await page.getByLabel('Describe the tool you need').fill(
    'I need project management software for a small team.',
  );
  await page.getByRole('button', { name: /^send/i }).click();

  await expect(
    page.getByText(/here are the best options for your workflow/i),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /taskflow/i })).toBeVisible();
  await expect(page.getByText(/94% match/i)).toBeVisible();
  await expect(
    page.getByText(/affiliate disclosure: this link may earn toolmatch ai a commission/i),
  ).toBeVisible();
  await expect(
    page.getByText(/want these results saved for later/i),
  ).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: /visit site/i }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();

  expect(trackedPayload).toMatchObject({
    offer_id: 'offer-1',
    utm_source: 'toolmatch',
    utm_medium: 'recommendation',
  });
  await expect(popup).toHaveURL(/utm_source=toolmatch/);
  await expect(popup).toHaveURL(/utm_medium=recommendation/);
  await expect(popup).toHaveURL(/utm_campaign=/);
  await expect(popup).toHaveURL(/sub_id=/);
});

test('admin can manage offers end to end', async ({ page }) => {
  const offers = [
    {
      id: 'offer-1',
      name: 'TaskFlow',
      slug: 'taskflow',
      description: 'Project management software.',
      category: 'project-management',
      tags: ['planning'],
      affiliate_url: 'https://example.com/taskflow',
      logo_url: null,
      pricing_model: 'subscription',
      commission_info: null,
      is_active: true,
      created_at: '2026-05-14T00:00:00.000Z',
      updated_at: '2026-05-14T00:00:00.000Z',
    },
  ];
  let lastPatchedOffer: Record<string, unknown> | null = null;

  await page.route('**/api/admin/offers?**', async (route) => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get('query') ?? '').toLowerCase();
    const status = url.searchParams.get('status') ?? 'all';
    const category = url.searchParams.get('category') ?? 'all';

    const filtered = offers.filter((offer) => {
      const queryMatch =
        !query ||
        offer.name.toLowerCase().includes(query) ||
        offer.slug.toLowerCase().includes(query);
      const statusMatch =
        status === 'all' ||
        (status === 'active' && offer.is_active) ||
        (status === 'inactive' && !offer.is_active);
      const categoryMatch = category === 'all' || offer.category === category;

      return queryMatch && statusMatch && categoryMatch;
    });

    await route.fulfill({
      body: JSON.stringify({
        offers: filtered.map(
          ({
            description,
            tags,
            affiliate_url,
            logo_url,
            commission_info,
            created_at,
            ...listRow
          }) => listRow,
        ),
        categories: ['project-management', 'crm'],
      }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/admin/offers/*', async (route) => {
    const id = route.request().url().split('/').pop();
    const method = route.request().method();

    if (method === 'GET') {
      const offer = offers.find((item) => item.id === id);
      await route.fulfill({
        body: JSON.stringify({ offer }),
        contentType: 'application/json',
        status: offer ? 200 : 404,
      });
      return;
    }

    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const index = offers.findIndex((item) => item.id === id);
      lastPatchedOffer = body;

      offers[index] = {
        ...offers[index],
        ...body,
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : offers[index].tags,
        updated_at: '2026-05-15T00:00:00.000Z',
      };

      await route.fulfill({
        body: JSON.stringify({ offer: offers[index] }),
        contentType: 'application/json',
        status: 200,
      });
    }
  });

  await page.route('**/api/admin/offers', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const createdOffer = {
      id: 'offer-2',
      created_at: '2026-05-15T00:00:00.000Z',
      updated_at: '2026-05-15T00:00:00.000Z',
      ...body,
    };
    offers.unshift(createdOffer as (typeof offers)[number]);

    await route.fulfill({
      body: JSON.stringify({ offer: createdOffer }),
      contentType: 'application/json',
      status: 201,
    });
  });

  await page.goto('/admin');

  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/admin password/i).fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

  await expect(
    page.getByRole('heading', { name: /offer catalog manager/i }),
  ).toBeVisible();

  await page.getByRole('button', { name: /new offer/i }).click();
  await page.getByLabel('Name').fill('ClientBridge');
  await page.getByLabel('Slug').fill('clientbridge');
  await page.getByLabel('Description').fill('CRM for growing client teams.');
  await page.locator('#offer-category').fill('crm');
  await page.locator('#offer-tags').fill('crm, sales');
  await page.locator('#offer-affiliate-url').fill('https://example.com/clientbridge');
  await page.getByRole('button', { name: /create offer/i }).click();

  await expect(page.getByText(/clientbridge/i)).toBeVisible();

  await page.getByLabel('Search offers').fill('taskflow');
  const taskflowRow = page.locator('tbody tr').filter({ hasText: 'TaskFlow' }).first();
  await expect(taskflowRow).toBeVisible();
  await taskflowRow.click();
  await expect(page.locator('#offer-description')).toHaveValue('Project management software.');
  await page.locator('#offer-description').fill('Updated project management software.');
  await page.getByRole('button', { name: /save changes/i }).click();
  expect(lastPatchedOffer).toMatchObject({
    description: 'Updated project management software.',
  });

  await page.getByRole('button', { name: /mark inactive/i }).click();
  expect(lastPatchedOffer).toMatchObject({
    is_active: false,
  });
  await page.getByLabel('Filter by status').selectOption('inactive');
  await expect(taskflowRow).toBeVisible();

  await page.getByRole('button', { name: /log out/i }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
});

test('admin can manage prompt versions in the protected prompt studio', async ({ page }) => {
  const prompts = [
    {
      id: 'prompt-0',
      version: 0,
      content: 'You are Arlo origin version.',
      is_active: false,
      created_at: '2026-05-13T00:00:00.000Z',
    },
    {
      id: 'prompt-1',
      version: 1,
      content: 'You are Arlo version one.',
      is_active: true,
      created_at: '2026-05-14T00:00:00.000Z',
    },
  ];
  let sandboxPayload: Record<string, unknown> | null = null;

  await page.route('**/api/admin/offers?**', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ offers: [], categories: [] }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/admin/prompts', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        body: JSON.stringify({
          activePrompt: prompts.find((prompt) => prompt.is_active) ?? null,
          prompts: prompts.map(({ id, version, is_active, created_at }) => ({
            id,
            version,
            is_active,
            created_at,
          })),
        }),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const createdPrompt = {
      id: 'prompt-2',
      version: 2,
      content: String(body.content),
      is_active: Boolean(body.activate),
      created_at: '2026-05-15T00:00:00.000Z',
    };

    if (createdPrompt.is_active) {
      prompts.forEach((prompt) => {
        prompt.is_active = false;
      });
    }

    prompts.unshift(createdPrompt);

    await route.fulfill({
      body: JSON.stringify({ prompt: createdPrompt }),
      contentType: 'application/json',
      status: 201,
    });
  });

  await page.route('**/api/admin/prompts/sandbox', async (route) => {
    sandboxPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      body: JSON.stringify({
        reply: 'TaskFlow is a strong match for this prompt draft.',
        needsMoreInfo: false,
        recommendations: [
          {
            offer_id: 'offer-1',
            rank: 1,
            match_score: 90,
            match_reason: 'Strong fit for small-team collaboration.',
            name: 'TaskFlow',
          },
        ],
      }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/admin/prompts/*/activate', async (route) => {
    const id = route.request().url().split('/').slice(-2)[0];
    prompts.forEach((prompt) => {
      prompt.is_active = prompt.id === id;
    });

    const activePrompt = prompts.find((prompt) => prompt.id === id)!;
    await route.fulfill({
      body: JSON.stringify({ prompt: activePrompt }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/admin/prompts/*/revert', async (route) => {
    const id = route.request().url().split('/').slice(-2)[0];
    prompts.forEach((prompt) => {
      prompt.is_active = prompt.id === id;
    });

    const activePrompt = prompts.find((prompt) => prompt.id === id)!;
    await route.fulfill({
      body: JSON.stringify({ prompt: activePrompt }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/admin/prompts/*', async (route) => {
    const url = route.request().url();

    if (/\/sandbox$|\/activate$|\/revert$/.test(url)) {
      await route.fallback();
      return;
    }

    const id = url.split('/').pop();
    const prompt = prompts.find((item) => item.id === id);
    await route.fulfill({
      body: JSON.stringify({ prompt }),
      contentType: 'application/json',
      status: prompt ? 200 : 404,
    });
  });

  await page.goto('/admin?section=prompts');

  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/admin password/i).fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  await page.getByRole('link', { name: /prompts/i }).click();

  await expect(page.getByRole('heading', { name: /prompt studio/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /version 1/i })).toBeVisible();

  await page.getByLabel('Prompt content').fill('You are Arlo version two.');
  await page.getByLabel(/activate this version after saving/i).check();
  await page.getByRole('button', { name: /save prompt version/i }).click();
  await expect(page.getByRole('button', { name: /version 2/i })).toBeVisible();

  await page.getByLabel('Sample conversation').fill(
    'user: I need project management software for a small team.',
  );
  const sandboxResponsePromise = page.waitForResponse('**/api/admin/prompts/sandbox');
  await page.getByRole('button', { name: /run sandbox/i }).click();
  await sandboxResponsePromise;
  expect(sandboxPayload).toMatchObject({
    content: 'You are Arlo version two.',
  });
  await expect(page.getByText(/taskflow is a strong match/i)).toBeVisible();

  await page.getByRole('button', { name: /version 0/i }).click();
  await expect(page.getByLabel('Prompt content')).toHaveValue('You are Arlo origin version.');
});

test('admin can view analytics summary in the protected dashboard', async ({ page }) => {
  await page.route('**/api/admin/offers?**', async (route) => {
    await route.fulfill({
      body: JSON.stringify({ offers: [], categories: [] }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.route('**/api/admin/analytics?**', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        summary: {
          totalConversations: 12,
          recommendationGenerationRate: 0.75,
          totalClicks: 5,
          metricDefinitions: {
            totalConversations: 'count(conversations.created_at in window)',
            recommendationGenerationRate:
              'count(conversations where recommendation_generated = true in window) / count(conversations in window)',
            ctrPerOffer:
              'clicks for that offer in the window / recommendations for that offer in the window',
            funnel:
              'conversations started, conversations with recommendations, sessions with at least one recommendation click',
          },
          topClickedOffer: {
            offer_id: 'offer-1',
            name: 'TaskFlow',
            clicks: 3,
          },
          funnel: {
            conversationsStarted: 12,
            recommendationsGenerated: 9,
            recommendationClicks: 4,
          },
        },
        offers: [
          {
            offer_id: 'offer-1',
            name: 'TaskFlow',
            clicks: 3,
            recommendations: 6,
            ctr: 0.5,
          },
          {
            offer_id: 'offer-2',
            name: 'BudgetBoard',
            clicks: 1,
            recommendations: 2,
            ctr: 0.5,
          },
        ],
        topOffersByClicks: [
          {
            offer_id: 'offer-1',
            name: 'TaskFlow',
            clicks: 3,
            recommendations: 6,
            ctr: 0.5,
          },
        ],
        activity: [
          {
            date: '2026-05-14',
            conversations: 4,
            recommendationsGenerated: 3,
            clicks: 2,
          },
        ],
        window: {
          from: '2026-04-15T00:00:00.000Z',
          to: '2026-05-14T23:59:59.999Z',
        },
      }),
      contentType: 'application/json',
      status: 200,
    });
  });

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/admin password/i).fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  await page.getByRole('link', { name: /analytics/i }).click();

  await expect(page.getByRole('heading', { name: /analytics dashboard/i })).toBeVisible();
  await expect(page.getByText(/total conversations/i).locator('..').getByText(/^12$/)).toBeVisible();
  await expect(page.getByText(/75%/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /top offers by clicks/i })).toBeVisible();
  await expect(page.getByRole('table').first().getByRole('cell', { name: 'TaskFlow' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /ctr per offer/i })).toBeVisible();
  await expect(page.getByRole('table').nth(1).getByRole('cell', { name: 'BudgetBoard' })).toBeVisible();
});

test('unknown routes render not found', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(
    page.getByRole('heading', {
      name: /page not found/i,
    }),
  ).toBeVisible();
});
