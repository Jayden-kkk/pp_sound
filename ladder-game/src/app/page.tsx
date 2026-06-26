import LadderGame from "@/components/LadderGame";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            🪜 사다리타기
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Ladder Game</p>
        </div>
        <ThemeToggle />
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <LadderGame />
      </div>
    </main>
  );
}
