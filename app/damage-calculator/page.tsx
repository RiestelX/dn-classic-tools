"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  STAT_TYPES, STAT_COLORS, FD_TABLE, CLASS_INFO, ARMOR_LABELS, ELEM_COLORS,
  uid, emptyRow, emptyPair, emptyCostumeSlot,
  defaultBuild, defaultSkill,
  resetWeapons, resetArmor, resetGeneralSetBonus, resetGeneralAcc, resetGeneralAccSetBonus,
  resetCostumeSetBonus, resetCostumeAcc, resetCostumeAccSetBonus,
  resetHeraldryUnique, resetHeraldryFree, resetRunes, resetCard,
  resetExpertStats, resetCostumeCollection, resetTitle,
} from "@/utils/data";
import type {
  StatRow, Pair, SetBonusEntry,
  ArmorSlot, CostumeSlot, WeaponData, BuildState, SkillConfig, ClassType,
} from "@/utils/data";
import { calcDmg } from "@/utils/calculations";

// Persistence
const BKEY = "dn-build", SKEY = "dn-skill";
function loadBuild(): BuildState { try { const r = localStorage.getItem(BKEY); return r ? JSON.parse(r) : defaultBuild(); } catch { return defaultBuild(); } }
function loadSkill(): SkillConfig { try { const r = localStorage.getItem(SKEY); return r ? JSON.parse(r) : defaultSkill(); } catch { return defaultSkill(); } }
function saveBuild(b: BuildState) { try { localStorage.setItem(BKEY, JSON.stringify(b)); } catch { } }
function saveSkill(s: SkillConfig) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch { } }

// ─── Presets ─────────────────────────────────────────────────────────────────
const PKEY = "dn-presets";
const MAX_PRESETS = 8;

interface Preset {
  id: string;
  name: string;
  classType: ClassType;
  savedAt: number;
  build: BuildState;
  skill: SkillConfig;
}

function loadPresets(): Preset[] { try { const r = localStorage.getItem(PKEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function savePresets(p: Preset[]) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch {} }

// Shared preset context via module-level ref pattern
type PresetPanelState = {
  open: boolean; setOpen: (v: boolean) => void;
  presets: Preset[]; setPresets: (p: Preset[]) => void;
  saving: number | null; setSaving: (v: number | null) => void;
  nameInput: string; setNameInput: (v: string) => void;
  confirmDel: string | null; setConfirmDel: (v: string | null) => void;
  loadFlash: string | null; setLoadFlash: (v: string | null) => void;
  nameRef: React.RefObject<HTMLInputElement | null>;
  build: BuildState; skill: SkillConfig; onLoad: (b: BuildState, s: SkillConfig) => void;
};

function usePresetState(build: BuildState, skill: SkillConfig, onLoad: (b: BuildState, s: SkillConfig) => void) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [loadFlash, setLoadFlash] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setPresets(loadPresets()); }, []);
  useEffect(() => { if (saving !== null) setTimeout(() => nameRef.current?.focus(), 50); }, [saving]);
  return { open, setOpen, presets, setPresets, saving, setSaving, nameInput, setNameInput,
    confirmDel, setConfirmDel, loadFlash, setLoadFlash, nameRef, build, skill, onLoad };
}

function PresetManagerButton({ state }: { state: PresetPanelState }) {
  const { open, setOpen, presets } = state;
  return (
    <button type="button" onClick={() => setOpen(!open)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
      style={{
        background: open ? "#ffd70018" : "#141414",
        border: "1px solid " + (open ? "#ffd70055" : "#383838"),
        color: open ? "#ffd700" : "#888",
        boxShadow: open ? "0 0 20px #ffd70010" : "none",
      }}>
      <span style={{ fontSize: 15 }}>💾</span> Presets
      <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: "#ffd70022", color: "#ffd700aa" }}>
        {presets.length}/{MAX_PRESETS}
      </span>
    </button>
  );
}

