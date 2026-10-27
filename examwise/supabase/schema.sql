-- ExamWise schema. Run in Supabase → SQL Editor.

-- ===== Reference data (filled from your college website) =====
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  branch text not null default 'AI&DS',
  semester int not null,
  unique (code, branch, semester)
);

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  year int not null,
  exam_type text not null,            -- 'End-Semester' | 'Mid-Semester' | ...
  file_path text,                     -- path inside the 'papers' storage bucket
  source_url text,                    -- original URL on the college website
  pages int,
  size_mb numeric(5,1),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (subject_id, year, exam_type)
);

create table if not exists syllabus_units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  unit_no int not null,
  title text not null,
  unique (subject_id, unit_no)
);

create table if not exists syllabus_topics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references syllabus_units(id) on delete cascade,
  title text not null
);

-- ===== Per-user data =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  branch text default 'AI&DS',
  semester int default 5,
  created_at timestamptz not null default now()
);

create table if not exists topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references syllabus_topics(id) on delete cascade,
  done boolean not null default true,
  primary key (user_id, topic_id)
);

create table if not exists saved_papers (
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id uuid not null references papers(id) on delete cascade,
  primary key (user_id, paper_id)
);

-- ===== Row Level Security =====
alter table subjects        enable row level security;
alter table papers          enable row level security;
alter table syllabus_units  enable row level security;
alter table syllabus_topics enable row level security;
alter table profiles        enable row level security;
alter table topic_progress  enable row level security;
alter table saved_papers    enable row level security;

-- Logged-in students can read reference data. Writes only via service role (scraper / dashboard).
create policy "read subjects"  on subjects        for select to authenticated using (true);
create policy "read papers"    on papers          for select to authenticated using (true);
create policy "read units"     on syllabus_units  for select to authenticated using (true);
create policy "read topics"    on syllabus_topics for select to authenticated using (true);

create policy "own profile read"   on profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on profiles for update to authenticated using (id = auth.uid());
create policy "own progress"       on topic_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own saved"          on saved_papers   for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Create a profile row automatically on sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== OPTIONAL: enforce college-email-only sign-up on the server =====
-- Replace college.edu.in with your real domain, then uncomment.
-- create or replace function public.enforce_college_email() returns trigger
-- language plpgsql security definer as $$
-- begin
--   if new.email not ilike '%@college.edu.in' then
--     raise exception 'Only college email addresses can register';
--   end if;
--   return new;
-- end $$;
-- create trigger enforce_college_email before insert on auth.users
--   for each row execute function public.enforce_college_email();

-- ===== Storage: private bucket for PDFs =====
insert into storage.buckets (id, name, public) values ('papers', 'papers', false) on conflict do nothing;
create policy "students read papers bucket" on storage.objects for select to authenticated using (bucket_id = 'papers');
