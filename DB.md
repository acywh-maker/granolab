# granolab DB 설계

> PRD.md 를 바탕으로 만든 Supabase 설계예요. coroom 과 **같은 Supabase 프로젝트**를 쓰고, 헷갈리지 않게 모든 이름 앞에 `granolab_` 을 붙여요.
> 핵심 원칙: **신청자 개인정보는 누구도 직접 못 읽고, 공개되는 건 숫자뿐.**

---

## 한눈에 보기

```
 화면(누구나)                         DB
┌─────────────┐  신청하기   ┌──────────────────────────┐
│ 신청 폼       │ ─────────▶ │ granolab_apply()  (창구 함수) │──▶ granolab_applications (신청자 · 잠김 🔒)
└─────────────┘  "37번째"  │  · 정원 · 마감 · 중복 검사      │        ▲
       ▲      ◀───────── └──────────────────────────┘        │ 직접 읽기 ❌
       │                                                        │
┌─────────────┐  숫자만    ┌──────────────────────────┐        │
│ 남은 자리 · /stats│ ◀────── │ granolab_stats()  (집계 함수)  │────────┘ 세어서 숫자만
└─────────────┘           └──────────────────────────┘
       ▲  실시간 "누가 신청했어요" 신호 (숫자만, 이름 · 번호 없음)
       └──────────── granolab-stats 채널 ◀── 신청이 들어올 때마다
```

| 이름 | 종류 | 한 줄 설명 |
|---|---|---|
| `granolab_settings` | 표 | 이벤트 설정 한 줄 — **정원(100) · 마감 시각**. 마케터가 여기 숫자만 바꾸면 돼요. 누구나 읽기 가능(공개 정보) |
| `granolab_applications` | 표 | 신청자 한 명이 한 줄 — 이름 · 번호 · 아침 습관 · 유입 경로. **앱에서 읽기 · 쓰기 모두 막힘** 🔒 |
| `granolab_apply(…)` | 함수 | 신청 **창구**. 검사하고 저장한 뒤 **"몇 번째 신청자"** 숫자만 돌려줘요 |
| `granolab_stats()` | 함수 | **집계**. 총 신청 수 · 남은 자리 · 채널별 · 아침 습관별 숫자만 돌려줘요 |

> 💡 왜 표를 직접 열지 않고 "창구 함수"를 쓰나요?
> 표에 "누구나 쓰기"를 열면, 쓰고 난 결과를 돌려받으려고 "누구나 읽기"도 열게 되기 쉬워요. 그러면 **누구나 신청자 번호를 볼 수 있게** 돼요. 창구 함수는 표를 잠가 둔 채 **정해진 일(신청 · 집계)만** 대신 해 줘요.

---

## 1. `granolab_settings` — 이벤트 설정

| 칸 | 뜻 | 값 |
|---|---|---|
| `id` | 항상 1 (한 줄만) | 1 |
| `capacity` | 정원 | 100 |
| `deadline` | 마감 시각 | 2026-12-02 23:59:59 (한국 시간) |

## 2. `granolab_applications` — 신청자 🔒

| 칸 | 뜻 | 규칙 |
|---|---|---|
| `id` | 신청 번호 (자동) | |
| `name` | 이름 | 앞뒤 빈칸 빼고 1~20자 |
| `phone` | 휴대폰 번호 | **숫자만** 저장 (`01012345678`) · 010 + 8자리 · **중복 금지** |
| `breakfast` | 아침 식사 습관 | `skip`(거름) · `bread`(빵 · 시리얼) · `rice`(밥) · `drink`(커피 · 음료만) |
| `utm_source` | 유입 채널 | 없으면 `direct` · 50자까지 |
| `utm_medium` | 매체 | 선택 · 50자까지 |
| `utm_campaign` | 캠페인 이름 | 선택 · 50자까지 |
| `agreed_at` | 개인정보 동의 시각 | 비워 둘 수 없음 (동의해야만 저장) |
| `created_at` | 신청 시각 (자동) | |

