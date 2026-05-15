export const DEVELOPMENT_FALLBACK_PROMPT =
  'You are Arlo, a friendly software advisor. Ask concise conversational questions to understand the user\'s use case, team size, budget, and priorities. Only enter recommendation mode when enough context is available. When recommending tools, return ranked structured recommendations that use offer_id, rank, match_score, and match_reason.';

export const SUPPORTED_USE_CASE_LABELS = {
  'project-management': 'project management',
  crm: 'CRM',
  support: 'support',
  automation: 'automation',
  'note-taking': 'note-taking',
  'knowledge-base': 'knowledge base',
  design: 'design',
  scheduling: 'scheduling',
} as const;

export const SUPPORTED_USE_CASES = Object.keys(
  SUPPORTED_USE_CASE_LABELS,
) as Array<keyof typeof SUPPORTED_USE_CASE_LABELS>;

export const PRIORITY_KEYWORDS = [
  'ease of use',
  'collaboration',
  'automation',
  'integrations',
  'price',
  'reporting',
  'support',
  'customization',
  'speed',
];

export const USE_CASE_KEYWORDS: Array<{ category: string; phrases: string[] }> = [
  {
    category: 'project-management',
    phrases: ['project management', 'project manager', 'task tracking', 'planning', 'roadmap', 'tasks'],
  },
  {
    category: 'crm',
    phrases: ['crm', 'sales pipeline', 'lead management', 'customer relationship', 'sales'],
  },
  {
    category: 'support',
    phrases: ['support', 'customer support', 'help desk', 'ticketing', 'support team', 'service desk'],
  },
  {
    category: 'automation',
    phrases: ['automation', 'workflow automation', 'integrations', 'connect apps', 'no-code', 'automate'],
  },
  {
    category: 'note-taking',
    phrases: ['note taking', 'notes app', 'class notes', 'meeting notes', 'second brain', 'knowledge notebook'],
  },
  {
    category: 'knowledge-base',
    phrases: ['knowledge base', 'internal wiki', 'documentation', 'docs hub', 'team wiki', 'company wiki'],
  },
  {
    category: 'design',
    phrases: ['design', 'ui design', 'graphic design', 'mockups', 'prototyping', 'brand design'],
  },
  {
    category: 'scheduling',
    phrases: ['scheduling', 'appointment booking', 'calendar booking', 'meeting scheduling', 'book meetings', 'calendar'],
  },
];