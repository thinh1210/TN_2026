-- Chạy script này trong Supabase SQL Editor nếu bạn muốn đồng bộ dữ liệu lên Supabase thay vì chỉ lưu local JSON.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  slug text not null unique,
  custom_greeting text,
  created_at timestamptz not null default now()
);

insert into public.invitations (guest_name, slug, custom_greeting)
values (
  'Khách Mời Mẫu',
  'tk-9f4a2c8e1b7d6035a2e4c9f8',
  'Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà).'
)
on conflict (slug) do nothing;

create table if not exists public.event_settings (
  id text primary key default 'default',
  host_name text not null default 'Thịnh',
  event_title text not null default 'Lễ Tốt Nghiệp',
  quote text not null default 'Trường Đại học Bách Khoa — ĐHQG-HCM',
  public_greeting text not null default 'Anh, chị, em',
  public_custom_greeting text not null default 'Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà).',
  is_tba boolean not null default false,
  event_date text not null default '',
  event_time text not null default '',
  location_name text not null default '',
  location_address text not null default '',
  map_url text not null default '',
  contact_phone text not null default '',
  parking_notes jsonb not null default '[]'::jsonb,
  closing_message text not null default 'Nếu có thời gian rảnh thì ghé chụp hình kỉ niệm với mình nhé. Liên hệ mình trước nhe (không cần mang quà).',
  theme text not null default 'hcmut-sky',
  updated_at timestamptz not null default now()
);

alter table public.event_settings
  add column if not exists public_greeting text not null default 'Anh, chị, em';

alter table public.event_settings
  add column if not exists public_custom_greeting text not null default 'Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà).';

insert into public.event_settings (
  id,
  host_name,
  event_title,
  quote,
  public_greeting,
  public_custom_greeting,
  is_tba,
  event_date,
  event_time,
  location_name,
  location_address,
  map_url,
  contact_phone,
  parking_notes,
  closing_message,
  theme
) values (
  'default',
  'Thịnh',
  'Lễ Tốt Nghiệp',
  'Trường Đại học Bách Khoa — ĐHQG-HCM',
  'Anh, chị, em',
  'Nếu bạn có thời gian rảnh thì hãy đến và chụp hình kỉ niệm với mình nhé (không cần mang quà).',
  false,
  'Thứ 7 28/11/2026',
  '10h-14h',
  'Đh Bách Khoa thành phố Hồ Chí Minh. Tòa nhà A3 (Tòa nhà khoa máy tính)/Thư viện trường',
  '268 Lý Thường Kiệt, Quận 10, TP HCM (BK cs1)',
  'https://maps.app.goo.gl/G5yWSnQSaWhiwbSF6',
  '0372904909',
  '["Cổng 1, Cổng 3 BK", "Rạp xiếc Phú Thọ :)))", "Mn đi có thể tham khảo chỗ gửi xe trước vì có thể khá đông"]'::jsonb,
  'Nếu có thời gian rảnh thì ghé chụp hình kỉ niệm với mình nhé. Liên hệ mình trước nhe (không cần mang quà).',
  'hcmut-sky'
)
on conflict (id) do update set
  host_name = excluded.host_name,
  event_title = excluded.event_title,
  quote = excluded.quote,
  public_greeting = excluded.public_greeting,
  public_custom_greeting = excluded.public_custom_greeting,
  is_tba = excluded.is_tba,
  event_date = excluded.event_date,
  event_time = excluded.event_time,
  location_name = excluded.location_name,
  location_address = excluded.location_address,
  map_url = excluded.map_url,
  contact_phone = excluded.contact_phone,
  parking_notes = excluded.parking_notes,
  closing_message = excluded.closing_message,
  theme = excluded.theme,
  updated_at = now();

create table if not exists public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  invite_slug text not null,
  guest_name text not null,
  attendance text not null check (attendance in ('attending', 'maybe', 'declined')),
  message text not null,
  header_info jsonb,
  created_at timestamptz not null default now()
);

-- Bật RLS & chính sách đơn giản (hoặc tuỳ chỉnh theo nhu cầu bảo mật production)
alter table public.invitations enable row level security;
alter table public.event_settings enable row level security;
alter table public.guest_messages enable row level security;

create policy "Allow public read invitations" on public.invitations for select using (true);
create policy "Allow public insert invitations" on public.invitations for insert with check (true);
create policy "Allow public delete invitations" on public.invitations for delete using (true);

create policy "Allow public read event_settings" on public.event_settings for select using (true);
create policy "Allow public upsert event_settings" on public.event_settings for all using (true) with check (true);

create policy "Allow public insert guest_messages" on public.guest_messages for insert with check (true);
create policy "Allow public read guest_messages" on public.guest_messages for select using (true);
create policy "Allow public delete guest_messages" on public.guest_messages for delete using (true);
