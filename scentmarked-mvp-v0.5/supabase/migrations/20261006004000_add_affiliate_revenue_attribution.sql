alter table public.monetization_transactions
 add column if not exists affiliate_offer_id bigint references public.perfume_affiliate_offers(id) on delete set null,
 add column if not exists affiliate_click_id bigint references public.affiliate_clicks(id) on delete set null,
 add column if not exists affiliate_merchant text,
 add column if not exists affiliate_placement text;
create index if not exists monetization_affiliate_offer_idx on public.monetization_transactions(affiliate_offer_id) where revenue_type='affiliate';
create index if not exists monetization_affiliate_click_idx on public.monetization_transactions(affiliate_click_id) where revenue_type='affiliate';
