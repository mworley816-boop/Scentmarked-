create or replace function public.sync_member_to_crm_contact()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  member_email text;
  member_name text;
  existing_contact_id uuid;
begin
  member_email:=nullif(pg_catalog.trim(new.email),'');
  if member_email is null then return new; end if;
  member_name:=nullif(pg_catalog.trim(pg_catalog.coalesce(new.raw_user_meta_data->>'display_name','')),'');

  select id into existing_contact_id
  from public.crm_contacts
  where user_id=new.id
     or (pg_catalog.lower(email)=pg_catalog.lower(member_email) and user_id is null)
  order by case when user_id=new.id then 0 else 1 end
  limit 1;

  if existing_contact_id is not null then
    update public.crm_contacts
    set user_id=new.id,email=member_email,first_name=pg_catalog.coalesce(first_name,member_name),updated_at=pg_catalog.now()
    where id=existing_contact_id;
  else
    insert into public.crm_contacts(user_id,email,first_name,source,status,marketing_consent)
    values(new.id,member_email,member_name,'scentmarked_member','active',false);
  end if;
  return new;
end $$;

revoke execute on function public.sync_member_to_crm_contact() from public,anon,authenticated;
