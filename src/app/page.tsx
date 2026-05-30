import Kakeibo from "@/components/Kakeibo";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center px-5 sm:px-8 py-12 sm:py-20">
      <main className="w-full max-w-[680px] flex flex-col gap-14 sm:gap-20">
        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl sm:text-4xl tracking-wider">
            やさしい家計簿
          </h1>
          <p className="text-sm text-ink-muted">
            静かに、暮らしを整えるための小さな帳面。
          </p>
        </header>

        <Kakeibo />

        <footer className="pt-10 border-t border-line-soft text-xs text-ink-muted">
          <p>
            記録はこの端末の中にだけ、そっと保存されます。
          </p>
        </footer>
      </main>
    </div>
  );
}
