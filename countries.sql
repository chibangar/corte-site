create table public.download_countries (
  country text primary key check (country ~ '^[A-Z]{2}$'),
  clicks bigint not null default 0 check (clicks >= 0)
);
alter table public.download_countries enable row level security;
revoke all on public.download_countries from anon, authenticated;
grant select on public.download_countries to anon;
create policy "Public country totals" on public.download_countries for select to anon using (true);

-- Narrow anonymous counter operation: visitors cannot replace or delete totals.
create function public.record_country_download(country_code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if country_code is null or country_code !~ '^[A-Z]{2}$' then
    raise exception 'Invalid country';
  end if;
  insert into public.download_countries(country, clicks) values (country_code, 1)
  on conflict (country) do update set clicks = public.download_countries.clicks + 1;
end;
$$;
revoke all on function public.record_country_download(text) from public, anon, authenticated;
grant execute on function public.record_country_download(text) to anon;
