import Link from "next/link";

export default function Home() {
  const tools = [
    {
      title: "หารเงินเรด",
      description: "ช่วยคิดตังเวลาขายของเรด รวมค่าสแตมป์ และค่าภาษี ได้เท่ากันทุกคนแน่นอน",
      path: "/gold-splitter",
      icon: "fa-coins",
    },
    {
      title: "คำนวณดาเมจ",
      description: "ใส่ไอนี่ ใส่ไอนั่น แรงขึ้นจริงป่าว ลองจิ้มดูก่อนดีไหม",
      path: "/damage-calculator",
      icon: "fa-meteor",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          เครื่องมือช่วยสำหรับเกม <br className="lg:hidden" /> <span className="text-yellow-500 sm:inline">DN Classic</span>
        </h1>
        
        <p className="mt-4 text-lg text-zinc-400">
          ไม่ต้องคิดเองให้ปวดหัว 
          <br className="sm:hidden" /> 
          <span className="sm:inline"> เพราะมีคนชอบคำนวณทำไว้ให้หมดแล้ว</span>
        </p>

        <div className="mt-3 pt-3 border-t border-zinc-800 text-sm flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <a 
            href="https://github.com/RiestelX" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1"
          >
            <span>GitHub: RiestelX</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <span className="text-zinc-600">|</span>
          
          <span className="text-orange-400 font-medium text-center">
            IGN: Totori (DN Classic)
          </span>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            href={tool.path}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 transition-all hover:border-yellow-500/50 hover:bg-zinc-800"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 group-hover:scale-110 transition-transform">
              <i className={`fa-solid ${tool.icon} text-xl`}></i>
            </div>
            <h2 className="text-xl font-semibold text-white">{tool.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}