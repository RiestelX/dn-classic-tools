"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2 transition-all">
          <div className="flex h-8 w-24 items-center justify-center rounded-lg bg-yellow-500 font-bold text-black group-hover:bg-yellow-400">
            DN Classic
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Tools
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
          <Link href="/gold-splitter" className="transition-colors hover:text-yellow-500">
            หารเงินเรด
          </Link>
          <Link href="/damage-calculator" className="transition-colors hover:text-yellow-500">
            คำนวณดาเมจ
          </Link>
          <Link href="https://github.com/RiestelX" target="_blank" className="flex items-center gap-1 hover:text-white">
            <i className="fa-brands fa-github text-base"></i>
          </Link>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-400 hover:text-white md:hidden"
        >
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-black/95 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-medium text-zinc-400">
            <Link 
              href="/gold-splitter" 
              onClick={() => setIsOpen(false)}
              className="hover:text-yellow-500"
            >
              หารเงินเรด
            </Link>
            <Link 
              href="/damage-calculator" 
              onClick={() => setIsOpen(false)}
              className="hover:text-yellow-500"
            >
              คำนวณดาเมจ
            </Link>
            <Link 
              href="https://github.com/RiestelX" 
              target="_blank" 
              className="flex items-center gap-2 hover:text-white"
            >
              <i className="fa-brands fa-github"></i> GitHub
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}