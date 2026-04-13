-- City-level daily-fee guides for parent decision support.
-- Uses median daily fee midpoint across active provider listings.

create index if not exists provider_profiles_city_status_idx
  on public.provider_profiles (city_id, listing_status);

create index if not exists provider_profiles_active_daily_city_idx
  on public.provider_profiles (city_id, daily_fee_from, daily_fee_to)
  where listing_status = 'active'
    and (daily_fee_from is not null or daily_fee_to is not null);

drop view if exists public.city_monthly_cost_guides;

create view public.city_monthly_cost_guides as
with active_provider_daily_costs as (
  select
    pp.profile_id,
    pp.city_id,
    case
      when pp.daily_fee_from is not null and pp.daily_fee_to is not null
        then ((pp.daily_fee_from + pp.daily_fee_to)::numeric / 2)
      else coalesce(pp.daily_fee_from, pp.daily_fee_to)::numeric
    end as daily_fee_value
  from public.provider_profiles pp
  where pp.listing_status = 'active'
)
select
  c.id as city_id,
  c.name as city_name,
  c.slug as city_slug,
  co.id as country_id,
  co.code as country_code,
  co.name as country_name,
  count(ap.profile_id)::integer as provider_count,
  count(ap.daily_fee_value)::integer as providers_with_pricing_count,
  case
    when count(ap.daily_fee_value) > 0 then
      round(
        (percentile_cont(0.5) within group (order by ap.daily_fee_value))::numeric,
        0
      )::integer
    else null
  end as median_daily_fee,
  case
    when count(ap.daily_fee_value) > 0 then
      round(
        (
          percentile_cont(0.5) within group (order by ap.daily_fee_value)
        )::numeric * 22,
        0
      )::integer
    else null
  end as estimated_monthly_fee
from public.cities c
join public.countries co on co.id = c.country_id
left join active_provider_daily_costs ap on ap.city_id = c.id
where c.is_active = true
group by c.id, c.name, c.slug, co.id, co.code, co.name;
