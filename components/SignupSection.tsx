"use client"; // 남은 자리 실시간 · 카운트다운 · 입력 폼이 있어서 클라이언트 컴포넌트

import { startTransition, useActionState, useEffect, useState } from "react";
import { applyAction, type ApplyState } from "@/app/actions";
import { useLiveTotal } from "@/components/useLiveTotal";
import {
  BREAKFAST_OPTIONS,
  formatDeadline,
  formatRemaining,
  type Stats,
  type UtmInput,
} from "@/lib/campaign";

type Props = { stats: Stats; utm: UtmInput; serverNow: number };

export default function SignupSection({ stats, utm, serverNow }: Props) {
  const { total, live } = useLiveTotal(stats.total);
  const [now, setNow] = useState(serverNow);

  // 1분마다 남은 시간 다시 계산
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(stats.capacity - total, 0);
  const remaining = formatRemaining(stats.deadline, now);
  const full = left === 0;
  const ended = remaining === null;

  return (
    <section className="flex flex-col gap-5">
      {/* 남은 자리 · 마감까지 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-900/10">
          <p className="text-sm text-stone-500">남은 자리</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700" aria-live="polite">
            {left.toLocaleString("ko-KR")}
            <span className="text-base font-medium text-stone-400"> / {stats.capacity.toLocaleString("ko-KR")}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-700"
              style={{ width: `${Math.min((total / stats.capacity) * 100, 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-900/10">
          <p className="text-sm text-stone-500">마감까지</p>
          <p className="mt-1 text-2xl font-extrabold text-stone-800">{remaining ?? "종료"}</p>
          <p className="mt-2 text-xs text-stone-400">{formatDeadline(stats.deadline)} 마감</p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-stone-500">
        <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-stone-300"}`} />
        {live ? "남은 자리가 실시간으로 바뀌어요" : "실시간 연결 중…"}
      </p>

      {ended ? (
        <ClosedCard title="이벤트가 종료됐어요." body="말차 크런치 출시 소식은 그래놀랩 채널에서 가장 먼저 알려 드릴게요." />
      ) : full ? (
        <ClosedCard title="모집이 마감됐어요." body="관심 가져 주셔서 고마워요! 출시 소식은 그래놀랩 채널에서 알려 드릴게요." />
      ) : (
        <ApplyForm utm={utm} />
      )}
    </section>
  );
}

function ClosedCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-stone-100 p-6 text-center">
      <p className="text-lg font-bold text-stone-800">{title}</p>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}

function ApplyForm({ utm }: { utm: UtmInput }) {
  // 입력값은 모두 화면이 기억해요 → 오류가 나도 지워지지 않아요
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [breakfast, setBreakfast] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyAction, { message: "" });

  const fieldClass =
    "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";

  return (
    <form
      // form action 을 그대로 쓰면 보낸 뒤 입력칸이 비워져서, 직접 모아서 보내요
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-900/10 sm:p-6"
    >
      <h2 className="text-lg font-bold text-stone-800">체험단 신청하기</h2>

      {/* 유입 경로 — 화면에는 안 보이지만 같이 보내요 */}
      <input type="hidden" name="utm_source" value={utm.source} />
      <input type="hidden" name="utm_medium" value={utm.medium} />
      <input type="hidden" name="utm_campaign" value={utm.campaign} />

      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
        이름
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={20}
          autoComplete="name"
          placeholder="홍길동"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-700">
        휴대폰 번호
        <input
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="numeric"
          autoComplete="tel"
          maxLength={13}
          placeholder="010-0000-0000"
          className={fieldClass}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-stone-700">평소 아침은 어떻게 드세요?</legend>
        <div className="grid grid-cols-2 gap-2">
          {BREAKFAST_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm transition-colors ${
                breakfast === o.value
                  ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-800"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <input
                type="radio"
                name="breakfast"
                value={o.value}
                checked={breakfast === o.value}
                onChange={() => setBreakfast(o.value)}
                required
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
        <input
          type="checkbox"
          name="agreed"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
          className="mt-0.5 h-5 w-5 accent-emerald-700"
        />
        <span>
          <b>[필수] 개인정보 수집 · 이용 동의</b>
          <br />
          <span className="text-stone-500">이름 · 휴대폰 번호 · 아침 식사 습관을 체험단 선정과 배송 안내에만 쓰고, 이벤트가 끝나면 30일 안에 지워요.</span>
        </span>
      </label>

      {state.message && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-13 rounded-2xl bg-emerald-700 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "신청하는 중…" : "무료 체험 신청하기"}
      </button>

      <p className="text-center text-xs text-stone-400">
        ※ 수업용 가상 이벤트예요. 실제 이름 · 번호 대신 가짜 정보를 넣어 주세요.
      </p>
    </form>
  );
}
