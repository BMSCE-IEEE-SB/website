-- Migration: Support SAC admin role and synchronize role from admin_whitelist to admins

-- 1. Update sync_admin_from_whitelist to persist the designated role instead of hardcoding 'admin'
create or replace function public.sync_admin_from_whitelist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.admins a using auth.users u
      where a.id = u.id and lower(u.email) = lower(old.email);
    return old;
  end if;

  if tg_op = 'UPDATE' and lower(old.email) <> lower(new.email) then
    delete from public.admins a using auth.users u
      where a.id = u.id and lower(u.email) = lower(old.email);
  end if;

  delete from public.admins a using auth.users u
    where a.id = u.id and lower(u.email) = lower(new.email) and not exists (
      select 1 from public.admin_whitelist w where lower(w.email) = lower(new.email)
    );

  insert into public.admins (id, full_name, role)
    select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), coalesce(new.role, 'admin')
    from auth.users u where lower(u.email) = lower(new.email)
    on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

  return new;
end;
$$;
revoke all on function public.sync_admin_from_whitelist() from public, anon, authenticated;

-- 2. Update provision_admin_for_auth_user to carry forward whitelist role
create or replace function public.provision_admin_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role from public.admin_whitelist w where lower(w.email) = lower(new.email);
  if v_role is not null then
    insert into public.admins (id, full_name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(v_role, 'admin'))
    on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
  end if;
  return new;
end;
$$;
revoke all on function public.provision_admin_for_auth_user() from public, anon, authenticated;

-- 3. Update sync_admin_email_change to carry forward whitelist role
create or replace function public.sync_admin_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if lower(coalesce(old.email, '')) <> lower(coalesce(new.email, '')) then
    select role into v_role from public.admin_whitelist w where lower(w.email) = lower(new.email);
    if v_role is not null then
      insert into public.admins (id, full_name, role)
      values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(v_role, 'admin'))
      on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
    else
      delete from public.admins where id = new.id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_admin_email_change() from public, anon, authenticated;

-- 4. Sync existing roles from whitelist to admins
update public.admins a
set role = w.role
from auth.users u
join public.admin_whitelist w on lower(w.email) = lower(u.email)
where a.id = u.id and coalesce(a.role, '') <> coalesce(w.role, '');

-- 5. Seed SAC role administrators
insert into public.admin_whitelist (email, role)
values
  ('shreyamurali.ec25@bmsce.ac.in', 'sac'),
  ('mirzaareeb.ec25@bmsce.ac.in', 'sac'),
  ('manasaprabhu.ai25@bmsce.ac.in', 'sac'),
  ('niharikachauhan.bs25@bmsce.ac.in', 'sac'),
  ('sahanadesai.bs25@bmsce.ac.in', 'sac'),
  ('soundaryaprashanthrao.cs25@bmsce.ac.in', 'sac'),
  ('sahanaganesh.cs25@bmsce.ac.in', 'sac'),
  ('lakinanadeepak.cs25@bmsce.ac.in', 'sac'),
  ('thrisha.cd25@bmsce.ac.in', 'sac'),
  ('sharathchandras.ec25@bmsce.ac.in', 'sac'),
  ('srujangv.ec25@bmsce.ac.in', 'sac'),
  ('thanishashree.cs25@bmsce.ac.in', 'sac'),
  ('vedavansika.me25@bmsce.ac.in', 'sac')
on conflict (email) do update set role = excluded.role;
