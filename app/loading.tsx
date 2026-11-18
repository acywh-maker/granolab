// 페이지를 옮겨 다닐 때 잠깐 보이는 화면 (모든 주소 공통)
export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 text-stone-500" aria-busy="true">
      잠시만요…
    </main>
  );
}
