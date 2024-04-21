'use client'
import { Link } from "react-router-dom"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg">
        <ul>
          <li><a className="hover:text-red-500" href="/play">Play</a></li>
        </ul>
      </div>
    </main>
  );
}
