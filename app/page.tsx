import { ImageStudioShell } from '@/components/ImageStudioShell';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 py-2 sm:py-6 selection:bg-emerald-500 selection:text-white">
      <ImageStudioShell />
    </main>
  );
}
