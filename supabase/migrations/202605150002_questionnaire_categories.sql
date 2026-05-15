alter table questionnaires
  add column if not exists category text;

drop index if exists questionnaires_one_active_idx;

create unique index if not exists questionnaires_one_active_per_category_idx
  on questionnaires ((coalesce(category, '__global__')))
  where is_active = true;

create index if not exists questionnaires_category_idx
  on questionnaires (category, updated_at desc);