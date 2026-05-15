insert into offers (
  name,
  slug,
  description,
  category,
  tags,
  affiliate_url,
  logo_url,
  pricing_model,
  commission_info,
  is_active
)
values
  (
    'Notion',
    'notion',
    'Connected workspace for docs, tasks, and lightweight knowledge management.',
    'project-management',
    array['docs', 'planning', 'collaboration'],
    'https://www.notion.so/',
    'https://logo.clearbit.com/notion.so',
    'freemium',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Asana',
    'asana',
    'Task and project coordination for teams that need structured work tracking.',
    'project-management',
    array['tasks', 'workflow', 'teams'],
    'https://asana.com/',
    'https://logo.clearbit.com/asana.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'HubSpot CRM',
    'hubspot-crm',
    'CRM platform for sales, marketing, and customer lifecycle workflows.',
    'crm',
    array['crm', 'sales', 'marketing'],
    'https://www.hubspot.com/products/crm',
    'https://logo.clearbit.com/hubspot.com',
    'freemium',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Pipedrive',
    'pipedrive',
    'Sales-focused CRM for pipeline visibility and follow-up execution.',
    'crm',
    array['crm', 'pipeline', 'sales'],
    'https://www.pipedrive.com/',
    'https://logo.clearbit.com/pipedrive.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Zendesk',
    'zendesk',
    'Customer support and ticket management platform for service teams.',
    'support',
    array['support', 'tickets', 'helpdesk'],
    'https://www.zendesk.com/',
    'https://logo.clearbit.com/zendesk.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Intercom',
    'intercom',
    'Customer messaging platform for support, onboarding, and lifecycle engagement.',
    'support',
    array['chat', 'support', 'customer-success'],
    'https://www.intercom.com/',
    'https://logo.clearbit.com/intercom.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Zapier',
    'zapier',
    'No-code workflow automation across common SaaS tools and alerts.',
    'automation',
    array['automation', 'integrations', 'no-code'],
    'https://zapier.com/',
    'https://logo.clearbit.com/zapier.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Make',
    'make',
    'Visual automation builder for multi-step integrations and operational workflows.',
    'automation',
    array['automation', 'integrations', 'operations'],
    'https://www.make.com/',
    'https://logo.clearbit.com/make.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Obsidian',
    'obsidian',
    'Local-first note-taking workspace for linked notes, research, and study workflows.',
    'note-taking',
    array['notes', 'knowledge', 'study'],
    'https://obsidian.md/',
    'https://logo.clearbit.com/obsidian.md',
    'freemium',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Evernote',
    'evernote',
    'Cross-device note capture for lecture notes, web clipping, and personal organization.',
    'note-taking',
    array['notes', 'capture', 'organization'],
    'https://evernote.com/',
    'https://logo.clearbit.com/evernote.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Confluence',
    'confluence',
    'Team knowledge base for internal documentation, project handoffs, and shared process notes.',
    'knowledge-base',
    array['documentation', 'wiki', 'collaboration'],
    'https://www.atlassian.com/software/confluence',
    'https://logo.clearbit.com/atlassian.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Slab',
    'slab',
    'Clean internal wiki for policies, onboarding guides, and searchable team knowledge.',
    'knowledge-base',
    array['wiki', 'docs', 'search'],
    'https://slab.com/',
    'https://logo.clearbit.com/slab.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Figma',
    'figma',
    'Collaborative design platform for interface design, wireframes, and prototypes.',
    'design',
    array['design', 'prototyping', 'collaboration'],
    'https://www.figma.com/',
    'https://logo.clearbit.com/figma.com',
    'freemium',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Canva',
    'canva',
    'Simple design tool for social graphics, presentations, and quick brand assets.',
    'design',
    array['design', 'templates', 'presentations'],
    'https://www.canva.com/',
    'https://logo.clearbit.com/canva.com',
    'freemium',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Calendly',
    'calendly',
    'Scheduling automation for booking meetings, office hours, and intake calls.',
    'scheduling',
    array['scheduling', 'calendar', 'booking'],
    'https://calendly.com/',
    'https://logo.clearbit.com/calendly.com',
    'subscription',
    'MVP placeholder affiliate relationship',
    true
  ),
  (
    'Cal.com',
    'cal-com',
    'Flexible meeting scheduling platform for teams that want booking control and routing.',
    'scheduling',
    array['scheduling', 'routing', 'calendar'],
    'https://cal.com/',
    'https://logo.clearbit.com/cal.com',
    'freemium',
    'MVP placeholder affiliate relationship',
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  tags = excluded.tags,
  affiliate_url = excluded.affiliate_url,
  logo_url = excluded.logo_url,
  pricing_model = excluded.pricing_model,
  commission_info = excluded.commission_info,
  is_active = excluded.is_active,
  updated_at = now();

update system_prompts
set is_active = false
where is_active = true;

insert into system_prompts (version, content, is_active)
values (
  1,
  $$You are Arlo, a friendly software advisor. Ask concise conversational questions to understand the user's use case, team size, budget, and priorities. Only enter recommendation mode when enough context is available. When recommending tools, return ranked structured recommendations that use offer_id, rank, match_score, and match_reason.$$,
  true
)
on conflict (version) do update
set
  content = excluded.content,
  is_active = true;