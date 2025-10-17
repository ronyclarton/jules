"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          AI 3D Creation Platform
        </p>
        <div className="flex items-center">
          <Link href="/gallery" className="mr-4 text-sm text-gray-400 hover:text-white">Gallery</Link>
        </div>
      </div>

      <div className="relative flex place-items-center w-full h-[500px] border rounded-lg overflow-hidden bg-gray-900">
        <h1 className="text-4xl">Main Editor Canvas</h1>
      </div>

      <div className="w-full max-w-5xl mt-8">
        <h2 className="text-2xl">Controls</h2>
      </div>
    </main>
  );
}