---

## 3. DB 가 직접 막는 규칙

| 규칙 | 막는 방법 | 오류 → 화면 문구 |
|---|---|---|
| **정원 100명** | 신청 직전 검사(트리거) — 한 번에 한 명씩 줄 세워 세기 때문에 **동시에 눌러도 101명이 안 됨** | `GRANOLAB_FULL` → 모집이 마감됐어요. 관심 가져 주셔서 고마워요! |
| **마감 시각** | 신청 직전 검사(트리거) — DB 의 "지금" 시각으로 비교 | `GRANOLAB_CLOSED` → 이벤트가 종료됐어요. |
| **같은 번호 중복** | 유일 제약(`unique`) | `23505` → 이미 신청한 번호예요. |
| 번호 · 이름 · 습관 형식 | 검사 제약(`check`) | `23514` → 입력 내용을 다시 확인해 주세요. |
| 동의 | `agreed_at` 비워 둘 수 없음 | `23502` → 개인정보 수집에 동의해야 신청할 수 있어요. |

> coroom 에서는 "지금" 시각을 DB 검사 제약에 못 넣었는데, 이번엔 **트리거**(저장 직전에 실행되는 작은 함수)로 마감 시각을 DB 에서도 막아요.

---

## 4. 누가 무엇을 할 수 있나

| 대상 | 앱(anon) 이 할 수 있는 것 |
|---|---|
| `granolab_settings` | 읽기만 (정원 · 마감 시각은 공개 정보) |
| `granolab_applications` | **아무것도 못 함** — 읽기 · 쓰기 · 수정 · 삭제 정책 없음 |
| `granolab_apply()` | 실행 가능 (신청 창구) |
| `granolab_stats()` | 실행 가능 (숫자만) |

> ⚠️ Supabase 보안 점검(advisors)이 "로그인 없이 실행할 수 있는 security definer 함수가 있다"고 **경고할 수 있어요.** 일부러 연 창구라 괜찮지만, 그래서 이 두 함수는 **정해진 일만** 하고 개인정보를 돌려주지 않게 만들어요.

---

## 5. 실시간 (남은 자리)

- 신청이 저장될 때마다 DB 가 `granolab-stats` 라는 **공개 방송 채널**로 "**지금 N명**" 신호만 보내요 (이름 · 번호 없음).
- 화면은 그 신호를 **"바뀌었어요" 알림으로만** 쓰고, 숫자는 항상 `granolab_stats()` 에서 다시 읽어요.
  공개 채널이라 누구나 가짜 신호("100명!")를 보낼 수 있기 때문이에요 (코드 검사에서 발견 → 수정).
- coroom 은 표 변경을 그대로 받았지만(`postgres_changes`), granolab 은 표가 잠겨 있어서 **숫자만 방송(`broadcast`)** 하는 방식이에요.

---

## 6. 처음 데이터

- 설정 1줄: 정원 100 · 마감 2026-12-02 23:59:59 (한국 시간)
- **가짜 신청자 12명** — `/stats` 가 처음부터 비어 보이지 않게 (번호는 `0100000xxxx` 가짜)
  - ⚠️ 이 12명도 정원 100명에 포함돼요 (실제 신청 가능 88명, 첫 신청자는 "13번째"). **실제로 오픈한다면 그 전에 지우기**:
    `delete from public.granolab_applications where phone in ('01000000001','01000000002','01000000003','01000000004','01000000005','01000000006','01000000007','01000000008','01000000009','01000000010','01000000011','01000000012');`
    (정확한 번호 12개만 지워요. `like '0100000%'` 처럼 넓게 지우면 비슷한 번호로 신청한 사람까지 지워질 수 있어요)

| 채널 | 명 | 아침 습관 |
|---|---|---|
| instagram | 5 | 거름 3 · 커피 2 |
| kakao | 3 | 빵 2 · 밥 1 |
| naver | 2 | 거름 1 · 빵 1 |
| direct | 2 | 커피 1 · 밥 1 |

