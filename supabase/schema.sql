create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null check (char_length(username) between 1 and 80)
);

create unique index if not exists profiles_username_lower_unique
    on public.profiles (lower(username));

create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid()
        references auth.users (id) on delete cascade,
    message text not null check (char_length(message) between 1 and 4000),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
    on public.profiles for select
    to authenticated
    using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

drop policy if exists "Users can read their own notes" on public.notes;
create policy "Users can read their own notes"
    on public.notes for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own notes" on public.notes;
create policy "Users can create their own notes"
    on public.notes for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
    on public.notes for delete
    to authenticated
    using ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.notes to authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    requested_username text;
begin
    requested_username := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
    if requested_username = '' then
        requested_username := 'user-' || left(new.id::text, 8);
    end if;

    insert into public.profiles (id, username)
    values (new.id, requested_username);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
    after insert on auth.users
    for each row execute function public.create_profile_for_new_user();
