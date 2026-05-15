import type { Metadata } from 'next';

import { SUPPORTED_USE_CASE_LABELS, type SUPPORTED_USE_CASES } from '@/lib/ai/constants';

type SupportedUseCase = (typeof SUPPORTED_USE_CASES)[number];

type ContentSection = {
  heading: string;
  body: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type DecisionCriterion = {
  label: string;
  detail: string;
};

export type CategoryPageContent = {
  slug: SupportedUseCase;
  pageType: 'category';
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  ctaLabel: string;
  decisionCriteria: DecisionCriterion[];
  bestFitSummary: string;
  watchOutSummary: string;
  sections: ContentSection[];
  faqItems: FaqItem[];
};

export type ComparisonPageContent = {
  slug: string;
  pageType: 'comparison';
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: ContentSection[];
  faqItems: FaqItem[];
};

export type CompliancePageContent = {
  slug: 'privacy' | 'terms' | 'affiliate-disclosure' | 'cookie-notice';
  pageType: 'compliance';
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: ContentSection[];
};

export const siteBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const categoryPages: CategoryPageContent[] = [
  {
    slug: 'project-management',
    pageType: 'category',
    title: 'Project Management Software Recommendations',
    metaTitle: 'Best Project Management Software for Small Teams | ToolMatch AI',
    metaDescription: 'Compare project management tools by team size, budget, collaboration needs, and workflow fit before you click through.',
    intro: 'Evaluate project management tools with a guided funnel that narrows the shortlist by planning style, team size, and budget constraints.',
    ctaLabel: 'Start project management quiz',
    decisionCriteria: [
      {
        label: 'Execution clarity',
        detail: 'Decide whether the team needs simple task visibility or a more opinionated planning system with dependencies, milestones, and stronger process guardrails.',
      },
      {
        label: 'Cross-team coordination',
        detail: 'The right tool changes when work needs to move cleanly across functions instead of staying inside one small team or project owner.',
      },
      {
        label: 'Reporting depth',
        detail: 'Some teams only need day-to-day visibility, while others need workload views, leadership reporting, and portfolio-level oversight.',
      },
    ],
    bestFitSummary: 'Best for teams that need a predictable way to organize work, improve accountability, and choose between lightweight execution tooling and a more structured planning system.',
    watchOutSummary: 'Watch out for buying too much workflow complexity too early. The wrong project tool often creates admin overhead faster than it creates clarity.',
    sections: [
      {
        heading: 'Who this page is for',
        body: 'Teams choosing between lightweight task tracking and a more opinionated planning stack can use ToolMatch AI to compare fit before committing to trials.',
      },
      {
        heading: 'How recommendations are generated',
        body: 'ToolMatch AI combines structured questionnaire answers or chat context with deterministic offer scoring to rank tools against your use case, pricing needs, and workflow priorities.',
      },
      {
        heading: 'What to look for',
        body: 'The strongest project management matches usually depend on the handoff between planning, collaboration, reporting, and cross-functional visibility.',
      },
      {
        heading: 'How team maturity changes the fit',
        body: 'Early-stage teams often need speed, clarity, and low-overhead adoption, while more mature teams may need portfolio views, cross-team reporting, and stronger process enforcement. The right shortlist depends on which phase you are actually in rather than on a generic feature race.',
      },
    ],
    faqItems: [
      {
        question: 'Can ToolMatch AI recommend low-cost project management tools?',
        answer: 'Yes. Budget is a first-class input in the guided quiz and influences the deterministic fallback ranking for freemium versus subscription tools.',
      },
      {
        question: 'Does the quiz replace live product trials?',
        answer: 'No. The goal is to shorten the shortlist so your trial time is spent on tools that fit your requirements more closely.',
      },
      {
        question: 'Should I prioritize collaboration features or reporting first?',
        answer: 'That depends on where the team feels the most friction today. Teams struggling with alignment usually need cleaner day-to-day collaboration first, while teams already executing consistently may get more value from reporting and visibility upgrades.',
      },
    ],
  },
  {
    slug: 'crm',
    pageType: 'category',
    title: 'CRM Software Recommendations',
    metaTitle: 'Find the Right CRM for Your Sales Workflow | ToolMatch AI',
    metaDescription: 'Use a guided questionnaire to compare CRM options by sales motion, team maturity, budget, and reporting needs.',
    intro: 'CRM fit usually breaks on data hygiene, pipeline structure, and adoption. ToolMatch AI narrows the field with structured workflow inputs instead of generic “best CRM” lists.',
    ctaLabel: 'Start CRM quiz',
    decisionCriteria: [
      {
        label: 'Sales process complexity',
        detail: 'A simple founder-led pipeline needs a very different CRM than a multi-stage sales motion with handoffs, approvals, and revops ownership.',
      },
      {
        label: 'Admin capacity',
        detail: 'Some CRMs assume the team can handle customization, governance, and data cleanup. Others fit better when operational capacity is limited.',
      },
      {
        label: 'Adoption risk',
        detail: 'If the team will not consistently use the CRM, feature breadth stops mattering. Ease of use is often a first-order constraint.',
      },
    ],
    bestFitSummary: 'Best for teams that want to shortlist CRM options based on how they actually sell, how much operational weight they can support, and how quickly they need adoption.',
    watchOutSummary: 'Watch out for choosing a CRM based on aspirational future complexity rather than current process discipline, migration reality, and admin bandwidth.',
    sections: [
      {
        heading: 'Structured CRM matching',
        body: 'Recommendations weigh sales process shape, pricing model, and workflow priorities so small teams are not shown the same shortlist as a larger revops-led organization.',
      },
      {
        heading: 'Where teams get stuck',
        body: 'Teams often over-index on feature breadth and miss the operational cost of poor adoption. The questionnaire is designed to flush out those constraints early.',
      },
      {
        heading: 'What separates a light CRM rollout from a heavy one',
        body: 'The biggest difference is usually not raw capability but the cost of setup, migration, data hygiene, and ongoing administration. A CRM that looks stronger in a feature matrix can still be the wrong choice if the team cannot support the operational load needed to make it work.',
      },
    ],
    faqItems: [
      {
        question: 'Can the recommendations handle startup and small-team CRM use cases?',
        answer: 'Yes. Team size and budget signals are part of the ranking context and help bias toward lighter operational setups when appropriate.',
      },
      {
        question: 'Does ToolMatch AI use affiliate links?',
        answer: 'Yes. ToolMatch AI may earn a commission when you click a recommended partner link, and that disclosure is surfaced near CTAs and on the disclosure page.',
      },
      {
        question: 'How much should migration and cleanup influence CRM selection?',
        answer: 'A lot. CRM decisions are often constrained by existing data quality, pipeline habits, and how much process change the team can absorb. Migration overhead is part of fit, not an afterthought.',
      },
    ],
  },
  {
    slug: 'support',
    pageType: 'category',
    title: 'Customer Support Software Recommendations',
    metaTitle: 'Best Support Platforms by Team Size and Budget | ToolMatch AI',
    metaDescription: 'Compare help desk and support platforms with a guided tool-matching flow built for affordability, speed, and customer operations fit.',
    intro: 'Support teams need more than a ranked list. They need to know which platform fits ticket volume, staffing model, and reporting requirements.',
    ctaLabel: 'Start support quiz',
    decisionCriteria: [
      {
        label: 'Ticket complexity',
        detail: 'Simple inbound support, routed queues, and multi-step escalation workflows all push the shortlist in different directions.',
      },
      {
        label: 'Knowledge workflow',
        detail: 'If the support experience depends on strong internal and customer-facing documentation, the knowledge layer cannot be treated as secondary.',
      },
      {
        label: 'Team maturity',
        detail: 'Early support teams often need speed and clarity, while mature teams may need routing logic, reporting, automation, and channel coordination.',
      },
    ],
    bestFitSummary: 'Best for teams that need to balance speed of support, knowledge reuse, and operational structure without defaulting to the heaviest platform in the category.',
    watchOutSummary: 'Watch out for buying a support stack around edge-case channels or enterprise workflows if the team still needs to get the main queue and documentation loop under control first.',
    sections: [
      {
        heading: 'Support-first evaluation',
        body: 'The questionnaire helps distinguish between teams that need simple ticketing and teams that need deeper routing, knowledge, and reporting support.',
      },
      {
        heading: 'Why this matters',
        body: 'A poor support stack creates real operational drag. The matching flow is designed to expose those fit problems before you enter multiple product demos.',
      },
      {
        heading: 'When support and knowledge should be evaluated together',
        body: 'Many support teams underestimate how much answer quality depends on the knowledge workflow behind the ticketing system. If your team relies on repeatable resolution and self-serve deflection, the documentation experience matters almost as much as the inbox itself.',
      },
    ],
    faqItems: [
      {
        question: 'Does ToolMatch AI support knowledge-base adjacent tools too?',
        answer: 'Yes. The public site includes dedicated knowledge-base routing and the questionnaire can route you toward knowledge-heavy support tools when your answers justify it.',
      },
      {
        question: 'Are these pages search-friendly?',
        answer: 'Yes. Public content pages are server-rendered, carry metadata, and link directly into the quiz and chat entry points.',
      },
      {
        question: 'Does omni-channel support matter for smaller teams?',
        answer: 'Only when customers actually expect it and the team can support it well. Smaller teams often benefit more from a clear primary support workflow than from prematurely adopting every channel at once.',
      },
    ],
  },
  {
    slug: 'automation',
    pageType: 'category',
    title: 'Workflow Automation Software Recommendations',
    metaTitle: 'Workflow Automation Tools for Lean Teams | ToolMatch AI',
    metaDescription: 'Find workflow automation tools that match your integrations, team capability, and budget without wading through generic listicles.',
    intro: 'Automation buyers need fit around integrations, operational ownership, and ease of use. This page directs them into a deterministic recommendation flow.',
    ctaLabel: 'Start automation quiz',
    decisionCriteria: [
      {
        label: 'Workflow complexity',
        detail: 'A few reliable automations require a different tool than multi-step logic with branching, error handling, and cross-system orchestration.',
      },
      {
        label: 'Technical ownership',
        detail: 'The shortlist should reflect whether automation will be owned by a generalist operator, a founder, or a more technical operations team.',
      },
      {
        label: 'Maintenance tolerance',
        detail: 'Easy setup matters, but so does the team’s willingness to debug, document, and evolve the automations it creates over time.',
      },
    ],
    bestFitSummary: 'Best for teams that want to evaluate automation tools through the lens of internal capability and workflow depth instead of just connector counts.',
    watchOutSummary: 'Watch out for picking the most flexible automation platform when the real need is a smaller number of reliable workflows that the team can actually maintain.',
    sections: [
      {
        heading: 'Automation fit signals',
        body: 'Recommendations weigh whether you need quick wins, multi-step flows, or deeper operations leverage that justifies more setup effort.',
      },
      {
        heading: 'Conversion-ready path',
        body: 'Each page is designed as a practical entry surface into the questionnaire and chat, not as a dead-end SEO stub.',
      },
      {
        heading: 'Who should own automation internally',
        body: 'The right automation tool depends partly on who will maintain it. Founder-led or ops-light teams usually need simpler systems with lower maintenance risk, while more mature operations teams may benefit from deeper control and more complex logic.',
      },
    ],
    faqItems: [
      {
        question: 'Can ToolMatch AI help if I only know the outcome I want?',
        answer: 'Yes. The quiz and chat both capture broad workflow goals and translate them into a ranked set of likely automation tools.',
      },
      {
        question: 'What if I prefer a conversational flow over a quiz?',
        answer: 'Every category page links to both the guided quiz and the Arlo chat flow so visitors can choose the faster path for them.',
      },
      {
        question: 'Can low-code automation create maintenance problems later?',
        answer: 'Yes. The wrong automation stack can produce brittle flows and hidden operational debt. Ease of setup matters, but so does the team’s ability to monitor, debug, and evolve what it builds.',
      },
    ],
  },
  {
    slug: 'note-taking',
    pageType: 'category',
    title: 'Note-Taking App Recommendations',
    metaTitle: 'Best Note-Taking Tools for Teams and Solo Work | ToolMatch AI',
    metaDescription: 'Shortlist note-taking tools for meeting capture, personal knowledge, and collaboration with guided recommendation logic.',
    intro: 'From lightweight personal note capture to shared documentation habits, note-taking tools vary more in workflow fit than feature checklists suggest.',
    ctaLabel: 'Start note-taking quiz',
    decisionCriteria: [
      {
        label: 'Personal versus shared use',
        detail: 'Some tools fit individual capture and retrieval better, while others fit collaboration, shared structure, and ongoing team visibility.',
      },
      {
        label: 'Search and retrieval',
        detail: 'The value of notes depends on whether people can reliably find them later, not just whether capture feels good in the moment.',
      },
      {
        label: 'Workflow overhead',
        detail: 'The wrong tool can make note-taking feel heavier than the insight it returns, especially when structure becomes too rigid too early.',
      },
    ],
    bestFitSummary: 'Best for buyers trying to distinguish between personal knowledge tools, collaborative note systems, and broader workspace-style documentation habits.',
    watchOutSummary: 'Watch out for choosing a note tool that looks powerful in theory but adds too much friction to capture, retrieval, or team participation in practice.',
    sections: [
      {
        heading: 'Solo versus team note workflows',
        body: 'The recommendation flow distinguishes between personal organization needs and collaborative note systems that feed broader team knowledge practices.',
      },
      {
        heading: 'Choosing with fewer false starts',
        body: 'Instead of browsing lists, visitors can enter the quiz or chat with context that maps to priorities like search, collaboration, and ease of use.',
      },
      {
        heading: 'What usually breaks note-taking adoption',
        body: 'Most note tools fail in practice when capture is too slow, retrieval is unreliable, or the structure feels heavier than the value it returns. The best fit depends on whether you need fast personal capture, shared team context, or a system that can do both without creating friction.',
      },
    ],
    faqItems: [
      {
        question: 'Can this page guide both students and teams?',
        answer: 'Yes. The context capture is broad enough to support both solo and collaborative note-taking use cases.',
      },
      {
        question: 'Are results public?',
        answer: 'No personal response data is exposed on public content pages. The public site focuses on entry into the recommendation flow rather than sharing private answers.',
      },
      {
        question: 'When should notes live inside a broader workspace instead of a dedicated notes app?',
        answer: 'Usually when collaboration, linked documentation, and workflow context matter more than personal knowledge depth. Dedicated note tools tend to fit better when the priority is individual capture and retrieval rather than shared operating context.',
      },
    ],
  },
  {
    slug: 'knowledge-base',
    pageType: 'category',
    title: 'Knowledge Base Software Recommendations',
    metaTitle: 'Internal Wiki and Knowledge Base Tools | ToolMatch AI',
    metaDescription: 'Compare internal wiki and documentation platforms with a structured recommendation flow tuned for team knowledge management.',
    intro: 'Knowledge systems fail when the tool does not match the way a team writes, searches, and maintains documentation. ToolMatch AI helps narrow that fit.',
    ctaLabel: 'Start knowledge-base quiz',
    decisionCriteria: [
      {
        label: 'Authoring habits',
        detail: 'The best tool depends on whether the team will write often, co-edit actively, and maintain documentation as part of normal operations.',
      },
      {
        label: 'Search trust',
        detail: 'If people cannot reliably find current answers, the knowledge base will degrade regardless of how polished the publishing experience looks.',
      },
      {
        label: 'Permissions and publishing',
        detail: 'Some teams need an internal-only wiki, while others need a mix of internal docs, external help content, and tighter governance over what becomes visible.',
      },
    ],
    bestFitSummary: 'Best for teams that need to choose knowledge tooling based on how documentation is authored, maintained, searched, and trusted day to day.',
    watchOutSummary: 'Watch out for overvaluing the visual polish of a documentation platform if the team is more likely to fail on maintenance habits, permissions, or search quality.',
    sections: [
      {
        heading: 'Documentation fit matters',
        body: 'Good knowledge-base selection balances authoring ergonomics, search quality, permissions, and the day-to-day friction of keeping docs current.',
      },
      {
        heading: 'Guided entry points',
        body: 'Category pages, FAQ content, and the questionnaire work together so visitors can choose a low-friction path into recommendations.',
      },
      {
        heading: 'Search and maintenance matter more than publishing polish',
        body: 'A knowledge base only works when people can find trusted answers quickly and keep them current without extra ceremony. For many teams, the real buying question is whether the tool encourages healthy maintenance habits, not whether it looks polished in a demo.',
      },
    ],
    faqItems: [
      {
        question: 'Does ToolMatch AI replace a CMS?',
        answer: 'No. This public surface is template-driven and focused on discovery and qualification, not on managing editorial content at scale.',
      },
      {
        question: 'Why include compliance pages on a recommendation site?',
        answer: 'Trust and deployability matter. Privacy, terms, cookie notice, and affiliate disclosure pages make the site operationally more realistic.',
      },
      {
        question: 'Should internal documentation and customer help content live in the same tool?',
        answer: 'Sometimes, but not always. The right answer depends on permissions, publishing workflows, support operations, and whether the team can realistically maintain one shared system without adding friction.',
      },
    ],
  },
  {
    slug: 'design',
    pageType: 'category',
    title: 'Design Tool Recommendations',
    metaTitle: 'Design Software Recommendations for Product and Brand Teams | ToolMatch AI',
    metaDescription: 'Explore design software matches with a guided shortlist built around collaboration, prototyping, and workflow priorities.',
    intro: 'Design teams need tools that fit collaboration patterns, asset workflows, and speed requirements. The public funnel is designed to separate those needs quickly.',
    ctaLabel: 'Start design quiz',
    decisionCriteria: [
      {
        label: 'Design depth',
        detail: 'Specialist product and interface design work needs different tooling than fast brand asset production and lightweight creative collaboration.',
      },
      {
        label: 'Review workflow',
        detail: 'The right tool changes when multiple stakeholders need to comment, iterate, approve, and hand off work across teams.',
      },
      {
        label: 'Team participation',
        detail: 'Some tools assume specialist users, while others are designed for broader participation across marketing, product, and non-design collaborators.',
      },
    ],
    bestFitSummary: 'Best for teams separating deep product-design needs from faster creative production needs, while still accounting for collaboration and review patterns.',
    watchOutSummary: 'Watch out for using a general creative tool as the default answer if the team really needs prototyping depth, structured handoff, and stronger design-system support.',
    sections: [
      {
        heading: 'More than feature comparison',
        body: 'Recommendations prioritize workflow fit and team context rather than pretending every design buyer should use the same stack.',
      },
      {
        heading: 'Built for action',
        body: 'Visitors can move from category understanding into a structured quiz or open-ended chat without losing the thread of what they were evaluating.',
      },
      {
        heading: 'Product design and brand production do not need the same tool',
        body: 'Some design teams need prototyping depth, collaborative iteration, and system-level precision, while others primarily need fast brand asset creation and broad team participation. The better shortlist depends on which work dominates the day-to-day reality.',
      },
    ],
    faqItems: [
      {
        question: 'Does ToolMatch AI evaluate prototyping and collaboration needs?',
        answer: 'Yes. Priority capture is one of the explicit structured signals used to shape recommendations.',
      },
      {
        question: 'Are these public pages indexable?',
        answer: 'Yes. Category and comparison routes are intended to be crawlable and include metadata, canonical URLs, and internal links.',
      },
      {
        question: 'How important is versioning and review workflow in design tool selection?',
        answer: 'It matters whenever multiple stakeholders are iterating on the same work. Teams with heavier collaboration and handoff requirements usually need stronger review, commenting, and history patterns than a simple asset editor can provide.',
      },
    ],
  },
  {
    slug: 'scheduling',
    pageType: 'category',
    title: 'Scheduling Software Recommendations',
    metaTitle: 'Scheduling and Booking Tools Compared | ToolMatch AI',
    metaDescription: 'Compare scheduling software with a short guided flow built for appointment booking, calendar routing, and team coordination use cases.',
    intro: 'Scheduling tools look similar until booking logic, calendar routing, and team coordination become operational bottlenecks. ToolMatch AI helps narrow that fit.',
    ctaLabel: 'Start scheduling quiz',
    decisionCriteria: [
      {
        label: 'Booking model',
        detail: 'Solo appointment booking, team round-robin routing, and service-oriented customer scheduling each point toward different tools and priorities.',
      },
      {
        label: 'Workflow integration',
        detail: 'Scheduling often stops being simple when reminders, payments, CRM sync, qualification, or follow-up steps need to connect behind the scenes.',
      },
      {
        label: 'Customer experience',
        detail: 'The best fit depends on whether the scheduler is mainly an internal convenience layer or a more central part of the customer-facing experience.',
      },
    ],
    bestFitSummary: 'Best for teams evaluating scheduling software based on routing logic, operational importance, and how much the booking experience affects revenue or service delivery.',
    watchOutSummary: 'Watch out for assuming all schedulers are interchangeable. Once routing, payments, reminders, and integrations matter, the wrong choice can create avoidable operational friction.',
    sections: [
      {
        heading: 'Appointment flow fit',
        body: 'The questionnaire captures whether you need solo booking, team routing, or a broader customer-facing scheduling experience.',
      },
      {
        heading: 'Better than a generic shortlist',
        body: 'Instead of guessing from listicles, visitors can move into a deterministic flow that asks only for the information needed to rank likely matches.',
      },
      {
        heading: 'Booking logic can shape revenue and operations',
        body: 'Scheduling tools stop being interchangeable once round-robin routing, paid appointments, reminders, follow-up automation, and calendar ownership become operationally important. The best fit depends on how central booking is to the business, not just on surface-level availability links.',
      },
    ],
    faqItems: [
      {
        question: 'Can the guided flow adapt based on my answers?',
        answer: 'Yes. The active questionnaire supports branching so visitors do not all see the same sequence of questions.',
      },
      {
        question: 'What happens after I complete the quiz?',
        answer: 'The answers are transformed into recommendation context and passed into the existing ranking pipeline to return a shortlist.',
      },
      {
        question: 'Do I need advanced routing and integrations from the start?',
        answer: 'Not always. Some teams only need reliable self-serve booking, while others need deeper routing, payment, CRM, or workflow integrations very early. The recommendation path is designed to separate those cases quickly.',
      },
    ],
  },
];

export const comparisonPages: ComparisonPageContent[] = [
  {
    slug: 'hubspot-vs-pipedrive',
    pageType: 'comparison',
    title: 'HubSpot vs Pipedrive',
    metaTitle: 'HubSpot vs Pipedrive Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare HubSpot and Pipedrive through a buyer-focused guide, then move into the quiz or chat for a more specific CRM shortlist.',
    intro: 'This comparison page exists for CRM buyers weighing HubSpot against Pipedrive who want a quick framing before moving into the interactive recommendation flow.',
    sections: [
      {
        heading: 'Where HubSpot usually fits better',
        body: 'HubSpot tends to appeal to teams that want broader lifecycle coverage across sales, marketing, and customer management, especially when they value an all-in-one growth stack over a narrower sales tool.',
      },
      {
        heading: 'Where Pipedrive usually fits better',
        body: 'Pipedrive is often a better fit for teams that care most about pipeline clarity, sales execution speed, and a more focused CRM operating model without paying for broader platform scope too early.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The right choice usually comes down to budget tolerance, reporting depth, implementation appetite, and whether your team needs a lightweight pipeline tool or a more expansive customer platform.',
      },
    ],
    faqItems: [
      {
        question: 'Does this page pick a single winner between HubSpot and Pipedrive?',
        answer: 'No. It is meant to capture comparison intent and route you into the quiz or chat so the shortlist can reflect your budget, team size, and operational priorities.',
      },
    ],
  },
  {
    slug: 'salesforce-vs-hubspot',
    pageType: 'comparison',
    title: 'Salesforce vs HubSpot',
    metaTitle: 'Salesforce vs HubSpot Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Salesforce and HubSpot with a buyer-focused guide, then move into the quiz or chat for a shortlist that matches your sales process.',
    intro: 'This page is built for teams choosing between Salesforce and HubSpot who need a quick framing on complexity, budget, and operating model before entering the recommendation flow.',
    sections: [
      {
        heading: 'Where Salesforce tends to fit better',
        body: 'Salesforce often fits organizations with heavier customization, deeper revops needs, and the internal capacity to support a more configurable CRM environment.',
      },
      {
        heading: 'Where HubSpot tends to fit better',
        body: 'HubSpot is usually more attractive for teams that want faster time to value, a more unified go-to-market platform, and less implementation overhead early on.',
      },
      {
        heading: 'What should drive the decision',
        body: 'The right shortlist depends on process complexity, reporting needs, admin capacity, and whether your team benefits more from flexibility or speed of adoption.',
      },
    ],
    faqItems: [
      {
        question: 'Is Salesforce automatically the better fit for larger teams?',
        answer: 'Not always. Larger teams still need to weigh admin overhead, rollout speed, and whether they will actually use the added complexity.',
      },
    ],
  },
  {
    slug: 'best-crm-for-small-teams',
    pageType: 'comparison',
    title: 'Best CRM for Small Teams',
    metaTitle: 'Best CRM for Small Teams: Guided Shortlist | ToolMatch AI',
    metaDescription: 'Use ToolMatch AI to narrow CRM options for a small team based on budget, adoption, and reporting needs.',
    intro: 'This comparison page is designed for small-team CRM buyers who need a structured path into a shortlist instead of a long vendor grid.',
    sections: [
      {
        heading: 'Why small teams need a different shortlist',
        body: 'Smaller sales teams usually care more about speed to value, simplicity, and pricing sensitivity than about enterprise-grade breadth.',
      },
      {
        heading: 'Use the guided path',
        body: 'Start with the questionnaire when you want structure, or switch to chat if you already know the workflow constraints you want to describe.',
      },
    ],
    faqItems: [
      {
        question: 'Is this page a static winner list?',
        answer: 'No. It is an SEO-friendly entry page that leads into the interactive matching flows where the shortlist becomes specific to the buyer.',
      },
    ],
  },
  {
    slug: 'asana-vs-clickup',
    pageType: 'comparison',
    title: 'Asana vs ClickUp',
    metaTitle: 'Asana vs ClickUp Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Asana and ClickUp based on workflow clarity, flexibility, and team operating style before moving into a guided shortlist.',
    intro: 'This comparison page is for project management buyers deciding between Asana and ClickUp who want quick context before entering the interactive recommendation flow.',
    sections: [
      {
        heading: 'Where Asana usually fits better',
        body: 'Asana often works well for teams that want cleaner structure, clearer execution patterns, and less appetite for configuring a highly flexible workspace.',
      },
      {
        heading: 'Where ClickUp usually fits better',
        body: 'ClickUp can be a stronger fit when teams want more surface area in one tool and are willing to trade some simplicity for flexibility and consolidation.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'Your choice usually comes down to tolerance for complexity, reporting expectations, and whether the team needs a straightforward operating model or a more expansive work hub.',
      },
    ],
    faqItems: [
      {
        question: 'Does this page replace a hands-on trial?',
        answer: 'No. It is meant to narrow the field faster so trial time is spent on the tools most likely to match your workflow.',
      },
    ],
  },
  {
    slug: 'monday-vs-asana',
    pageType: 'comparison',
    title: 'Monday.com vs Asana',
    metaTitle: 'Monday.com vs Asana Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Monday.com and Asana by structure, flexibility, and team operating style before moving into a guided shortlist.',
    intro: 'This page is for project-management buyers deciding between Monday.com and Asana who want a quick framing before moving into the recommendation flow.',
    sections: [
      {
        heading: 'Where Monday.com usually fits better',
        body: 'Monday.com often appeals to teams that want more visual customization, broader workflow configuration, and a workspace that can flex beyond classic task management.',
      },
      {
        heading: 'Where Asana usually fits better',
        body: 'Asana is often the better fit for teams that value execution clarity, cleaner defaults, and a more disciplined project operating model with less setup overhead.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The best fit depends on whether your team values structure or configurability more, plus how much operational overhead you are willing to take on to get broader workspace flexibility.',
      },
    ],
    faqItems: [
      {
        question: 'Do these tools fit the same kinds of teams?',
        answer: 'Often they overlap, but the better choice usually depends on how opinionated the team wants the workflow to be and how much flexibility they actually plan to use.',
      },
    ],
  },
  {
    slug: 'notion-vs-confluence-alternative-guide',
    pageType: 'comparison',
    title: 'Knowledge Tool Alternatives Guide',
    metaTitle: 'Knowledge Tool Alternatives Guide | ToolMatch AI',
    metaDescription: 'Explore a knowledge-tool alternatives guide that routes visitors into interactive recommendations instead of forcing a one-size-fits-all answer.',
    intro: 'Comparison intent is high-signal. This guide exists to capture that intent and move visitors into a structured recommendation path.',
    sections: [
      {
        heading: 'Comparison without overclaiming',
        body: 'This public site avoids pretending there is one universal winner and instead uses interactive context capture to narrow the fit.',
      },
      {
        heading: 'What happens next',
        body: 'Visitors can jump directly into the quiz or talk to Arlo with the comparison framing already in mind.',
      },
    ],
    faqItems: [
      {
        question: 'Does ToolMatch AI provide legal or procurement advice?',
        answer: 'No. The public site provides recommendation and comparison scaffolding only, not legal, procurement, or finance advice.',
      },
    ],
  },
  {
    slug: 'notion-vs-obsidian',
    pageType: 'comparison',
    title: 'Notion vs Obsidian',
    metaTitle: 'Notion vs Obsidian Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Notion and Obsidian by collaboration, structure, and knowledge workflow before moving into a guided recommendation path.',
    intro: 'This page is for note-taking and knowledge-management buyers deciding between Notion and Obsidian who want a practical framing before using the quiz or chat.',
    sections: [
      {
        heading: 'Where Notion usually fits better',
        body: 'Notion tends to fit teams that want collaborative workspaces, shared documentation, and lighter workflow building in the same environment as their notes.',
      },
      {
        heading: 'Where Obsidian usually fits better',
        body: 'Obsidian often fits individual-heavy knowledge workflows where local-first note ownership, linking depth, and personal knowledge structure matter more than team collaboration.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The real distinction is usually collaboration versus depth of personal knowledge management, not a simple feature checklist.',
      },
    ],
    faqItems: [
      {
        question: 'Is one of these always better for teams?',
        answer: 'Not automatically. Team collaboration usually pushes buyers toward Notion, but some teams still prefer lighter shared systems around a more personal note workflow.',
      },
    ],
  },
  {
    slug: 'zendesk-vs-freshdesk',
    pageType: 'comparison',
    title: 'Zendesk vs Freshdesk',
    metaTitle: 'Zendesk vs Freshdesk Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Zendesk and Freshdesk by support complexity, budget, and team maturity before entering a guided recommendation flow.',
    intro: 'This page is designed for support leaders comparing Zendesk and Freshdesk who want a practical framing before starting the quiz or chat.',
    sections: [
      {
        heading: 'Where Zendesk usually fits better',
        body: 'Zendesk often appeals to teams with more mature support operations, deeper routing and workflow requirements, and a willingness to invest in a broader support stack.',
      },
      {
        heading: 'Where Freshdesk usually fits better',
        body: 'Freshdesk is often attractive to teams that want faster setup, lower operational friction, and a support platform that can meet common needs without a heavier rollout.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'Ticket complexity, staffing model, automation needs, and budget discipline typically matter more than a generic feature count when narrowing support tools.',
      },
    ],
    faqItems: [
      {
        question: 'Can a smaller team still justify Zendesk?',
        answer: 'Yes, but only when the workflow complexity or support maturity really warrants it. That is exactly the kind of tradeoff the guided flow is meant to surface.',
      },
    ],
  },
  {
    slug: 'intercom-vs-zendesk',
    pageType: 'comparison',
    title: 'Intercom vs Zendesk',
    metaTitle: 'Intercom vs Zendesk Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Intercom and Zendesk by support model, messaging workflow, and team maturity before entering a guided shortlist.',
    intro: 'This comparison page is for teams deciding between Intercom and Zendesk who need a quick framing on conversational support versus broader help desk operations.',
    sections: [
      {
        heading: 'Where Intercom usually fits better',
        body: 'Intercom tends to fit teams centered on conversational support, proactive messaging, and customer communication flows that blend sales, onboarding, and support.',
      },
      {
        heading: 'Where Zendesk usually fits better',
        body: 'Zendesk often fits teams that need more mature ticketing operations, deeper workflow routing, and a more classic support-platform foundation.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The decision usually depends on whether your support motion is conversation-led or operations-led, plus how much structure the team needs behind the scenes.',
      },
    ],
    faqItems: [
      {
        question: 'Can a team use Intercom as a full support platform?',
        answer: 'Sometimes, but it depends on ticket complexity, reporting needs, and whether the support team needs heavier workflow and queue management.',
      },
    ],
  },
  {
    slug: 'zapier-vs-make',
    pageType: 'comparison',
    title: 'Zapier vs Make',
    metaTitle: 'Zapier vs Make Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Zapier and Make by ease of use, automation depth, and operational ownership before moving into a guided shortlist.',
    intro: 'This page is for automation buyers deciding between Zapier and Make who want a fast framing before entering the recommendation flow.',
    sections: [
      {
        heading: 'Where Zapier usually fits better',
        body: 'Zapier often works well for teams that want fast setup, broad app coverage, and low-friction automation wins without a steep learning curve.',
      },
      {
        heading: 'Where Make usually fits better',
        body: 'Make tends to fit teams that need more complex logic, richer scenario design, and more control over how automations are built and monitored.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The best choice usually comes down to how technical the team is, how complex the workflows are, and whether faster setup or deeper control matters more.',
      },
    ],
    faqItems: [
      {
        question: 'Is Make always the better option for complex workflows?',
        answer: 'Not always. More flexibility only helps when the team can own it and the workflow complexity actually justifies the extra operational surface area.',
      },
    ],
  },
  {
    slug: 'calendly-vs-acuity-scheduling',
    pageType: 'comparison',
    title: 'Calendly vs Acuity Scheduling',
    metaTitle: 'Calendly vs Acuity Scheduling Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Calendly and Acuity Scheduling by booking flow, customer experience, and team coordination before moving into a guided shortlist.',
    intro: 'This page is for scheduling-software buyers deciding between Calendly and Acuity Scheduling who want a quick framing before using the quiz or chat.',
    sections: [
      {
        heading: 'Where Calendly usually fits better',
        body: 'Calendly often fits teams that want a simple, widely adopted booking flow with low friction for internal meetings, routing, and basic coordination.',
      },
      {
        heading: 'Where Acuity Scheduling usually fits better',
        body: 'Acuity Scheduling can be a stronger fit when the booking workflow is more service-oriented and the customer-facing scheduling experience needs more business-specific structure.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The real difference is often internal meeting coordination versus a more appointment-centered service workflow, plus the amount of customer-facing scheduling control you need.',
      },
    ],
    faqItems: [
      {
        question: 'Are these tools only for solo booking?',
        answer: 'No. Both can support teams, but the better fit depends on whether you need lightweight coordination or a more tailored appointment experience.',
      },
    ],
  },
  {
    slug: 'figma-vs-canva-for-teams',
    pageType: 'comparison',
    title: 'Figma vs Canva for Teams',
    metaTitle: 'Figma vs Canva for Teams Comparison Guide | ToolMatch AI',
    metaDescription: 'Compare Figma and Canva for Teams by design depth, collaboration style, and workflow needs before moving into a guided shortlist.',
    intro: 'This comparison page is for design-software buyers deciding between Figma and Canva for Teams who want a quick practical framing before entering the recommendation flow.',
    sections: [
      {
        heading: 'Where Figma usually fits better',
        body: 'Figma often fits product and design teams that need interface design depth, collaborative iteration, and a workflow centered on design systems and prototyping.',
      },
      {
        heading: 'Where Canva for Teams usually fits better',
        body: 'Canva for Teams often fits marketing and brand-heavy teams that want fast asset production, low training overhead, and broad participation beyond specialist designers.',
      },
      {
        heading: 'What should decide the shortlist',
        body: 'The choice usually comes down to specialist design depth versus speed and accessibility across a wider team, not just which tool has more features.',
      },
    ],
    faqItems: [
      {
        question: 'Can a team use both tools?',
        answer: 'Yes, but this page exists to help decide which tool should own the core workflow rather than defaulting to an overlapping stack too early.',
      },
    ],
  },
];

export const compliancePages: CompliancePageContent[] = [
  {
    slug: 'privacy',
    pageType: 'compliance',
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | ToolMatch AI',
    metaDescription: 'Template privacy policy for ToolMatch AI covering analytics, recommendation interactions, and contact with affiliate destinations.',
    intro: 'This privacy policy template explains how ToolMatch AI handles interaction data, analytics, and recommendation-related click tracking. It is provided as a template and not legal advice.',
    sections: [
      {
        heading: 'What information may be processed',
        body: 'ToolMatch AI may store questionnaire answers, chat messages, recommendation events, click-tracking metadata, and aggregated analytics needed to operate the site and evaluate recommendation quality.',
      },
      {
        heading: 'Affiliate and analytics considerations',
        body: 'Outbound recommendation clicks may include tracking identifiers that help attribute visits and conversions. Analytics and session data may be used to understand engagement and product performance.',
      },
      {
        heading: 'Template disclaimer',
        body: 'This page is a deployment-ready template for a portfolio and demo project. It is not legal advice and should be reviewed before production use.',
      },
    ],
  },
  {
    slug: 'terms',
    pageType: 'compliance',
    title: 'Terms of Use',
    metaTitle: 'Terms of Use | ToolMatch AI',
    metaDescription: 'Template terms of use for the ToolMatch AI recommendation experience.',
    intro: 'These terms outline baseline usage expectations for the public ToolMatch AI recommendation experience. They are provided as a template and not legal advice.',
    sections: [
      {
        heading: 'Service scope',
        body: 'ToolMatch AI provides software-recommendation content, interactive questionnaires, and chat-based guidance. It does not guarantee vendor suitability or procurement outcomes.',
      },
      {
        heading: 'Affiliate relationships',
        body: 'Some outbound links may be affiliate links that generate commissions when users click through and complete partner-defined actions.',
      },
      {
        heading: 'Template disclaimer',
        body: 'These terms are a project template only and should be reviewed and adapted before production deployment.',
      },
    ],
  },
  {
    slug: 'affiliate-disclosure',
    pageType: 'compliance',
    title: 'Affiliate Disclosure',
    metaTitle: 'Affiliate Disclosure | ToolMatch AI',
    metaDescription: 'Understand how ToolMatch AI may earn commissions from partner links and how those links are used in recommendations.',
    intro: 'ToolMatch AI may earn commissions when visitors click certain recommendation links and later complete partner-defined actions. This disclosure is provided to make that commercial relationship explicit.',
    sections: [
      {
        heading: 'How affiliate relationships work',
        body: 'Recommendations may link to partner sites using trackable URLs or sub-IDs. Those identifiers help attribute clicks and later conversion events where partner programs support them.',
      },
      {
        heading: 'How recommendations are generated',
        body: 'The system uses structured questionnaire answers, chat context, and deterministic ranking logic to suggest tools. Commercial relationships do not guarantee a recommendation position.',
      },
      {
        heading: 'Template disclaimer',
        body: 'This disclosure is a production-style template and should be reviewed for legal and network-specific compliance before deployment.',
      },
    ],
  },
  {
    slug: 'cookie-notice',
    pageType: 'compliance',
    title: 'Cookie and Tracking Notice',
    metaTitle: 'Cookie and Tracking Notice | ToolMatch AI',
    metaDescription: 'Template notice describing analytics, session storage, and tracking identifiers used by ToolMatch AI.',
    intro: 'This cookie and tracking notice explains the basic analytics, session storage, and identifier patterns used by ToolMatch AI. It is a template and not legal advice.',
    sections: [
      {
        heading: 'Session and questionnaire continuity',
        body: 'The site may store lightweight session identifiers in the browser to preserve quiz state, recommendation context, and click attribution continuity.',
      },
      {
        heading: 'Analytics and click measurement',
        body: 'The site may collect analytics and outbound-click metadata to understand how visitors engage with recommendations and where the experience can be improved.',
      },
      {
        heading: 'Template disclaimer',
        body: 'This notice is a template for a demo affiliate property and should be reviewed before production use.',
      },
    ],
  },
];

export const siteFaqItems: FaqItem[] = [
  {
    question: 'What is ToolMatch AI?',
    answer: 'ToolMatch AI is an interactive software-recommendation site that uses a guided questionnaire and chat flow to shortlist tools by use case, budget, team size, and priorities.',
  },
  {
    question: 'How are recommendations generated?',
    answer: 'Recommendations are based on structured questionnaire answers or conversational context, then ranked by the existing deterministic recommendation pipeline and supporting offer metadata.',
  },
  {
    question: 'Does ToolMatch AI use affiliate links?',
    answer: 'Yes. Some outbound links may generate commissions. Affiliate disclosure is surfaced both near recommendation CTAs and on the disclosure page.',
  },
];

export function getCategoryPage(slug: string) {
  return categoryPages.find((page) => page.slug === slug);
}

export function getComparisonPage(slug: string) {
  return comparisonPages.find((page) => page.slug === slug);
}

export function getCompliancePage(slug: string) {
  return compliancePages.find((page) => page.slug === slug);
}

export function buildPageUrl(pathname: string) {
  return new URL(pathname, siteBaseUrl).toString();
}

export function buildMetadata(input: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  const canonical = buildPageUrl(input.pathname);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      type: 'website',
      url: canonical,
      siteName: 'ToolMatch AI',
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
    },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqSchema(faqItems: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ToolMatch AI',
    url: siteBaseUrl,
    description: 'AI-assisted software recommendation site with guided questionnaire and chat-based discovery.',
  };
}

export const publicNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/category', label: 'Categories' },
  { href: '/compare', label: 'Comparisons' },
  { href: '/faq', label: 'FAQ' },
];

export const footerLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
  { href: '/cookie-notice', label: 'Cookie Notice' },
];

export const featuredCategories = categoryPages.map((page) => ({
  href: `/category/${page.slug}`,
  quizHref: `/quiz?category=${page.slug}`,
  label: SUPPORTED_USE_CASE_LABELS[page.slug],
  title: page.title,
  description: page.metaDescription,
  bestFitSummary: page.bestFitSummary,
  watchOutSummary: page.watchOutSummary,
  ctaLabel: page.ctaLabel,
}));