---

## 7. SQL

> ✅ 2026-11-18 적용 완료 — 마이그레이션 `create_granolab_schema` · `seed_granolab` · `revoke_unused_table_privileges` · `granolab_require_settings_row`(설정 줄 검사 추가, 아래 ④에 반영)
> (마지막 것은 적용 후 점검에서 발견: Supabase 가 앱 권한에 기본으로 남겨 둔 `TRUNCATE`(표 통째로 비우기) 등을 회수. coroom 표도 같이 회수)

```sql
-- (적용 후 추가) 앱에 필요 없는 표 권한 회수
-- revoke truncate, references, trigger on public.granolab_applications, public.granolab_settings,
--   public.rooms, public.reservations from anon, authenticated;

-- ① 이벤트 설정 표 (한 줄만)
create table public.granolab_settings (
  id       smallint primary key default 1 check (id = 1),
  capacity int not null check (capacity > 0),
  deadline timestamptz not null
);

-- ② 신청자 표
create table public.granolab_applications (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(trim(name)) between 1 and 20),
  phone        text not null unique check (phone ~ '^010[0-9]{8}$'),
  breakfast    text not null check (breakfast in ('skip', 'bread', 'rice', 'drink')),
  utm_source   text not null default 'direct' check (char_length(utm_source) between 1 and 50),
  utm_medium   text check (char_length(utm_medium) <= 50),
  utm_campaign text check (char_length(utm_campaign) <= 50),
  agreed_at    timestamptz not null,
  created_at   timestamptz not null default now()
);

-- ③ 잠그기: RLS 켜고, 신청자 표에는 정책을 하나도 만들지 않음
alter table public.granolab_settings     enable row level security;
alter table public.granolab_applications enable row level security;

create policy "누구나 이벤트 설정 읽기" on public.granolab_settings
  for select to anon, authenticated using (true);
grant select on public.granolab_settings to anon, authenticated;
-- granolab_applications: anon 권한 · 정책 없음 → 앱에서 못 읽고 못 씀

-- ④ 저장 직전 검사: 정원 · 마감 (동시에 눌러도 한 명씩 줄 세움)
create or replace function public.granolab_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s public.granolab_settings;
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('granolab_applications'));  -- 줄 세우기
  select * into s from public.granolab_settings where id = 1;
  if not found or s.deadline is null or s.capacity is null then   -- (코드 검사 후 추가) 설정이 없으면 거절
    raise exception 'GRANOLAB_NO_SETTINGS';
  end if;
  if now() > s.deadline then
    raise exception 'GRANOLAB_CLOSED';
  end if;
  select count(*) into n from public.granolab_applications;
  if n >= s.capacity then
    raise exception 'GRANOLAB_FULL';
  end if;
  return new;
end;
$$;

create trigger granolab_check_before_insert
before insert on public.granolab_applications
for each row execute function public.granolab_before_insert();

-- ⑤ 저장 뒤: 실시간 채널로 "지금 N명" 숫자만 방송
create or replace function public.granolab_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('total', (select count(*) from public.granolab_applications)),
    'applied',          -- 이벤트 이름
    'granolab-stats',   -- 채널 이름
    false               -- 공개 채널
  );
  return null;
end;
$$;

create trigger granolab_broadcast_after_insert
after insert on public.granolab_applications
for each row execute function public.granolab_after_insert();

-- ⑥ 신청 창구: 저장하고 "몇 번째"만 돌려줌
create or replace function public.granolab_apply(
  p_name text, p_phone text, p_breakfast text, p_agreed boolean,
  p_utm_source text default null, p_utm_medium text default null, p_utm_campaign text default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
  rank int;
begin
  insert into public.granolab_applications
    (name, phone, breakfast, utm_source, utm_medium, utm_campaign, agreed_at)
  values (
    trim(p_name),
    regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'),  -- 하이픈 빼고 숫자만
    p_breakfast,
    coalesce(nullif(trim(p_utm_source), ''), 'direct'),
    nullif(trim(p_utm_medium), ''),
    nullif(trim(p_utm_campaign), ''),
    case when p_agreed then now() end                           -- 동의 안 하면 null → 거절
  )
  returning id into new_id;

  select count(*) into rank from public.granolab_applications where id <= new_id;
  return rank;
end;
$$;

-- ⑦ 집계: 숫자만
create or replace function public.granolab_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total',     (select count(*) from public.granolab_applications),
    'capacity',  s.capacity,
    'deadline',  s.deadline,
    'by_source', coalesce((
      select jsonb_agg(jsonb_build_object('source', utm_source, 'count', c) order by c desc)
      from (select utm_source, count(*) c from public.granolab_applications group by utm_source) x
    ), '[]'::jsonb),
    'by_breakfast', coalesce((
      select jsonb_agg(jsonb_build_object('breakfast', breakfast, 'count', c) order by c desc)
      from (select breakfast, count(*) c from public.granolab_applications group by breakfast) y
    ), '[]'::jsonb)
  )
  from public.granolab_settings s
  where s.id = 1;
$$;

-- ⑧ 함수 실행 권한: 창구 2개만 앱에 열기
revoke execute on function public.granolab_apply(text, text, text, boolean, text, text, text) from public;
revoke execute on function public.granolab_stats() from public;
revoke execute on function public.granolab_before_insert() from public;
revoke execute on function public.granolab_after_insert() from public;
grant execute on function public.granolab_apply(text, text, text, boolean, text, text, text) to anon, authenticated;
grant execute on function public.granolab_stats() to anon, authenticated;

-- ⑨ 처음 데이터
insert into public.granolab_settings (id, capacity, deadline)
values (1, 100, '2026-12-02 23:59:59+09');

insert into public.granolab_applications (name, phone, breakfast, utm_source, utm_medium, utm_campaign, agreed_at) values
  ('김가짜', '01000000001', 'skip',  'instagram', 'story', 'matcha', now()),
  ('이가짜', '01000000002', 'skip',  'instagram', 'story', 'matcha', now()),
  ('박가짜', '01000000003', 'skip',  'instagram', 'feed',  'matcha', now()),
  ('최가짜', '01000000004', 'drink', 'instagram', 'feed',  'matcha', now()),
  ('정가짜', '01000000005', 'drink', 'instagram', 'reels', 'matcha', now()),
  ('강가짜', '01000000006', 'bread', 'kakao',     'channel', 'matcha', now()),
  ('조가짜', '01000000007', 'bread', 'kakao',     'channel', 'matcha', now()),
  ('윤가짜', '01000000008', 'rice',  'kakao',     'channel', 'matcha', now()),
  ('장가짜', '01000000009', 'skip',  'naver',     'blog',  'matcha', now()),
  ('임가짜', '01000000010', 'bread', 'naver',     'blog',  'matcha', now()),
  ('한가짜', '01000000011', 'drink', 'direct',    null,    null,     now()),
  ('오가짜', '01000000012', 'rice',  'direct',    null,    null,     now());
```

---

## 8. 만든 뒤 확인

| # | 해 보기 | 기대 |
|---|---|---|
| 1 | `select granolab_stats();` | 총 12 · 정원 100 · 채널 4개 · 습관 4개 |
| 2 | 앱 권한(anon)으로 `select * from granolab_applications` | **아무것도 안 보임** (개인정보 잠김) |
| 3 | 같은 번호로 `granolab_apply` 두 번 | 두 번째는 `23505` (중복) |
| 4 | 정원을 잠깐 12로 바꾸고 신청 | `GRANOLAB_FULL` → 정원 100으로 되돌리기 |
| 5 | 동의 `false` 로 신청 | 거절 |
| 6 | 보안 경고(advisors) | 창구 함수 2개 관련 경고만 (의도한 것) |
