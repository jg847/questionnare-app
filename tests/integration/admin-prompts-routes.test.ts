/** @jest-environment node */

jest.mock('@/lib/db/admin-prompts', () => ({
  activateAdminPrompt: jest.fn(),
  createAdminPrompt: jest.fn(),
  getActiveAdminPrompt: jest.fn(),
  getAdminPromptById: jest.fn(),
  listAdminPrompts: jest.fn(),
}));

jest.mock('@/lib/ai/prompt-sandbox', () => ({
  runPromptSandbox: jest.fn(),
}));

import { POST as activatePost } from '@/app/api/admin/prompts/[id]/activate/route';
import { GET as detailGet } from '@/app/api/admin/prompts/[id]/route';
import { POST as revertPost } from '@/app/api/admin/prompts/[id]/revert/route';
import { GET as listGet, POST as createPost } from '@/app/api/admin/prompts/route';
import { POST as sandboxPost } from '@/app/api/admin/prompts/sandbox/route';
import {
  activateAdminPrompt,
  createAdminPrompt,
  getActiveAdminPrompt,
  getAdminPromptById,
  listAdminPrompts,
} from '@/lib/db/admin-prompts';
import { runPromptSandbox } from '@/lib/ai/prompt-sandbox';

const mockedActivateAdminPrompt = jest.mocked(activateAdminPrompt);
const mockedCreateAdminPrompt = jest.mocked(createAdminPrompt);
const mockedGetActiveAdminPrompt = jest.mocked(getActiveAdminPrompt);
const mockedGetAdminPromptById = jest.mocked(getAdminPromptById);
const mockedListAdminPrompts = jest.mocked(listAdminPrompts);
const mockedRunPromptSandbox = jest.mocked(runPromptSandbox);

const prompt = {
  id: 'prompt-1',
  version: 2,
  content: 'You are Arlo. Recommend tools clearly.',
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('admin prompts routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the active prompt and prompt history', async () => {
    mockedGetActiveAdminPrompt.mockResolvedValue(prompt);
    mockedListAdminPrompts.mockResolvedValue([
      {
        id: 'prompt-1',
        version: 2,
        is_active: true,
        created_at: prompt.created_at,
      },
    ]);

    const response = await listGet();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      activePrompt: prompt,
      prompts: [
        {
          id: 'prompt-1',
          version: 2,
          is_active: true,
          created_at: prompt.created_at,
        },
      ],
    });
  });

  it('creates a new prompt version', async () => {
    mockedCreateAdminPrompt.mockResolvedValue(prompt);

    const response = await createPost(
      new Request('http://localhost/api/admin/prompts', {
        method: 'POST',
        body: JSON.stringify({
          content: 'You are Arlo. Recommend tools clearly.',
          activate: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedCreateAdminPrompt).toHaveBeenCalledWith({
      content: 'You are Arlo. Recommend tools clearly.',
      activate: true,
    });
  });

  it('rejects empty prompt content', async () => {
    const response = await createPost(
      new Request('http://localhost/api/admin/prompts', {
        method: 'POST',
        body: JSON.stringify({ content: '   ' }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('loads prompt detail', async () => {
    mockedGetAdminPromptById.mockResolvedValue(prompt);

    const response = await detailGet(new Request('http://localhost/api/admin/prompts/prompt-1'), {
      params: { id: 'prompt-1' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ prompt });
  });

  it('activates and reverts prompt versions through the same single-active path', async () => {
    mockedActivateAdminPrompt.mockResolvedValue(prompt);

    const activateResponse = await activatePost(
      new Request('http://localhost/api/admin/prompts/prompt-1/activate', {
        method: 'POST',
      }),
      { params: { id: 'prompt-1' } },
    );
    const revertResponse = await revertPost(
      new Request('http://localhost/api/admin/prompts/prompt-1/revert', {
        method: 'POST',
      }),
      { params: { id: 'prompt-1' } },
    );

    expect(activateResponse.status).toBe(200);
    expect(revertResponse.status).toBe(200);
    expect(mockedActivateAdminPrompt).toHaveBeenCalledTimes(2);
  });

  it('runs sandbox requests without touching stored prompt state', async () => {
    mockedRunPromptSandbox.mockResolvedValue({
      reply: 'TaskFlow is a strong match.',
      needsMoreInfo: false,
      recommendations: [
        {
          offer_id: 'offer-1',
          rank: 1,
          match_score: 92,
          match_reason: 'Strong fit for collaboration-heavy teams.',
          name: 'TaskFlow',
        },
      ],
    });

    const response = await sandboxPost(
      new Request('http://localhost/api/admin/prompts/sandbox', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Draft prompt',
          sampleConversation: [
            { role: 'user', content: 'I need project management software.' },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedRunPromptSandbox).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Draft prompt' }),
    );
  });
});