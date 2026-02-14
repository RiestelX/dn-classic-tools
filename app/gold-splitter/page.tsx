'use client';
import { useState } from 'react';
import { calculateGoldSplit } from '@/utils/calculations';

export default function GoldSplitter() {
  const [inputs, setInputs] = useState({ gold: '', silver: '', copper: '', stamps: '', members: '8' });
  const [result, setResult] = useState<{gold: number, silver: number, copper: number} | null>(null);

  const performCalculation = () => {
    const res = calculateGoldSplit(
      Number(inputs.gold) || 0, 
      Number(inputs.silver) || 0, 
      Number(inputs.copper) || 0, 
      Number(inputs.stamps) || 0, 
      Number(inputs.members) || 1
    );
    
    if (res === null) {
      alert("ยอดขายไม่พอจ่ายค่า Stamp!");
      return;
    }
    setResult(res);
  };

  return (
    <div className="container mx-auto w-[95%] max-w-[550px] mt-8 p-8 bg-[#252525] rounded-[24px] shadow-2xl font-kanit">
      <h2 className="text-[#ffd700] text-2xl font-semibold text-center mb-8">
        <i className="fas fa-coins mr-2"></i> หารเงินเรด
      </h2>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          performCalculation();
        }} 
        className="space-y-5"
      >
        <div>
          <label className="text-sm font-light text-[#bbb] mb-2 block">
            <i className="fas fa-shopping-cart mr-1"></i> ราคาขายรวม (Gold | Silver | Copper)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="0" className="coin-input" value={inputs.gold} onChange={e => setInputs({...inputs, gold: e.target.value})} />
            <input type="number" placeholder="0" className="coin-input" value={inputs.silver} onChange={e => setInputs({...inputs, silver: e.target.value})} />
            <input type="number" placeholder="0" className="coin-input" value={inputs.copper} onChange={e => setInputs({...inputs, copper: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-light text-[#bbb] mb-2 block">
              <i className="fas fa-ticket-alt mr-1"></i> สแตมป์ (5 Gold)
            </label>
            <input type="number" placeholder="0" className="coin-input" value={inputs.stamps} onChange={e => setInputs({...inputs, stamps: e.target.value})} />
          </div>
          <div>
            <label className="text-sm font-light text-[#bbb] mb-2 block">
              <i className="fas fa-users mr-1"></i> สมาชิก (คน)
            </label>
            <input type="number" className="coin-input" value={inputs.members} onChange={e => setInputs({...inputs, members: e.target.value})} />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-4 bg-[#ffd700] text-black font-semibold rounded-xl text-lg hover:scale-[0.98] transition-transform shadow-lg shadow-yellow-500/10"
        >
          คำนวณเงิน
        </button>
      </form>

      {result && (
        <div className="mt-6 p-5 bg-[#1a1a1a] rounded-2xl text-center animate-in fade-in slide-in-from-bottom-2">
          <small className="text-[#aaa]">ยอดที่ต้องกดเทรดให้เพื่อนแต่ละคน:</small>
          <div className="flex justify-center gap-4 mt-3 text-xl font-semibold">
            <span className="text-[#ffcc00]">{result.gold.toLocaleString()}<CoinUnit type="gold" /></span>
            <span className="text-[#e0e0e0]">{result.silver}<CoinUnit type="silver" /></span>
            <span className="text-[#ff9966]">{result.copper}<CoinUnit type="copper" /></span>
          </div>
          <div className="mt-4 text-[0.75rem] text-[#777] font-light leading-relaxed">
            คำนวณภาษีเทรด 0.3% เรียบร้อยแล้ว <br/>คนขายได้ส่วนแบ่งเท่าเพื่อน ไม่เข้าเนื้อแน่นอน
          </div>
        </div>
      )}
    </div>
  );
}

const CoinUnit = ({ type }: { type: 'gold' | 'silver' | 'copper' }) => {
  const styles = {
    gold: "from-[#fbc02d] to-[#ffeb3b] shadow-[#ffcc00]",
    silver: "from-[#9e9e9e] to-[#f5f5f5] shadow-[#e0e0e0]",
    copper: "from-[#d84315] to-[#ffab91] shadow-[#ff9966]"
  };

  return (
    <span 
      className={`
        inline-block 
        w-[16px] h-[16px] 
        rounded-full 
        ml-1.5 
        bg-gradient-to-tr 
        shadow-[0_0_5px]
        -translate-y-[1px] 
        align-middle
        ${styles[type]}
      `} 
    />
  );
};