function PresetPanel({ state }: { state: PresetPanelState }) {
  const { open, setOpen, presets, setPresets, saving, setSaving, nameInput, setNameInput,
    confirmDel, setConfirmDel, loadFlash, setLoadFlash, nameRef, build, skill, onLoad } = state;

  if (!open) return null;

  const slots: (Preset | null)[] = Array.from({ length: MAX_PRESETS }, (_, i) => presets[i] ?? null);

  const doSave = (slotIdx: number) => {
    const existing = presets[slotIdx];
    const name = nameInput.trim() || (existing?.name ?? `Preset ${slotIdx + 1}`);
    const preset: Preset = { id: uid(), name, classType: build.class, savedAt: Date.now(), build, skill };
    const next = [...presets];
    next[slotIdx] = preset;
    setPresets(next); savePresets(next); setSaving(null); setNameInput("");
  };

  const doLoad = (p: Preset) => {
    onLoad(p.build, p.skill);
    setLoadFlash(p.id); setTimeout(() => setLoadFlash(null), 1200);
  };

  const doDelete = (id: string) => {
    const next = presets.filter(p => p.id !== id);
    setPresets(next); savePresets(next); setConfirmDel(null);
  };

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto w-[95%] max-w-[1200px] mb-3 rounded-[20px] border border-[#363636] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1e1e1e 0%, #1a1a1a 100%)" }}>

      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]"
        style={{ background: "linear-gradient(90deg, #ffd70008 0%, transparent 100%)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[#ffd700] text-lg">💾</span>
          <span className="text-sm font-bold text-[#ffd700]">Preset Slots</span>
          <span className="text-xs text-[#444]">— บันทึก build สูงสุด {MAX_PRESETS} slots</span>
        </div>
        <button type="button" onClick={() => setOpen(false)}
          className="text-[#444] hover:text-[#888] text-xs cursor-pointer transition-colors">✕ ปิด</button>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {slots.map((preset, i) => {
          const cls = preset ? CLASS_INFO[preset.classType] : null;
          const isFlashing = preset && loadFlash === preset.id;
          const isSavingThis = saving === i;

          return (
            <div key={i} className="relative rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                border: "1px solid " + (preset ? (cls!.color + "40") : "#282828"),
                background: preset
                  ? `linear-gradient(135deg, ${cls!.color}08 0%, #1a1a1a 100%)`
                  : "#161616",
                boxShadow: isFlashing ? `0 0 20px ${cls!.color}40` : "none",
                minHeight: 110,
              }}>

              {/* Slot number badge */}
              <div className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: preset ? cls!.color + "22" : "#282828",
                  color: preset ? cls!.color : "#3a3a3a"
                }}>#{i + 1}</div>

              {preset ? (
                <>
                  {/* Class glow top-right */}
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 pointer-events-none"
                    style={{ background: cls!.color }} />
                  {/* Class icon */}
                  <div className="absolute top-1.5 right-2.5 opacity-60">
                    <img src={cls!.icon} alt={preset.classType} className="w-7 h-7 object-contain" />
                  </div>

                  <div className="p-3 pt-6 pb-2 flex flex-col h-full min-h-[110px]">
                    <div className="text-sm font-bold truncate pr-6" style={{ color: cls!.color }}>
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-[#555] mt-0.5 mb-auto">{preset.classType}</div>
                    <div className="text-[10px] text-[#3a3a3a] mt-1.5">{fmt(preset.savedAt)}</div>

                    {isSavingThis ? (
                      <div className="mt-2 flex gap-1">
                        <input ref={nameRef} value={nameInput} onChange={e => setNameInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') doSave(i); if (e.key === 'Escape') { setSaving(null); setNameInput(""); } }}
                          placeholder={preset.name}
                          className="flex-1 min-w-0 bg-[#0e0e0e] border border-[#ffd70055] rounded-lg px-2 py-1 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#ffd700]" />
                        <button type="button" onClick={() => doSave(i)}
                          className="px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
                          style={{ background: "#ffd70022", color: "#ffd700", border: "1px solid #ffd70055" }}>✓</button>
                        <button type="button" onClick={() => { setSaving(null); setNameInput(""); }}
                          className="px-2 py-1 rounded-lg text-xs cursor-pointer text-[#555] border border-[#333]">✕</button>
                      </div>
                    ) : confirmDel === preset.id ? (
                      <div className="mt-2 flex gap-1">
                        <span className="text-[10px] text-[#ef4444] flex-1 self-center">ลบ?</span>
                        <button type="button" onClick={() => doDelete(preset.id)}
                          className="px-2 py-1 rounded-lg text-xs font-bold cursor-pointer"
                          style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444440" }}>ลบ</button>
                        <button type="button" onClick={() => setConfirmDel(null)}
                          className="px-2 py-1 rounded-lg text-xs cursor-pointer text-[#555] border border-[#333]">ยก</button>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-1">
                        <button type="button" onClick={() => doLoad(preset)}
                          className="flex-1 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          style={{ background: cls!.color + "22", color: cls!.color, border: "1px solid " + cls!.color + "40" }}>
                          {isFlashing ? "✓ โหลด" : "โหลด"}
                        </button>
                        <button type="button" onClick={() => { setSaving(i); setNameInput(preset.name); }}
                          className="px-2 py-1 rounded-lg text-[10px] cursor-pointer text-[#555] border border-[#333] hover:border-[#ffd70040] hover:text-[#ffd700] transition-colors">
                          ✎
                        </button>
                        <button type="button" onClick={() => setConfirmDel(preset.id)}
                          className="px-2 py-1 rounded-lg text-[10px] cursor-pointer text-[#444] border border-[#333] hover:border-[#ef444440] hover:text-[#ef4444] transition-colors">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                isSavingThis ? (
                  <div className="p-3 pt-6 flex flex-col h-full min-h-[110px]">
                    <div className="text-[10px] text-[#555] mb-2">ชื่อ preset</div>
                    <input ref={nameRef} value={nameInput} onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') doSave(i); if (e.key === 'Escape') { setSaving(null); setNameInput(""); } }}
                      placeholder={`Preset ${i + 1}`}
                      className="w-full bg-[#0e0e0e] border border-[#ffd70055] rounded-lg px-2 py-1 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#ffd700] mb-2" />
                    <div className="flex gap-1 mt-auto">
                      <button type="button" onClick={() => doSave(i)}
                        className="flex-1 py-1 rounded-lg text-xs font-bold cursor-pointer"
                        style={{ background: "#ffd70022", color: "#ffd700", border: "1px solid #ffd70055" }}>บันทึก</button>
                      <button type="button" onClick={() => { setSaving(null); setNameInput(""); }}
                        className="px-2 py-1 rounded-lg text-xs cursor-pointer text-[#555] border border-[#333]">✕</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setSaving(i); setNameInput(""); }}
                    className="w-full h-full min-h-[110px] flex flex-col items-center justify-center gap-2 cursor-pointer group transition-all duration-200 hover:bg-[#ffd70006]">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#2e2e2e] group-hover:border-[#ffd70030] flex items-center justify-center transition-colors">
                      <span className="text-[#2e2e2e] group-hover:text-[#ffd70050] text-lg font-light transition-colors">+</span>
                    </div>
                    <span className="text-[10px] text-[#2e2e2e] group-hover:text-[#ffd70040] transition-colors font-medium">บันทึก Build</span>
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// Helpers
const getEff = (pair: Pair): StatRow[] => {
  const s1 = pair[1].filter(r => r.type !== '' || r.value !== '');
  return s1.length > 0 ? pair[1] : pair[0];
};

// StatTypeSelect
function StatTypeSelect({ value, onChange, dim }: { value: string; onChange: (v: string) => void; dim?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const openMenu = (e: React.MouseEvent) => {
    if (dim) return; e.stopPropagation();
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX });
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const display = value || "— เลือก stat —";
  const col = value ? (STAT_COLORS[value] || "#888") : "#3a3a3a";
  return (
    <>
      <button ref={ref} type="button" onMouseDown={openMenu}
        className="w-full flex items-center justify-between px-2 rounded-lg border text-xs font-bold truncate h-[30px]"
        style={{
          background: "#181818", borderColor: open ? "#ffd70060" : "#303030",
          color: dim ? "#2e2e2e" : col, cursor: dim ? "default" : "pointer"
        }}>
        <span className="truncate">{display}</span>
        {!dim && <span className="ml-1 opacity-50 shrink-0 text-[10px]">▾</span>}
      </button>
      {open && createPortal(
        <div onMouseDown={e => e.stopPropagation()}
          style={{ position: "absolute", top: pos.top, left: pos.left, width: 168, zIndex: 9999 }}
          className="bg-[#222] border border-[#3a3a3a] rounded-xl overflow-hidden py-1">
          {STAT_TYPES.map(s => (
            <button key={s} type="button" onMouseDown={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-[#2e2e2e] cursor-pointer transition-colors"
              style={{ color: STAT_COLORS[s] || "#888" }}>{s}</button>
          ))}
        </div>, document.body
      )}
    </>
  );
}

// StatRowEditor
function StatRowEditor({ row, onChange, onRemove, dim }: {
  row: StatRow; onChange: (r: StatRow) => void; onRemove: () => void; dim?: boolean;
}) {
  return (
    <div className="flex gap-1 items-center group/row min-w-0">
      <div className="w-[138px] shrink-0">
        <StatTypeSelect value={row.type} onChange={v => onChange({ ...row, type: v })} dim={dim} />
      </div>
      <input type="text" placeholder="0" value={row.value}
        onChange={e => onChange({ ...row, value: e.target.value })} disabled={dim}
        className="w-20 shrink-0 bg-[#181818] border border-[#303030] rounded-lg px-2 text-xs text-right focus:outline-none focus:border-[#ffd70060] h-[30px]"
        style={{ color: dim ? "#2e2e2e" : "#e0e0e0" }} />
      <button type="button" disabled={dim} onClick={() => onChange({ ...row, isPercent: !row.isPercent })}
        className="w-8 shrink-0 rounded-lg border text-xs font-bold h-[30px]"
        style={{
          background: row.isPercent ? "#ffd70018" : "#181818", borderColor: row.isPercent ? "#ffd70060" : "#303030",
          color: row.isPercent ? "#ffd700" : (dim ? "#2e2e2e" : "#555"), cursor: dim ? "default" : "pointer"
        }}>%</button>
      {!dim && (
        <button type="button" onClick={onRemove}
          className="opacity-0 group-hover/row:opacity-100 shrink-0 text-[#444] hover:text-[#ef4444] text-xs w-4 select-none cursor-pointer">✕</button>
      )}
    </div>
  );
}

// StatList
function StatList({ rows, onChange, dim, accent = "#ffd700" }: {
  rows: StatRow[]; onChange: (r: StatRow[]) => void; dim?: boolean; accent?: string;
}) {
  const upd = (i: number, r: StatRow) => { const n = [...rows]; n[i] = r; onChange(n); };
  const del = (i: number) => { const n = rows.filter((_, j) => j !== i); onChange(n.length ? n : [emptyRow()]); };
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <StatRowEditor key={r.id} row={r} onChange={v => upd(i, v)} onRemove={() => del(i)} dim={dim} />
      ))}
      {!dim && (
        <button type="button" onClick={() => onChange([...rows, emptyRow()])}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-dashed mt-0.5 cursor-pointer"
          style={{ borderColor: accent + "40", color: accent + "80" }}>
          <span className="font-bold text-sm leading-none">+</span> เพิ่ม stat
        </button>
      )}
    </div>
  );
}

// DiffPills
function DiffPills({ a, b }: { a: StatRow[]; b: StatRow[] }) {
  const sum = (rows: StatRow[], t: string) => rows.filter(r => r.type === t).reduce((acc, r) => acc + (parseFloat((r.value || '').replace(/,/g, '')) || 0), 0);
  const types = Array.from(new Set([...a, ...b].map(r => r.type))).filter(Boolean);
  const diffs = types.map(t => ({ t, d: sum(b, t) - sum(a, t) })).filter(x => x.d !== 0);
  if (!diffs.length) return <div className="text-xs text-[#3a3a3a] italic">ไม่ต่างกัน</div>;
  return (
    <div className="flex flex-wrap gap-1">
      {diffs.map(({ t, d }) => (
        <span key={t} className="text-xs px-1.5 py-0.5 rounded-full font-bold"
          style={{
            background: d > 0 ? "#22c55e15" : "#ef444415", color: d > 0 ? "#22c55e" : "#ef4444",
            border: "1px solid " + (d > 0 ? "#22c55e35" : "#ef444435")
          }}>
          {t} {d > 0 ? "+" : ""}{Math.round(d * 100) / 100}
        </span>
      ))}
    </div>
  );
}

// ResetBtn
function ResetBtn({ onReset, label = "↺ รีเซต" }: { onReset: () => void; label?: string }) {
  const [c, setC] = useState(false);
  useEffect(() => { if (!c) return; const t = setTimeout(() => setC(false), 2500); return () => clearTimeout(t); }, [c]);
  if (c) return (
    <div className="flex gap-1">
      <button type="button" onClick={() => { onReset(); setC(false); }}
        className="px-2 py-0.5 rounded-lg border text-xs font-bold border-[#ef4444] text-[#ef4444] bg-[#ef444415] cursor-pointer">ยืนยัน</button>
      <button type="button" onClick={() => setC(false)}
        className="px-2 py-0.5 rounded-lg border text-xs border-[#444] text-[#555] cursor-pointer">ยกเลิก</button>
    </div>
  );
  return (
    <button type="button" onClick={() => setC(true)}
      className="px-2 py-0.5 rounded-lg border text-xs font-bold border-[#ef444450] text-[#ef4444] bg-[#ef444408] hover:bg-[#ef444420] hover:border-[#ef4444] cursor-pointer transition-colors">
      {label}
    </button>
  );
}

// Collapsible
function Collapsible({ title, icon, color = "#ffd700", defaultOpen = true, onReset, children }: {
  title: string; icon: string; color?: string; defaultOpen?: boolean; onReset?: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden border border-[#3c3c3c]">
      <div className="flex items-center px-4 py-3.5 bg-[#2e2e2e] hover:bg-[#3a3a3a] cursor-pointer select-none transition-colors"
        onClick={() => setOpen(o => !o)}>
        <span className="text-base mr-2.5">{icon}</span>
        <span className="text-sm font-bold flex-1" style={{ color }}>{title}</span>
        {onReset && <span onClick={e => e.stopPropagation()} className="mr-2"><ResetBtn onReset={onReset} /></span>}
        <span className="text-[#666] text-[11px] transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </div>
      {open && <div className="px-4 py-3 bg-[#222]">{children}</div>}
    </div>
  );
}

// PairCols
function PairCols({ pair, onChange, accent, dim0 = false }: {
  pair: Pair; onChange: (p: Pair) => void; accent: string; dim0?: boolean;
}) {
  const [cur, cm] = pair;
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatList rows={cur} onChange={r => onChange([r, cm])} dim={dim0} accent={accent} />
      <div className="border-l border-[#2a2a2a] pl-3">
        <StatList rows={cm} onChange={r => onChange([cur, r])} accent={accent} />
      </div>
    </div>
  );
}

// InnerCard
function InnerCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl border border-[#303030] bg-[#1e1e1e] overflow-visible " + className}>
      {children}
    </div>
  );
}

// SlotRow
function SlotRow({ label, pair, potPair, onPairChange, onPotChange, cmp, accent = "#ffd700", onRemove }: {
  label: string; pair: Pair; potPair?: Pair; onPairChange: (p: Pair) => void; onPotChange?: (p: Pair) => void;
  cmp: boolean; accent?: string; onRemove?: () => void;
}) {
  const [potOpen, setPotOpen] = useState(false);
  const [cur] = pair;
  const pot = potPair ?? emptyPair();
  return (
    <InnerCard>
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-2 border-b border-[#232323]">
        <span className="text-sm font-bold" style={{ color: cmp ? "#3a3a3a" : accent }}>{label}</span>
        {cmp && <><div className="flex-1 h-px bg-[#232323]" /><span className="text-xs font-bold" style={{ color: accent }}>เปรียบ →</span></>}
        {!cmp && <div className="flex-1" />}
        {onRemove && (
          <button type="button" onClick={onRemove}
            className="text-[#444] hover:text-[#ef4444] text-xs ml-1 cursor-pointer">✕</button>
        )}
      </div>
      {cmp ? (
        <div className="p-3">
          <div className="grid grid-cols-2 mb-2">
            <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">ปัจจุบัน</div>
            <div className="text-[10px] font-bold uppercase tracking-widest pl-3" style={{ color: accent }}>ใหม่</div>
          </div>
          <PairCols pair={pair} onChange={onPairChange} accent={accent} dim0 />
          <div className="mt-2 pt-2 border-t border-[#232323]"><DiffPills a={cur} b={getEff(pair)} /></div>
        </div>
      ) : (
        <div className="p-3">
          <StatList rows={cur} onChange={r => onPairChange([r, pair[1]])} accent={accent} />
        </div>
      )}
      {onPotChange && (
        <SubPanel label="Potential" icon="◈" accent="#a78bfa" open={potOpen} onToggle={() => setPotOpen(o => !o)}>
          {cmp ? (
            <PairCols pair={pot} onChange={p => onPotChange(p)} accent="#a78bfa" dim0 />
          ) : (
            <StatList rows={pot[0]} onChange={r => onPotChange([r, pot[1]])} accent="#a78bfa" />
          )}
        </SubPanel>
      )}
    </InnerCard>
  );
}

// DynamicSlotList
function DynamicSlotList({ pairs, potPairs, onChange, onPotChange, cmp, accent, prefix, labels, maxSlots = 20 }: {
  pairs: Pair[]; potPairs?: Pair[]; onChange: (ps: Pair[]) => void; onPotChange?: (ps: Pair[]) => void;
  cmp: boolean; accent: string; prefix?: string; labels?: string[]; maxSlots?: number;
}) {
  const updSlot = (i: number, p: Pair) => { const n = [...pairs]; n[i] = p; onChange(n); };
  const updPot = (i: number, p: Pair) => { if (!potPairs || !onPotChange) return; const n = [...potPairs]; n[i] = p; onPotChange(n); };
  const addSlot = () => {
    onChange([...pairs, emptyPair()]);
    if (potPairs && onPotChange) onPotChange([...potPairs, emptyPair()]);
  };
  const removeSlot = (i: number) => {
    const n = pairs.filter((_, j) => j !== i); onChange(n.length ? n : [emptyPair()]);
    if (potPairs && onPotChange) { const m = potPairs.filter((_, j) => j !== i); onPotChange(m.length ? m : [emptyPair()]); }
  };
  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <SlotRow key={i} label={labels ? (labels[i] || `${prefix || ''}${i + 1}`) : `${prefix || ''}${i + 1}`} pair={p}
          potPair={potPairs?.[i]} onPotChange={onPotChange ? pp => updPot(i, pp) : undefined}
          onPairChange={v => updSlot(i, v)} cmp={cmp} accent={accent}
          onRemove={pairs.length > 1 ? () => removeSlot(i) : undefined} />
      ))}
      {pairs.length < maxSlots && (
        <button type="button" onClick={addSlot}
          className="w-full py-2 rounded-xl border border-dashed text-sm font-bold cursor-pointer"
          style={{ borderColor: accent + "40", color: accent + "80" }}>
          + เพิ่มช่อง
        </button>
      )}
    </div>
  );
}

// PairPanel
function PairPanel({ pair, onChange, cmp, accent = "#ffd700" }: {
  pair: Pair; onChange: (p: Pair) => void; cmp: boolean; accent?: string;
}) {
  const [cur, cm] = pair;
  if (!cmp) return (
    <InnerCard className="p-3">
      <StatList rows={cur} onChange={r => onChange([r, cm])} accent={accent} />
    </InnerCard>
  );
  return (
    <InnerCard>
      <div className="p-3">
        <div className="grid grid-cols-2 mb-2">
          <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">ปัจจุบัน</div>
          <div className="text-[10px] font-bold uppercase tracking-widest pl-3" style={{ color: accent }}>ใหม่</div>
        </div>
        <PairCols pair={pair} onChange={onChange} accent={accent} dim0 />
      </div>
      <div className="px-3 py-2 border-t border-[#232323] bg-[#191919] rounded-b-xl"><DiffPills a={cur} b={getEff(pair)} /></div>
    </InnerCard>
  );
}

// SubPanel
function SubPanel({ label, icon, accent, open, onToggle, children }: {
  label: string; icon: string; accent: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#252525]">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold hover:bg-[#2a2a2a] transition-colors cursor-pointer"
        style={{ color: open ? accent : "#4a4a4a" }}>
        <span>{icon} {label}</span>
        <span style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", fontSize: 9, color: "#555" }}>▼</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-[#252525]" style={{ background: "#191919" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ArmorSlotRow
function ArmorSlotRow({ label, slot, onChange, cmp, accent = "#fb923c" }: {
  label: string; slot: ArmorSlot; onChange: (s: ArmorSlot) => void; cmp: boolean; accent?: string;
}) {
  const [enhOpen, setEnhOpen] = useState(false);
  const [potOpen, setPotOpen] = useState(false);
  const [curSt, cmSt] = slot.statPair;
  const [curEn, cmEn] = slot.enhancedPair;
  const pot = slot.potentialPair ?? emptyPair();
  const [curPot, cmPot] = pot;
  return (
    <InnerCard>
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-2 border-b border-[#232323]">
        <span className="text-sm font-bold" style={{ color: cmp ? "#3a3a3a" : accent }}>{label}</span>
        {cmp && <><div className="flex-1 h-px bg-[#232323]" />
          <span className="text-[10px] text-[#444] font-bold uppercase tracking-widest">ปัจจุบัน</span>
          <div className="w-px h-3 bg-[#333] mx-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>ใหม่</span>
        </>}
      </div>
      <div className="p-3">
        {cmp ? (
          <>
            <div className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-2">Base Stats</div>
            <PairCols pair={slot.statPair} onChange={p => onChange({ ...slot, statPair: p })} accent={accent} dim0 />
          </>
        ) : (
          <StatList rows={curSt} onChange={r => onChange({ ...slot, statPair: [r, cmSt] })} accent={accent} />
        )}
      </div>
      <SubPanel label="Enhanced Ability" icon="✦" accent="#ffd700" open={enhOpen} onToggle={() => setEnhOpen(o => !o)}>
        {cmp ? (
          <PairCols pair={slot.enhancedPair} onChange={p => onChange({ ...slot, enhancedPair: p })} accent="#ffd700" dim0 />
        ) : (
          <StatList rows={curEn} onChange={r => onChange({ ...slot, enhancedPair: [r, cmEn] })} accent="#ffd700" />
        )}
      </SubPanel>
      <SubPanel label="Potential" icon="◈" accent="#a78bfa" open={potOpen} onToggle={() => setPotOpen(o => !o)}>
        {cmp ? (
          <PairCols pair={pot} onChange={p => onChange({ ...slot, potentialPair: p })} accent="#a78bfa" dim0 />
        ) : (
          <StatList rows={curPot} onChange={r => onChange({ ...slot, potentialPair: [r, pot[1]] })} accent="#a78bfa" />
        )}
      </SubPanel>
      {cmp && (
        <div className="px-3 py-2 border-t border-[#232323] bg-[#191919] rounded-b-xl">
          <DiffPills a={[...curSt, ...curEn, ...curPot]} b={[...getEff(slot.statPair), ...getEff(slot.enhancedPair), ...getEff(pot)]} />
        </div>
      )}
    </InnerCard>
  );
}

// WeaponDmgRow
function WeaponDmgRow({ label, curMin, curMax, cmpMin, cmpMax, onCurMin, onCurMax, onCmpMin, onCmpMax, rowColor, cmp }: {
  label: string; curMin: string; curMax: string; cmpMin: string; cmpMax: string;
  onCurMin: (v: string) => void; onCurMax: (v: string) => void;
  onCmpMin: (v: string) => void; onCmpMax: (v: string) => void;
  rowColor: string; cmp: boolean;
}) {
  const I = "bg-[#181818] border border-[#303030] rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#ffd70060] text-[#e0e0e0] w-full";
  const D = "bg-[#181818] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-center text-[#383838] cursor-not-allowed w-full";
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold" style={{ color: cmp ? "#3a3a3a" : rowColor }}>{label}</div>
      {cmp ? (
        <>
          <div className="grid grid-cols-4 gap-1.5 mb-1">
            <div className="col-span-2 text-[10px] text-[#3a3a3a] uppercase font-bold tracking-widest">ปัจจุบัน</div>
            <div className="col-span-2 text-[10px] uppercase font-bold tracking-widest" style={{ color: rowColor }}>ใหม่</div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div><div className="text-[10px] text-[#333] mb-0.5">Min</div><input className={D} value={curMin} disabled /></div>
            <div><div className="text-[10px] text-[#333] mb-0.5">Max</div><input className={D} value={curMax} disabled /></div>
            <div><div className="text-[10px] mb-0.5" style={{ color: rowColor }}>Min</div>
              <input className={I} value={cmpMin} onChange={e => onCmpMin(e.target.value)} placeholder={curMin || "0"} /></div>
            <div><div className="text-[10px] mb-0.5" style={{ color: rowColor }}>Max</div>
              <input className={I} value={cmpMax} onChange={e => onCmpMax(e.target.value)} placeholder={curMax || "0"} /></div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <div><div className="text-[10px] text-[#555] mb-0.5">Min</div>
            <input className={I} value={curMin} onChange={e => onCurMin(e.target.value)} placeholder="0" /></div>
          <div><div className="text-[10px] text-[#555] mb-0.5">Max</div>
            <input className={I} value={curMax} onChange={e => onCurMax(e.target.value)} placeholder="0" /></div>
        </div>
      )}
    </div>
  );
}

// WeaponPctRow
const PCT_I = "border rounded-lg pl-2 pr-6 py-1.5 text-xs text-right focus:outline-none w-full bg-[#181818] border-[#303030] text-[#e0e0e0] focus:border-[#ffd70060]";
const PCT_D = "border rounded-lg pl-2 pr-6 py-1.5 text-xs text-right focus:outline-none w-full bg-[#181818] border-[#2a2a2a] text-[#383838] cursor-not-allowed";
function WeaponPctRow({ label, curMin, curMax, cmpMin, cmpMax, onCurMin, onCurMax, onCmpMin, onCmpMax, rowColor, cmp }: {
  label: string; curMin: string; curMax: string; cmpMin: string; cmpMax: string;
  onCurMin: (v: string) => void; onCurMax: (v: string) => void;
  onCmpMin: (v: string) => void; onCmpMax: (v: string) => void;
  rowColor: string; cmp: boolean;
}) {
  const pctInp = (val: string, onChange: (v: string) => void, ph?: string) => (
    <div className="relative">
      <input className={PCT_I} value={val} onChange={e => onChange(e.target.value)} placeholder={ph || "0"} />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" style={{ color: rowColor }}>%</span>
    </div>
  );
  const pctDis = (val: string) => (
    <div className="relative">
      <input className={PCT_D} value={val} disabled placeholder="0" />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none text-[#383838]">%</span>
    </div>
  );
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold" style={{ color: cmp ? "#3a3a3a" : rowColor }}>{label}</div>
      {cmp ? (
        <>
          <div className="grid grid-cols-4 gap-1.5 mb-1">
            <div className="col-span-2 text-[10px] text-[#3a3a3a] uppercase font-bold tracking-widest">ปัจจุบัน</div>
            <div className="col-span-2 text-[10px] uppercase font-bold tracking-widest" style={{ color: rowColor }}>ใหม่</div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div><div className="text-[10px] text-[#333] mb-0.5">Min</div>{pctDis(curMin)}</div>
            <div><div className="text-[10px] text-[#333] mb-0.5">Max</div>{pctDis(curMax)}</div>
            <div><div className="text-[10px] mb-0.5" style={{ color: rowColor }}>Min</div>{pctInp(cmpMin, onCmpMin, curMin || "0")}</div>
            <div><div className="text-[10px] mb-0.5" style={{ color: rowColor }}>Max</div>{pctInp(cmpMax, onCmpMax, curMax || "0")}</div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <div><div className="text-[10px] text-[#555] mb-0.5">Min</div>{pctInp(curMin, onCurMin)}</div>
          <div><div className="text-[10px] text-[#555] mb-0.5">Max</div>{pctInp(curMax, onCurMax)}</div>
        </div>
      )}
    </div>
  );
}

// WeaponCard
function WeaponCard({ label, data, onChange, cmp, accent }: {
  label: string; data: WeaponData; onChange: (d: WeaponData) => void; cmp: boolean; accent: string;
}) {
  const [enhOpen, setEnhOpen] = useState(false);
  const [potOpen, setPotOpen] = useState(false);
  const pot = data.potentialPair ?? emptyPair();
  return (
    <InnerCard>
      <div className="px-3 pt-2.5 pb-2 border-b border-[#232323]">
        <span className="text-sm font-bold" style={{ color: accent }}>{label}</span>
      </div>
      <div className="p-3 space-y-3">
        <WeaponDmgRow label="⚔️ Physical" cmp={cmp} rowColor="#fb923c"
          curMin={data.physMin} curMax={data.physMax} cmpMin={data.physMinCmp} cmpMax={data.physMaxCmp}
          onCurMin={v => onChange({ ...data, physMin: v })} onCurMax={v => onChange({ ...data, physMax: v })}
          onCmpMin={v => onChange({ ...data, physMinCmp: v })} onCmpMax={v => onChange({ ...data, physMaxCmp: v })} />
        <WeaponDmgRow label="🔮 Magic" cmp={cmp} rowColor="#38bdf8"
          curMin={data.magMin} curMax={data.magMax} cmpMin={data.magMinCmp} cmpMax={data.magMaxCmp}
          onCurMin={v => onChange({ ...data, magMin: v })} onCurMax={v => onChange({ ...data, magMax: v })}
          onCmpMin={v => onChange({ ...data, magMinCmp: v })} onCmpMax={v => onChange({ ...data, magMaxCmp: v })} />
        <div>
          <div className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-2">Weapon Stats</div>
          {cmp ? (
            <PairCols pair={data.statPair} onChange={p => onChange({ ...data, statPair: p })} accent={accent} dim0 />
          ) : (
            <StatList rows={data.statPair[0]} onChange={r => onChange({ ...data, statPair: [r, data.statPair[1]] })} accent={accent} />
          )}
        </div>
      </div>
      <SubPanel label="Enhanced Ability" icon="✦" accent="#ffd700" open={enhOpen} onToggle={() => setEnhOpen(o => !o)}>
        <div className="space-y-3">
          <WeaponDmgRow label="⚔️ Physical" cmp={cmp} rowColor="#ffd700"
            curMin={data.enhPhysMin ?? ""} curMax={data.enhPhysMax ?? ""} cmpMin={data.enhPhysMinCmp ?? ""} cmpMax={data.enhPhysMaxCmp ?? ""}
            onCurMin={v => onChange({ ...data, enhPhysMin: v })} onCurMax={v => onChange({ ...data, enhPhysMax: v })}
            onCmpMin={v => onChange({ ...data, enhPhysMinCmp: v })} onCmpMax={v => onChange({ ...data, enhPhysMaxCmp: v })} />
          <WeaponDmgRow label="🔮 Magic" cmp={cmp} rowColor="#ffd700"
            curMin={data.enhMagMin ?? ""} curMax={data.enhMagMax ?? ""} cmpMin={data.enhMagMinCmp ?? ""} cmpMax={data.enhMagMaxCmp ?? ""}
            onCurMin={v => onChange({ ...data, enhMagMin: v })} onCurMax={v => onChange({ ...data, enhMagMax: v })}
            onCmpMin={v => onChange({ ...data, enhMagMinCmp: v })} onCmpMax={v => onChange({ ...data, enhMagMaxCmp: v })} />
          {cmp ? (
            <PairCols pair={data.enhancedPair} onChange={p => onChange({ ...data, enhancedPair: p })} accent="#ffd700" dim0 />
          ) : (
            <StatList rows={data.enhancedPair[0]} onChange={r => onChange({ ...data, enhancedPair: [r, data.enhancedPair[1]] })} accent="#ffd700" />
          )}
        </div>
      </SubPanel>
      <SubPanel label="Potential" icon="◈" accent="#a78bfa" open={potOpen} onToggle={() => setPotOpen(o => !o)}>
        <div className="space-y-3">
          <WeaponPctRow label="⚔️ Physical %" cmp={cmp} rowColor="#a78bfa"
            curMin={data.potPhysMin ?? ""} curMax={data.potPhysMax ?? ""} cmpMin={data.potPhysMinCmp ?? ""} cmpMax={data.potPhysMaxCmp ?? ""}
            onCurMin={v => onChange({ ...data, potPhysMin: v })} onCurMax={v => onChange({ ...data, potPhysMax: v })}
            onCmpMin={v => onChange({ ...data, potPhysMinCmp: v })} onCmpMax={v => onChange({ ...data, potPhysMaxCmp: v })} />
          <WeaponPctRow label="🔮 Magic %" cmp={cmp} rowColor="#a78bfa"
            curMin={data.potMagMin ?? ""} curMax={data.potMagMax ?? ""} cmpMin={data.potMagMinCmp ?? ""} cmpMax={data.potMagMaxCmp ?? ""}
            onCurMin={v => onChange({ ...data, potMagMin: v })} onCurMax={v => onChange({ ...data, potMagMax: v })}
            onCmpMin={v => onChange({ ...data, potMagMinCmp: v })} onCmpMax={v => onChange({ ...data, potMagMaxCmp: v })} />
          {cmp ? (
            <PairCols pair={pot} onChange={p => onChange({ ...data, potentialPair: p })} accent="#a78bfa" dim0 />
          ) : (
            <StatList rows={pot[0]} onChange={r => onChange({ ...data, potentialPair: [r, pot[1]] })} accent="#a78bfa" />
          )}
        </div>
      </SubPanel>
      {cmp && (
        <div className="px-3 py-2 border-t border-[#232323] bg-[#191919] rounded-b-xl">
          <DiffPills a={[...data.statPair[0], ...data.enhancedPair[0], ...pot[0]]} b={[...getEff(data.statPair), ...getEff(data.enhancedPair), ...getEff(pot)]} />
        </div>
      )}
    </InnerCard>
  );
}

// CostumeWeaponCard
function CostumeWeaponCard({ label, slot, onChange, cmp, accent }: {
  label: string; slot: CostumeSlot; onChange: (s: CostumeSlot) => void; cmp: boolean; accent: string;
}) {
  return (
    <InnerCard>
      <div className="px-3 pt-2.5 pb-2 border-b border-[#232323]">
        <span className="text-sm font-bold" style={{ color: accent }}>{label}</span>
      </div>
      <div className="p-3 space-y-3">
        <WeaponPctRow label="⚔️ Physical %" cmp={cmp} rowColor="#fb923c"
          curMin={slot.physMin} curMax={slot.physMax} cmpMin={slot.physMinCmp} cmpMax={slot.physMaxCmp}
          onCurMin={v => onChange({ ...slot, physMin: v })} onCurMax={v => onChange({ ...slot, physMax: v })}
          onCmpMin={v => onChange({ ...slot, physMinCmp: v })} onCmpMax={v => onChange({ ...slot, physMaxCmp: v })} />
        <WeaponPctRow label="🔮 Magic %" cmp={cmp} rowColor="#38bdf8"
          curMin={slot.magMin} curMax={slot.magMax} cmpMin={slot.magMinCmp} cmpMax={slot.magMaxCmp}
          onCurMin={v => onChange({ ...slot, magMin: v })} onCurMax={v => onChange({ ...slot, magMax: v })}
          onCmpMin={v => onChange({ ...slot, magMinCmp: v })} onCmpMax={v => onChange({ ...slot, magMaxCmp: v })} />
        <div>
          <div className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-2">Costume Stats</div>
          {cmp ? (
            <PairCols pair={slot.statPair} onChange={p => onChange({ ...slot, statPair: p })} accent={accent} dim0 />
          ) : (
            <StatList rows={slot.statPair[0]} onChange={r => onChange({ ...slot, statPair: [r, slot.statPair[1]] })} accent={accent} />
          )}
        </div>
      </div>
      {cmp && (
        <div className="px-3 py-2 border-t border-[#232323] bg-[#191919] rounded-b-xl">
          <DiffPills a={slot.statPair[0]} b={getEff(slot.statPair)} />
        </div>
      )}
    </InnerCard>
  );
}

// SetBonusBlock
function SetBonusBlock({ bonuses, onChange, color, cmp, maxPieces }: {
  bonuses: SetBonusEntry[]; onChange: (b: SetBonusEntry[]) => void;
  color: string; cmp: boolean; maxPieces: number;
}) {
  const pieceOpts = Array.from({ length: maxPieces }, (_, k) => k + 1);

  const rows = (nb: SetBonusEntry[], pieces: number, side: 0 | 1): StatRow[] =>
    nb.find(b => b.pieces === pieces)?.effects[0].pair[side] ?? [];

  const setRows = (nb: SetBonusEntry[], pieces: number, side: 0 | 1, r: StatRow[]): SetBonusEntry[] =>
    nb.map(b => {
      if (b.pieces !== pieces) return b;
      const ef = { ...b.effects[0] };
      ef.pair = (side === 0 ? [r, ef.pair[1]] : [ef.pair[0], r]) as Pair;
      return { ...b, effects: [ef] };
    });

  const ensure = (nb: SetBonusEntry[], pieces: number): SetBonusEntry[] => {
    if (nb.find(b => b.pieces === pieces)) return nb;
    const entry: SetBonusEntry = { pieces, effects: [{ id: uid(), pair: [[], []] as unknown as Pair }], enabledCur: true, enabledCmp: true };
    return [...nb, entry].sort((a, b) => a.pieces - b.pieces)
      .map(b => b.pieces <= pieces ? { ...b, enabledCur: true, enabledCmp: true } : b);
  };

  const prune = (nb: SetBonusEntry[]): SetBonusEntry[] => nb.filter(b => b.effects[0].pair[0].length > 0 || b.effects[0].pair[1].length > 0);

  const PENDING = 0;
  const addStat = (side: 0 | 1) => {
    let nb = [...bonuses];
    if (!nb.find(b => b.pieces === PENDING)) {
      const entry: SetBonusEntry = { pieces: PENDING, effects: [{ id: uid(), pair: [[], []] as unknown as Pair }], enabledCur: false, enabledCmp: false };
      nb = [...nb, entry];
    }
    onChange(setRows(nb, PENDING, side, [...rows(nb, PENDING, side), emptyRow()]));
  };

  const updRow = (entryPieces: number, side: 0 | 1, ri: number, row: StatRow) => {
    const r = [...rows(bonuses, entryPieces, side)]; r[ri] = row;
    onChange(setRows([...bonuses], entryPieces, side, r));
  };

  const delRow = (entryPieces: number, side: 0 | 1, ri: number) => {
    const r = rows(bonuses, entryPieces, side).filter((_: StatRow, k: number) => k !== ri);
    onChange(prune(setRows([...bonuses], entryPieces, side, r)));
  };

  const moveRow = (entryPieces: number, side: 0 | 1, ri: number, toPieces: number) => {
    if (entryPieces === toPieces) return;
    const row = rows(bonuses, entryPieces, side)[ri];
    if (!row) return;
    const srcR = rows(bonuses, entryPieces, side).filter((_: StatRow, k: number) => k !== ri);
    let nb = setRows([...bonuses], entryPieces, side, srcR);
    nb = ensure(nb, toPieces);
    nb = setRows(nb, toPieces, side, [...rows(nb, toPieces, side), row]);
    onChange(prune(nb));
  };

  const removeSide = (pieces: number, side: 0 | 1) => {
    const nb = setRows([...bonuses], pieces, side, []);
    onChange(prune(nb));
  };

  const copyToRight = () => {
    const nb = bonuses.map(b => {
      const ef = { ...b.effects[0] };
      const srcRows = [...ef.pair[0].map((r: StatRow) => ({ ...r, id: uid() }))];
      ef.pair = [ef.pair[0], srcRows] as Pair;
      return { ...b, effects: [ef], enabledCmp: b.enabledCur };
    });
    onChange(nb);
  };

  const toggleCur = (pieces: number) => {
    const wasOn = bonuses.find(b => b.pieces === pieces)?.enabledCur ?? false;
    onChange(bonuses.map(b => wasOn ? b.pieces >= pieces ? { ...b, enabledCur: false } : b : b.pieces <= pieces ? { ...b, enabledCur: true } : b));
  };
  const toggleCmp = (pieces: number) => {
    const wasOn = bonuses.find(b => b.pieces === pieces)?.enabledCmp ?? false;
    onChange(bonuses.map(b => wasOn ? b.pieces >= pieces ? { ...b, enabledCmp: false } : b : b.pieces <= pieces ? { ...b, enabledCmp: true } : b));
  };

  function PieceSel({ pieces, onPiece, dim }: { pieces: number; onPiece: (p: number) => void; dim?: boolean }) {
    const isPending = pieces === 0;
    return (
      <div className="relative shrink-0">
        <select value={pieces} onChange={e => onPiece(parseInt(e.target.value))} disabled={dim}
          className="appearance-none pl-2 pr-5 rounded-lg border text-xs font-bold focus:outline-none h-[30px]"
          style={{
            background: "#181818", borderColor: isPending ? "#555" : color + "55",
            color: dim ? "#333" : isPending ? "#888" : color, cursor: dim ? "default" : "pointer", minWidth: 54
          }}>
          {isPending && <option value={0}>— pc</option>}
          {pieceOpts.map(p => <option key={p} value={p}>{p}P</option>)}
        </select>
        {!dim && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none" style={{ color: isPending ? "#555" : color + "80" }}>▾</span>}
      </div>
    );
  }

  function SBRow({ entryPieces, rowIdx, side, dim }: { entryPieces: number; rowIdx: number; side: 0 | 1; dim: boolean }) {
    const row = rows(bonuses, entryPieces, side)[rowIdx];
    if (!row) return null;
    return (
      <div className="flex gap-1 items-center group/sbrow min-w-0">
{PieceSel({ pieces: entryPieces, onPiece: (p: number) => moveRow(entryPieces, side, rowIdx, p), dim })}
        <div className="w-[130px] shrink-0">
          <StatTypeSelect value={row.type} onChange={v => updRow(entryPieces, side, rowIdx, { ...row, type: v })} dim={dim} />
        </div>
        <input type="text" placeholder="0" value={row.value}
          onChange={e => updRow(entryPieces, side, rowIdx, { ...row, value: e.target.value })} disabled={dim}
          className="w-16 shrink-0 bg-[#181818] border border-[#303030] rounded-lg px-2 text-xs text-right focus:outline-none focus:border-[#ffd70060] h-[30px]"
          style={{ color: dim ? "#2e2e2e" : "#e0e0e0" }} />
        <button type="button" disabled={dim} onClick={() => updRow(entryPieces, side, rowIdx, { ...row, isPercent: !row.isPercent })}
          className="shrink-0 rounded-lg border text-[10px] font-bold h-[30px] w-8"
          style={{
            background: row.isPercent ? "#ffd70018" : "#181818", borderColor: row.isPercent ? "#ffd70060" : "#303030",
            color: row.isPercent ? "#ffd700" : (dim ? "#2e2e2e" : "#555"), cursor: dim ? "default" : "pointer"
          }}>%</button>
        {!dim && <button type="button" onClick={() => delRow(entryPieces, side, rowIdx)}
          className="opacity-0 group-hover/sbrow:opacity-100 shrink-0 text-[#444] hover:text-[#ef4444] text-xs w-4 select-none cursor-pointer">✕</button>}
      </div>
    );
  }

  function AllRows({ side, isEnabled }: { side: 0 | 1; isEnabled: (pieces: number) => boolean }) {
    return (
      <div className="space-y-1.5">
        {bonuses.map(b =>
          rows(bonuses, b.pieces, side).map((row: StatRow, ri: number) => (
            <React.Fragment key={`${b.pieces}-${side}-${ri}-${row.id}`}>
              {SBRow({ entryPieces: b.pieces, rowIdx: ri, side, dim: b.pieces > 0 && !isEnabled(b.pieces) })}
            </React.Fragment>
          ))
        )}
        <button type="button" onClick={() => addStat(side)}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-dashed mt-0.5 cursor-pointer"
          style={{ borderColor: color + "40", color: color + "80" }}>
          <span className="font-bold text-sm leading-none">+</span> เพิ่ม stat
        </button>
      </div>
    );
  }

  function PieceChips({ side }: { side: 0 | 1 }) {
    const allPieces = bonuses.filter(b => b.pieces > 0);
    const displayPieces = cmp && side === 0 ? allPieces.filter(b => rows(bonuses, b.pieces, 0).length > 0) : allPieces;

    if (displayPieces.length === 0) return (
      <div className="text-xs text-[#3a3a3a] italic mb-3">กด "+ เพิ่ม stat" เพื่อเริ่ม</div>
    );
    return (
      <div className="flex flex-wrap gap-1.5 mb-3 items-center">
        {displayPieces.map(b => {
          const hasRows = rows(bonuses, b.pieces, side).length > 0;
          const on = side === 0 ? b.enabledCur : b.enabledCmp;
          const toggle = () => side === 0 ? toggleCur(b.pieces) : toggleCmp(b.pieces);
          return (
            <div key={b.pieces} className="flex items-center group/chip">
              <button type="button" onClick={toggle}
                className="px-2.5 h-[26px] rounded-l-lg border-y border-l text-xs font-bold cursor-pointer transition-colors"
                style={{
                  background: on && hasRows ? color + "22" : "#1e1e1e", borderColor: on && hasRows ? color : "#383838",
                  color: on && hasRows ? color : hasRows ? "#555" : "#333"
                }}>
                {b.pieces}P{on && hasRows ? " ✓" : ""}
              </button>
              {hasRows ? (
                <button type="button" onClick={() => removeSide(b.pieces, side)}
                  className="opacity-0 group-hover/chip:opacity-100 px-1.5 h-[26px] rounded-r-lg border-y border-r text-[10px] cursor-pointer transition-all"
                  style={{ borderColor: "#ef444440", color: "#ef4444", background: "#ef444410" }}>✕</button>
              ) : (
                <div className="h-[26px] px-0.5 rounded-r-lg border-y border-r"
                  style={{ borderColor: "#2a2a2a", background: "transparent" }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (!cmp) {
    return (
      <InnerCard className="p-3">
        {PieceChips({ side: 0 })}
        {AllRows({ side: 0, isEnabled: p => bonuses.find(b => b.pieces === p)?.enabledCur ?? false })}
      </InnerCard>
    );
  }

  const getEnabledRows = (side: 0 | 1) =>
    bonuses.filter(b => b.pieces > 0 && (side === 0 ? b.enabledCur : b.enabledCmp))
      .flatMap(b => b.effects[0].pair[side] ?? []);

  return (
    <InnerCard>
      <div className="grid grid-cols-2 divide-x divide-[#282828]">
        <div className="p-3">
          <div className="flex items-center h-[22px] mb-2">
            <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">ปัจจุบัน</div>
          </div>
          {PieceChips({ side: 0 })}
          {AllRows({ side: 0, isEnabled: p => bonuses.find(b => b.pieces === p)?.enabledCur ?? false })}
        </div>
        <div className="p-3">
          <div className="flex items-center h-[22px] gap-2 mb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>ใหม่</div>
            <button type="button" onClick={copyToRight}
              className="text-[10px] px-1.5 py-0.5 rounded border cursor-pointer hover:opacity-90 transition-opacity"
              style={{ borderColor: color + "40", color: color + "90", background: color + "10" }}>
              ← copy
            </button>
          </div>
          {PieceChips({ side: 1 })}
          {AllRows({ side: 1, isEnabled: p => bonuses.find(b => b.pieces === p)?.enabledCmp ?? false })}
        </div>
      </div>
      <div className="px-3 py-2 border-t border-[#232323] bg-[#191919] rounded-b-xl">
        <DiffPills a={getEnabledRows(0)} b={getEnabledRows(1)} />
      </div>
    </InnerCard>
  );
}


// RightPanel
function RightPanel({ build, skill, setSkill, cmp }: {
  build: BuildState; skill: SkillConfig; setSkill: (s: SkillConfig) => void; cmp: boolean;
}) {
  const cur = calcDmg(build, skill, 0);
  const cmpR = calcDmg(build, skill, 1);
  const inp = "w-full bg-[#1e1e1e] border border-[#303030] rounded-xl px-3 py-2 text-sm text-[#e0e0e0] focus:outline-none focus:border-[#ffd70060]";
  const fdRow = (FD_TABLE as readonly { patch: number; fd60: number; r145: number; r4560: number }[]).find(r => r.patch === skill.patchLv)!;
  const fmt = (n: number) => Math.round(n).toLocaleString();

  function DRow({ label, min, max, cMin, cMax, color }: { label: string; min: number; max: number; cMin: number; cMax: number; color: string }) {
    const dMin = cMin - min, dMax = cMax - max;
    const pctMin = min > 0 ? ((cMin - min) / min * 100) : 0;
    const pctMax = max > 0 ? ((cMax - max) / max * 100) : 0;
    const avgPct = (pctMin + pctMax) / 2;
    return (
      <div className="p-3 rounded-xl bg-[#1d1d1d] border border-[#2c2c2c]">
        <div className="text-xs font-bold mb-1.5" style={{ color }}>{label}</div>
        {cmp ? (
          <div className="space-y-1">
            <div className="text-sm text-[#333] font-bold">{fmt(min)} – {fmt(max)}</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#3a3a3a]">→</span>
              <span className="text-sm font-bold" style={{ color }}>{fmt(cMin)} – {fmt(cMax)}</span>
            </div>
            <div className="flex gap-1 flex-wrap items-center">
              {[{ d: dMin, p: pctMin }, { d: dMax, p: pctMax }]
                .filter((x, i, a) => a.findIndex(y => y.d === x.d) === i)
                .map((x, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: x.d >= 0 ? "#22c55e15" : "#ef444415", color: x.d >= 0 ? "#22c55e" : "#ef4444",
                    border: "1px solid " + (x.d >= 0 ? "#22c55e35" : "#ef444435")
                  }}>
                  {x.d >= 0 ? "+" : ""}{fmt(x.d)}
                </span>
              ))}
              {(Math.abs(avgPct) > 0.01) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: avgPct >= 0 ? "#22c55e10" : "#ef444410",
                    color: avgPct >= 0 ? "#22c55e" : "#ef4444",
                    border: "1px solid " + (avgPct >= 0 ? "#22c55e25" : "#ef444425")
                  }}>
                  {avgPct >= 0 ? "+" : ""}{avgPct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-lg font-bold" style={{ color }}>{fmt(min)} – {fmt(max)}</div>
        )}
      </div>
    );
  }

  function StatBox({ label, val, cVal, color, diff }: { label: React.ReactNode; val: string; cVal: string; color: string; diff?: { val: number; unit?: string } }) {
    return (
      <div className="p-2 rounded-xl bg-[#1e1e1e] border border-[#2c2c2c] text-center flex flex-col justify-center min-w-0">
        <div className="text-[10px] sm:text-xs mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color }}>{label}</div>
        {cmp ? (
          <div className="flex flex-col items-center leading-tight mt-1">
            <span className="text-[10px] font-bold text-[#666]">{val}</span>
            <span className="text-[8px] text-[#444] my-0.5">▼</span>
            <span className="text-xs font-bold" style={{ color }}>{cVal}</span>
            {diff !== undefined && Math.abs(diff.val) > 0.001 && (
              <span className="mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: diff.val >= 0 ? "#22c55e12" : "#ef444412",
                  color: diff.val >= 0 ? "#22c55e" : "#ef4444",
                  border: "1px solid " + (diff.val >= 0 ? "#22c55e30" : "#ef444430")
                }}>
                {diff.val >= 0 ? "+" : ""}{diff.val.toFixed(diff.unit === "raw" ? 0 : 1)}{diff.unit !== "raw" ? "%" : ""}
              </span>
            )}
          </div>
        ) : (
          <div className="text-[13px] sm:text-sm font-bold mt-0.5" style={{ color }}>{val}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Collapsible title="Skill Config" icon="🎯" color="#ffd700" defaultOpen>
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Skill Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["phys", "magic"] as const).map(t => (
                <button key={t} type="button" onClick={() => setSkill({ ...skill, skillType: t })}
                  className="py-2 rounded-xl text-sm font-bold border cursor-pointer"
                  style={{
                    background: skill.skillType === t ? (t === "phys" ? "#fb923c20" : "#38bdf820") : "#1e1e1e",
                    borderColor: skill.skillType === t ? (t === "phys" ? "#fb923c" : "#38bdf8") : "#303030",
                    color: skill.skillType === t ? (t === "phys" ? "#fb923c" : "#38bdf8") : "#555"
                  }}>
                  {t === "phys" ? "⚔️ Physical" : "🔮 Magic"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">Element</label>
            <div className="grid grid-cols-3 gap-1">
              {(["none", "fire", "ice", "light", "dark"] as const).map(el => (
                <button key={el} type="button" onClick={() => setSkill({ ...skill, skillElement: el })}
                  className="py-1.5 rounded-xl text-xs font-bold border capitalize cursor-pointer"
                  style={{
                    background: skill.skillElement === el ? ELEM_COLORS[el] + "20" : "#1e1e1e",
                    borderColor: skill.skillElement === el ? ELEM_COLORS[el] : "#303030",
                    color: skill.skillElement === el ? ELEM_COLORS[el] : "#555"
                  }}>
                  {el === "none" ? "—" : el === "fire" ? "🔥" : el === "ice" ? "❄️" : el === "light" ? "⚡" : "🌑"}{" "}{el === "none" ? "None" : el}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-[#666] mb-1.5 block">Skill %</label>
              <input className={inp} value={skill.skillPct} onChange={e => setSkill({ ...skill, skillPct: e.target.value })} placeholder="100" /></div>
            <div><label className="text-xs text-[#666] mb-1.5 block">Fixed Val</label>
              <input className={inp} value={skill.fixedValue} onChange={e => setSkill({ ...skill, fixedValue: e.target.value })} placeholder="1000" /></div>
            <div><label className="text-xs text-[#666] mb-1.5 block">Patch LV</label>
              <div className="relative">
                <select value={skill.patchLv} onChange={e => setSkill({ ...skill, patchLv: parseInt(e.target.value) })} className={inp + " appearance-none cursor-pointer"}>
                  {(FD_TABLE as readonly { patch: number }[]).map(r => <option key={r.patch} value={r.patch}>Patch {r.patch}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none text-xs">▾</span>
              </div>
            </div>
            <div><label className="text-xs text-[#666] mb-1.5 block">Target Res %</label>
              <input className={inp} value={skill.targetRes} onChange={e => setSkill({ ...skill, targetRes: e.target.value })} placeholder="0" /></div>
            <div className="col-span-2"><label className="text-xs text-[#666] mb-1.5 block">Debuff Sum %</label>
              <input className={inp} value={skill.debuffSum} onChange={e => setSkill({ ...skill, debuffSum: e.target.value })} placeholder="0" /></div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Stats Summary" icon="📊" color="#94a3b8" defaultOpen={true}>
        <div className="space-y-1.5 pt-1">
          {/* Base primary stats */}
          <div className="grid grid-cols-3 gap-1.5">
            <StatBox label="STR" val={fmt(cur.strFin)} cVal={fmt(cmpR.strFin)} color="#ef4444" diff={{ val: cmpR.strFin - cur.strFin, unit: "raw" }} />
            <StatBox label="AGI" val={fmt(cur.agiFin)} cVal={fmt(cmpR.agiFin)} color="#22c55e" diff={{ val: cmpR.agiFin - cur.agiFin, unit: "raw" }} />
            <StatBox label="INT" val={fmt(cur.intFin)} cVal={fmt(cmpR.intFin)} color="#a78bfa" diff={{ val: cmpR.intFin - cur.intFin, unit: "raw" }} />
          </div>
          {/* Attack ranges */}
          <div className="grid grid-cols-2 gap-1.5">
            <StatBox label="⚔️ Physical Attack" val={`${fmt(cur.physAtkMin)} - ${fmt(cur.physAtkMax)}`} cVal={`${fmt(cmpR.physAtkMin)} - ${fmt(cmpR.physAtkMax)}`} color="#fb923c"
              diff={{ val: cur.physAtkMax > 0 ? ((cmpR.physAtkMax - cur.physAtkMax) / cur.physAtkMax * 100) : 0 }} />
            <StatBox label="🔮 Magic Attack" val={`${fmt(cur.magAtkMin)} - ${fmt(cur.magAtkMax)}`} cVal={`${fmt(cmpR.magAtkMin)} - ${fmt(cmpR.magAtkMax)}`} color="#38bdf8"
              diff={{ val: cur.magAtkMax > 0 ? ((cmpR.magAtkMax - cur.magAtkMax) / cur.magAtkMax * 100) : 0 }} />
          </div>
          {/* Element Percentages */}
          <div className="grid grid-cols-4 gap-1.5">
            <StatBox label="🔥 Fire" val={`${cur.firePct}%`} cVal={`${cmpR.firePct}%`} color={ELEM_COLORS.fire} diff={{ val: cmpR.firePct - cur.firePct }} />
            <StatBox label="❄️ Ice" val={`${cur.icePct}%`} cVal={`${cmpR.icePct}%`} color={ELEM_COLORS.ice} diff={{ val: cmpR.icePct - cur.icePct }} />
            <StatBox label="⚡ Light" val={`${cur.lightPct}%`} cVal={`${cmpR.lightPct}%`} color={ELEM_COLORS.light} diff={{ val: cmpR.lightPct - cur.lightPct }} />
            <StatBox label="🌑 Dark" val={`${cur.darkPct}%`} cVal={`${cmpR.darkPct}%`} color={ELEM_COLORS.dark} diff={{ val: cmpR.darkPct - cur.darkPct }} />
          </div>
          {/* Final Damage */}
          <div className="grid grid-cols-1 gap-1.5">
            <StatBox label="✨ Final Damage" val={`${fmt(cur.fdRaw)} (${cur.fdPct}%)`} cVal={`${fmt(cmpR.fdRaw)} (${cmpR.fdPct}%)`} color="#ffd700"
              diff={{ val: cmpR.fdPct - cur.fdPct }} />
          </div>
        </div>
      </Collapsible>

      <div className="rounded-2xl border border-[#3c3c3c] overflow-hidden">
        <div className="px-4 py-3.5 bg-[#2e2e2e]">
          <span className="text-base mr-2.5">💥</span>
          <span className="text-sm font-bold text-[#ffd700]">Damage Breakdown</span>
        </div>
        <div className="px-4 py-3 bg-[#1a1a1a] space-y-2">
          <DRow label="⚔️ Base" min={cur.baseMin} max={cur.baseMax} cMin={cmpR.baseMin} cMax={cmpR.baseMax} color="#94a3b8" />
          <DRow label={"🌊 Element (" + (skill.skillElement === "none" ? "+0" : skill.skillElement) + ")"}
            min={cur.elemMin} max={cur.elemMax} cMin={cmpR.elemMin} cMax={cmpR.elemMax} color={ELEM_COLORS[skill.skillElement]} />
          <DRow label={"✨ Final Damage " + (cmp ? `${cur.fdPct}% → ${cmpR.fdPct}% (${cmpR.fdPct - cur.fdPct >= 0 ? "+" : ""}${cmpR.fdPct - cur.fdPct}% pts)` : `${cur.fdPct}%`)} min={cur.fdMin} max={cur.fdMax} cMin={cmpR.fdMin} cMax={cmpR.fdMax} color="#ffd700" />
          <DRow label="💥 Critical ×2" min={cur.critMin} max={cur.critMax} cMin={cmpR.critMin} cMax={cmpR.critMax} color="#f97316" />
          <div className="p-2.5 bg-[#191919] rounded-xl border border-[#2c2c2c] text-xs">
            <div className="text-[#555] mb-1">FD Table — Patch {skill.patchLv}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <span className="text-[#555]">60% = <b className="text-[#ffd700]">{fdRow?.fd60.toLocaleString()}</b></span>
              <span className="text-[#555]">1–45% /pt = <b className="text-white/30">{fdRow?.r145}</b></span>
              <span className="text-[#555]">45–60% /pt = <b className="text-white/30">{fdRow?.r4560}</b></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main
type ActiveTab = "general" | "costume" | "heraldry" | "card" | "rune" | "extra";

export default function DamageCalculator() {
  const [build, setBuild] = useState<BuildState>(defaultBuild);
  const [skill, setSkillState] = useState<SkillConfig>(defaultSkill);
  const [tab, setTab] = useState<ActiveTab>("general");
  const [cmp, setCmp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resetFlash, setResetFlash] = useState(false);

  useEffect(() => { setBuild(loadBuild()); setSkillState(loadSkill()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) saveBuild(build); }, [build, hydrated]);
  useEffect(() => { if (hydrated) saveSkill(skill); }, [skill, hydrated]);

  const setSkill = useCallback((s: SkillConfig) => setSkillState(s), []);
  const updPair = useCallback((key: keyof BuildState, i: number, pair: Pair) => {
    setBuild(b => { const arr = [...(b[key] as Pair[])]; arr[i] = pair; return { ...b, [key]: arr }; });
  }, []);
  const updArmorSlot = useCallback((i: number, slot: ArmorSlot) => {
    setBuild(b => { const arr = [...b.armorSlots]; arr[i] = slot; return { ...b, armorSlots: arr }; });
  }, []);
  const updCostumeSlot = useCallback((i: number, slot: CostumeSlot) => {
    setBuild(b => { const arr = [...b.costumeSlots]; arr[i] = slot; return { ...b, costumeSlots: arr }; });
  }, []);
  const resetSection = useCallback((partial: Partial<BuildState>) => { setBuild(b => ({ ...b, ...partial })); }, []);
  const resetAll = useCallback(() => {
    const fb = defaultBuild(), fs = defaultSkill();
    setBuild(fb); setSkillState(fs);
    localStorage.removeItem(BKEY);
    localStorage.removeItem(SKEY);
    setResetFlash(true); setTimeout(() => setResetFlash(false), 1500);
  }, []);
  const loadPreset = useCallback((b: BuildState, s: SkillConfig) => {
    setBuild(b); setSkillState(s);
  }, []);
  const presetState = usePresetState(build, skill, loadPreset);

  const classColor = CLASS_INFO[build.class].color;
  const TABS: [ActiveTab, string, string, string][] = [
    ["general", "🛡️", "General", "#fb923c"],
    ["costume", "👗", "Costume", "#f472b6"],
    ["heraldry", "📜", "Heraldry", "#ffd700"],
    ["card", "🃏", "Card", "#38bdf8"],
    ["rune", "💎", "Rune", "#34d399"],
    ["extra", "🏆", "Extra", "#a78bfa"],
  ];
  const COSTUME_WEAPON_LABELS = ["อาวุธหลัก", "อาวุธรอง"];
  const COSTUME_OTHER_LABELS = ["ปีก", "หาง", "แก้ม"];
  const ACC_LABELS = ["สร้อย", "ต่างหู", "แหวน 1", "แหวน 2"];

  if (!hydrated) return (
    <div className="font-kanit flex items-center justify-center min-h-[60vh]">
      <div className="text-[#555] text-sm animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <div className="font-kanit min-h-screen">
      <div className="container mx-auto w-[95%] max-w-[1200px] mt-3 mb-3 px-6 py-4 bg-[#282828] rounded-[24px] border border-[#363636]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[#ffd700] text-2xl font-semibold">⚔️ คำนวณดาเมจ</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <PresetManagerButton state={presetState} />
            <button type="button" onClick={() => setCmp(v => !v)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
              style={{
                background: cmp ? "#ffd70020" : "#141414", border: "1px solid " + (cmp ? "#ffd700" : "#383838"),
                color: cmp ? "#ffd700" : "#777", boxShadow: cmp ? "0 0 16px #ffd70018" : "none"
              }}>
              🔀 {cmp ? "ปิด Compare" : "Compare Mode"}
            </button>
            <ResetBtn onReset={resetAll} label="↺ รีเซตทั้งหมด" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {(Object.keys(CLASS_INFO) as ClassType[]).map(c => (
            <button key={c} type="button" onClick={() => setBuild(b => ({ ...b, class: c }))}
              className="flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: build.class === c ? CLASS_INFO[c].color + "20" : "#1e1e1e",
                border: "1px solid " + (build.class === c ? CLASS_INFO[c].color : "#303030"),
                color: build.class === c ? CLASS_INFO[c].color : "#555"
              }}>
              {CLASS_INFO[c].icon
                ? <img src={CLASS_INFO[c].icon} alt={c} className="w-4 h-4 object-contain" />
                : null} {c}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {(() => {
            const w = CLASS_INFO[build.class].physW; const parts = [];
            if (w.str) parts.push(`STR×${w.str}`); if (w.agi) parts.push(`AGI×${w.agi}`);
            return <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
              style={{ background: classColor + "18", color: classColor, border: "1px solid " + classColor + "35" }}>
              ⚔️ Physical Attack: {parts.join(' + ')}
            </span>;
          })()}
          {(() => {
            const w = CLASS_INFO[build.class].magW;
            return <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
              style={{ background: classColor + "18", color: classColor, border: "1px solid " + classColor + "35" }}>
              🔮 Magical Attack: INT×{w.int}
            </span>;
          })()}
          {cmp && <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#ffd70015] text-[#ffd700] border border-[#ffd70030]">
            🔀 Compare ON
          </span>}
          {resetFlash && <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#ef444415] text-[#ef4444] border border-[#ef444430] animate-pulse">
            ↺ รีเซตแล้ว
          </span>}
        </div>
      </div>

      <PresetPanel state={presetState} />

      <div className="container mx-auto w-[95%] max-w-[1200px] mb-6 flex gap-4 items-start">
        <div className="flex-1 min-w-0 bg-[#282828] rounded-[24px] border border-[#363636]">
          <div className="flex overflow-x-auto border-b border-[#333] px-3 pt-3 gap-0.5">
            {TABS.map(([id, icon, label, color]) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 pb-3 cursor-pointer transition-colors"
                style={{ borderBottomColor: tab === id ? color : "transparent", color: tab === id ? color : "#555" }}>
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-2.5">

            {tab === "general" && <>
              <Collapsible title="อาวุธ" icon="⚔️" color="#fb923c" onReset={() => resetSection(resetWeapons())}>
                <div className="space-y-2">
                  <WeaponCard label="อาวุธหลัก" data={build.weaponMain} onChange={d => setBuild(b => ({ ...b, weaponMain: d }))} cmp={cmp} accent="#fb923c" />
                  <WeaponCard label="อาวุธรอง" data={build.weaponSub} onChange={d => setBuild(b => ({ ...b, weaponSub: d }))} cmp={cmp} accent="#fb923c" />
                </div>
              </Collapsible>
              <Collapsible title="ชุด" icon="🛡️" color="#fb923c" onReset={() => resetSection(resetArmor())}>
                <div className="space-y-2">
                  {ARMOR_LABELS.map((lbl, i) => (
                    <ArmorSlotRow key={i} label={lbl} slot={build.armorSlots[i]} onChange={s => updArmorSlot(i, s)} cmp={cmp} accent="#fb923c" />
                  ))}
                </div>
              </Collapsible>
              <Collapsible title="Set Bonus ชุด" icon="✨" color="#fb923c" onReset={() => resetSection(resetGeneralSetBonus())}>
                <SetBonusBlock bonuses={build.generalSetBonus} onChange={b => setBuild(s => ({ ...s, generalSetBonus: b }))} color="#fb923c" cmp={cmp} maxPieces={7} />
              </Collapsible>
              <Collapsible title="ประดับ" icon="💍" color="#a78bfa" onReset={() => resetSection(resetGeneralAcc())}>
                <DynamicSlotList pairs={build.generalAcc} potPairs={build.generalAccPot ?? []} onChange={ps => setBuild(b => ({ ...b, generalAcc: ps }))} onPotChange={ps => setBuild(b => ({ ...b, generalAccPot: ps }))} cmp={cmp} accent="#a78bfa" labels={ACC_LABELS} maxSlots={4} />
              </Collapsible>
              <Collapsible title="Set Bonus ประดับ" icon="✨" color="#a78bfa" onReset={() => resetSection(resetGeneralAccSetBonus())}>
                <SetBonusBlock bonuses={build.generalAccSetBonus} onChange={b => setBuild(s => ({ ...s, generalAccSetBonus: b }))} color="#a78bfa" cmp={cmp} maxPieces={4} />
              </Collapsible>
            </>}

            {tab === "costume" && <>
              <Collapsible title="Costume อาวุธ" icon="⚔️" color="#f472b6" onReset={() => resetSection({ costumeSlots: [emptyCostumeSlot(), emptyCostumeSlot(), ...build.costumeSlots.slice(2)] })}>
                <div className="space-y-2">
                  {COSTUME_WEAPON_LABELS.map((lbl, i) => (
                    <CostumeWeaponCard key={i} label={lbl} slot={build.costumeSlots[i] as CostumeSlot} onChange={s => updCostumeSlot(i, s)} cmp={cmp} accent="#f472b6" />
                  ))}
                </div>
              </Collapsible>
              <Collapsible title="Costume (ปีก/หาง/แก้ม)" icon="👗" color="#f472b6" onReset={() => resetSection({ costumeSlots: [...build.costumeSlots.slice(0, 2), emptyCostumeSlot(), emptyCostumeSlot(), emptyCostumeSlot()] })}>
                <div className="space-y-2">
                  {COSTUME_OTHER_LABELS.map((lbl, idx) => {
                    const i = idx + 2; const slot = build.costumeSlots[i] as CostumeSlot;
                    return <SlotRow key={i} label={lbl} pair={slot.statPair} onPairChange={p => updCostumeSlot(i, { ...slot, statPair: p })} cmp={cmp} accent="#f472b6" />;
                  })}
                </div>
              </Collapsible>
              <Collapsible title="Set Bonus Costume" icon="✨" color="#f472b6" onReset={() => resetSection(resetCostumeSetBonus())}>
                <SetBonusBlock bonuses={build.costumeSetBonus} onChange={b => setBuild(s => ({ ...s, costumeSetBonus: b }))} color="#f472b6" cmp={cmp} maxPieces={5} />
              </Collapsible>
              <Collapsible title="Costume ประดับ 4 ชิ้น" icon="💍" color="#fb923c" onReset={() => resetSection(resetCostumeAcc())}>
                <DynamicSlotList pairs={build.costumeAcc} potPairs={build.costumeAccPot ?? []} onChange={ps => setBuild(b => ({ ...b, costumeAcc: ps }))} onPotChange={ps => setBuild(b => ({ ...b, costumeAccPot: ps }))} cmp={cmp} accent="#fb923c" labels={ACC_LABELS} maxSlots={4} />
              </Collapsible>
              <Collapsible title="Set Bonus Costume ประดับ" icon="✨" color="#fb923c" onReset={() => resetSection(resetCostumeAccSetBonus())}>
                <SetBonusBlock bonuses={build.costumeAccSetBonus} onChange={b => setBuild(s => ({ ...s, costumeAccSetBonus: b }))} color="#fb923c" cmp={cmp} maxPieces={4} />
              </Collapsible>
            </>}

            {tab === "heraldry" && <>
              <Collapsible title="Unique Plate" icon="🔒" color="#ffd700" onReset={() => resetSection(resetHeraldryUnique())}>
                <DynamicSlotList pairs={build.heraldryUnique} onChange={ps => setBuild(b => ({ ...b, heraldryUnique: ps }))} cmp={cmp} accent="#ffd700" prefix="U" maxSlots={12} />
              </Collapsible>
              <Collapsible title="Free Plate" icon="🔓" color="#94a3b8" onReset={() => resetSection(resetHeraldryFree())}>
                <DynamicSlotList pairs={build.heraldryFree} onChange={ps => setBuild(b => ({ ...b, heraldryFree: ps }))} cmp={cmp} accent="#94a3b8" prefix="F" maxSlots={6} />
              </Collapsible>
            </>}

            {tab === "card" && (
              <Collapsible title="Card Stats รวม" icon="🃏" color="#38bdf8" onReset={() => resetSection(resetCard())}>
                <PairPanel pair={build.cardStats} onChange={p => setBuild(b => ({ ...b, cardStats: p }))} cmp={cmp} accent="#38bdf8" />
              </Collapsible>
            )}

            {tab === "rune" && (
              <Collapsible title="Rune" icon="💎" color="#34d399" onReset={() => resetSection(resetRunes())}>
                <DynamicSlotList pairs={build.runes} onChange={ps => setBuild(b => ({ ...b, runes: ps }))} cmp={cmp} accent="#34d399" prefix="Rune " maxSlots={8} />
              </Collapsible>
            )}

            {tab === "extra" && <>
              <Collapsible title="Base Class Stats" icon="🧬" color="#22d3ee" onReset={() => setBuild(b => ({ ...b, classBaseStr: "", classBaseAgi: "", classBaseInt: "" }))}>
                <p className="text-xs text-[#555] mb-3">Base stats ของ class จากระดับตัวละคร — บวกก่อนคูณ % stat และก่อนคำนวณ ATK</p>
                <div className="grid grid-cols-3 gap-2">
                  {([["STR", "#ef4444", "classBaseStr"] as const, ["AGI", "#22c55e", "classBaseAgi"] as const, ["INT", "#a78bfa", "classBaseInt"] as const]).map(([label, col, key]) => (
                    <div key={key}>
                      <div className="text-[10px] font-bold mb-1.5" style={{ color: col }}>{label}</div>
                      <input type="text" placeholder="0" value={build[key]}
                        onChange={e => setBuild(b => ({ ...b, [key]: e.target.value }))}
                        className="w-full bg-[#181818] border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none text-[#e0e0e0]"
                        style={{ borderColor: col + "30" }} />
                    </div>
                  ))}
                </div>
              </Collapsible>
              <Collapsible title="Expert Stats" icon="⚡" color="#ffd700" onReset={() => resetSection(resetExpertStats())}>
                <p className="text-xs text-[#555] mb-3">บวกเข้า Attack โดยตรงหลังคำนวณ gear ทั้งหมด (ไม่คูณ %)</p>
                <PairPanel pair={build.expertStats} onChange={p => setBuild(b => ({ ...b, expertStats: p }))} cmp={cmp} accent="#ffd700" />
              </Collapsible>
              <Collapsible title="Costume Collection" icon="👘" color="#a78bfa" onReset={() => resetSection(resetCostumeCollection())}>
                <PairPanel pair={build.costumeCollection} onChange={p => setBuild(b => ({ ...b, costumeCollection: p }))} cmp={cmp} accent="#a78bfa" />
              </Collapsible>
              <Collapsible title="Title" icon="🏅" color="#fbbf24" onReset={() => resetSection(resetTitle())}>
                <PairPanel pair={build.titleStats} onChange={p => setBuild(b => ({ ...b, titleStats: p }))} cmp={cmp} accent="#fbbf24" />
              </Collapsible>
            </>}

          </div>
        </div>

        <div className="w-[320px] flex-shrink-0 sticky top-4">
          <RightPanel build={build} skill={skill} setSkill={setSkill} cmp={cmp} />
        </div>
      </div>
    </div>
  );
}