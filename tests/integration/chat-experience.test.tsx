import { ReadableStream } from 'node:stream/web';
import { TextDecoder } from 'node:util';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatExperience } from '@/components/chat/chat-experience';

global.TextDecoder = TextDecoder as typeof global.TextDecoder;

function createStreamingResponse(events: unknown[]) {
  return {
    ok: true,
    body: new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(Buffer.from(`${JSON.stringify(event)}\n`));
        }

        controller.close();
      },
    }),
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type'
          ? 'application/x-ndjson; charset=utf-8'
          : null,
    },
  } as unknown as Response;
}

describe('ChatExperience', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('streams assistant content, reuses the browser session id, and renders recommendation cards', async () => {
    const fetchMock = jest.mocked(global.fetch);

    fetchMock.mockResolvedValue(
      createStreamingResponse([
        {
          type: 'reply_delta',
          reply: 'Here are the best options',
        },
        {
          type: 'reply_delta',
          reply: 'Here are the best options for your workflow.',
        },
        {
          type: 'recommendations',
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
        },
        {
          type: 'done',
        },
      ]),
    );

    const user = userEvent.setup();
    render(<ChatExperience />);

    await user.click(
      screen.getByRole('button', {
        name: /i need project management software for a small team/i,
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1] && (fetchMock.mock.calls[0]?.[1] as RequestInit).body),
    );

    expect(requestBody.session_id).toBe(
      window.sessionStorage.getItem('toolmatch-session-id'),
    );

    expect(
      await screen.findByText(/here are the best options for your workflow/i),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: /taskflow/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/94% match/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visit site/i })).toHaveAttribute(
      'data-session-id',
      requestBody.session_id,
    );
  });

  it('preserves prior transcript state when a chat request fails', async () => {
    const fetchMock = jest.mocked(global.fetch);

    fetchMock.mockResolvedValue({
      ok: false,
      headers: {
        get: () => 'application/json',
      },
      json: async () => ({ error: 'Temporary outage.' }),
    } as unknown as Response);

    const user = userEvent.setup();
    render(<ChatExperience />);

    await user.type(
      screen.getByLabelText(/describe the tool you need/i),
      'We need a CRM for a growing team.',
    );
    await user.click(screen.getByRole('button', { name: /^send/i }));

    expect(
      await screen.findByText(/we need a crm for a growing team/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/temporary outage/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tell me what kind of tool you need/i),
    ).toBeInTheDocument();
  });

  it('tracks recommendation clicks without blocking outbound navigation', async () => {
    const fetchMock = jest.mocked(global.fetch);
    const sendBeaconMock = jest.fn(() => true);
    const openMock = jest.fn();

    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeaconMock,
      configurable: true,
    });
    Object.defineProperty(window, 'open', {
      value: openMock,
      configurable: true,
    });

    fetchMock.mockResolvedValue(
      createStreamingResponse([
        {
          type: 'reply_delta',
          reply: 'Here are the best options for your workflow.',
        },
        {
          type: 'recommendations',
          recommendations: [
            {
              offer_id: 'offer-1',
              rank: 1,
              match_score: 94,
              match_reason: 'Strong fit for small-team planning.',
              name: 'TaskFlow',
              description: 'Project management with collaboration and reporting.',
              affiliate_url: 'https://example.com/taskflow?partner=abc',
              logo_url: null,
            },
          ],
        },
        { type: 'done' },
      ]),
    );

    const user = userEvent.setup();
    render(<ChatExperience />);

    await user.click(
      screen.getByRole('button', {
        name: /i need project management software for a small team/i,
      }),
    );

    const cta = await screen.findByRole('link', { name: /visit site/i });
    expect(cta).toHaveAttribute('href', expect.stringContaining('utm_source=toolmatch'));
    expect(cta).toHaveAttribute('href', expect.stringContaining('utm_medium=recommendation'));
    expect(cta).toHaveAttribute('href', expect.stringContaining('sub_id='));
    await user.click(cta);

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeaconMock.mock.calls[0] as unknown as [string, Blob];
    expect(url).toBe('/api/track/click');
    expect(blob).toBeTruthy();
    expect(openMock).toHaveBeenCalledTimes(1);
    expect(openMock.mock.calls[0]?.[0]).toContain('partner=abc');
    expect(openMock.mock.calls[0]?.[0]).toContain('utm_source=toolmatch');
    expect(openMock.mock.calls[0]?.[0]).toContain('utm_medium=recommendation');
    expect(openMock.mock.calls[0]?.[0]).toContain('utm_campaign=');
    expect(openMock.mock.calls[0]?.[0]).toContain('sub_id=');
  });

  it('falls back to keepalive fetch when sendBeacon declines the tracking payload', async () => {
    const fetchMock = jest.mocked(global.fetch);
    const openMock = jest.fn();

    Object.defineProperty(navigator, 'sendBeacon', {
      value: jest.fn(() => false),
      configurable: true,
    });
    Object.defineProperty(window, 'open', {
      value: openMock,
      configurable: true,
    });

    fetchMock
      .mockResolvedValueOnce(
        createStreamingResponse([
          {
            type: 'reply_delta',
            reply: 'Here are the best options for your workflow.',
          },
          {
            type: 'recommendations',
            recommendations: [
              {
                offer_id: 'offer-1',
                rank: 1,
                match_score: 94,
                match_reason: 'Strong fit for small-team planning.',
                name: 'TaskFlow',
                description: 'Project management with collaboration and reporting.',
                affiliate_url: 'https://example.com/taskflow?partner=abc',
                logo_url: null,
              },
            ],
          },
          { type: 'done' },
        ]),
      )
      .mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => ({ tracked: true }),
      } as unknown as Response);

    const user = userEvent.setup();
    render(<ChatExperience />);

    await user.click(
      screen.getByRole('button', {
        name: /i need project management software for a small team/i,
      }),
    );

    const cta = await screen.findByRole('link', { name: /visit site/i });
    await user.click(cta);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/track/click');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      keepalive: true,
    });
    expect(openMock).toHaveBeenCalledTimes(1);
  });

  it('removes startup quick replies once the conversation begins', async () => {
    const fetchMock = jest.mocked(global.fetch);

    let resolveFetch: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const user = userEvent.setup();
    render(<ChatExperience />);

    const quickReply = await screen.findByRole('button', {
      name: /i need project management software for a small team/i,
    });

    await user.click(quickReply);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByRole('button', {
        name: /i need project management software for a small team/i,
      }),
    ).not.toBeInTheDocument();

    resolveFetch?.(
      createStreamingResponse([
        { type: 'reply_delta', reply: 'Ready.' },
        { type: 'done' },
      ]),
    );

    await waitFor(() => {
      expect(screen.getByText('Ready.')).toBeInTheDocument();
    });
  });
});