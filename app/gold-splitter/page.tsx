'use client';
import { useState } from 'react';
import { calculateGoldSplit } from '@/utils/calculations';

export default function GoldSplitter() {
    const [inputs, setInputs] = useState({ gold: '', silver: '', copper: '', stamps: '', members: '8' });
    const [result, setResult] = useState<{ guildShare: any, nonGuildTransfer: any, mailTransfer: any } | null>(null);

    const performCalculation = () => {
        const res = calculateGoldSplit(
            Number(inputs.gold) || 0,
            Number(inputs.silver) || 0,
            Number(inputs.copper) || 0,
            Number(inputs.stamps) || 0,
            Number(inputs.members) || 1
        );

        if (res === null) {
            alert("ยอดขายไม่พอจ่ายค่าสแตมป์!");
            return;
        }
        setResult(res);
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'silver' || field === 'copper') {
            const cleanValue = value.replace(/\D/g, '');
            if (cleanValue.length <= 2) {
                setInputs(prev => ({ ...prev, [field]: cleanValue }));
            }
        } else {
            setInputs(prev => ({ ...prev, [field]: value }));
        }
    };

    return (
        <div className="container mx-auto w-[95%] max-w-[550px] mt-2 p-8 bg-[#252525] rounded-[24px] shadow-2xl font-kanit">
            <h2 className="text-[#ffd700] text-2xl font-semibold text-center mb-8">
                <i className="fas fa-coins mr-2"></i> หารเงินเรด
            </h2>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    performCalculation();
                }}
                className="space-y-3"
            >
                <div>
                    <label className="text-sm font-light text-[#bbb] mb-2 block">
                        <i className="fas fa-shopping-cart mr-1"></i> ราคาขายรวม (Gold | Silver | Copper)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <input type="number" placeholder="0" className="coin-input" value={inputs.gold} onChange={e => handleInputChange('gold', e.target.value)} />
                        <input type="number" placeholder="0" className="coin-input" value={inputs.silver} onChange={e => handleInputChange('silver', e.target.value)} />
                        <input type="number" placeholder="0" className="coin-input" value={inputs.copper} onChange={e => handleInputChange('copper', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-light text-[#bbb] mb-2 block">
                            <i className="fas fa-ticket-alt mr-1"></i> สแตมป์ (5 Gold)
                        </label>
                        <input type="number" placeholder="0" className="coin-input" value={inputs.stamps} onChange={e => handleInputChange('stamps', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-light text-[#bbb] mb-2 block">
                            <i className="fas fa-users mr-1"></i> สมาชิกทั้งหมด
                        </label>
                        <input
                            type="number"
                            className="coin-input"
                            value={inputs.members}
                            onChange={e => handleInputChange('members', e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">

                </div>

                <button
                    type="submit"
                    className="w-full py-4 bg-[#ffd700] text-black font-semibold rounded-xl text-lg hover:scale-[0.98] transition-transform shadow-lg shadow-yellow-500/10"
                >
                    คำนวณเงิน
                </button>
            </form>

            {result && (
                <div className="mt-6 space-y-4">
                    <div className="p-4 bg-[#1a1a1a] rounded-2xl border-l-4 border-green-500">
                        <div className="flex justify-between items-center mb-2">
                            <small className="text-green-500 font-medium">ผ่านคลังกิลด์ (ได้เต็ม):</small>
                            <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded">Fee 0%</span>
                        </div>
                        <div className="flex gap-3 text-lg font-semibold">
                            <span className="text-[#ffcc00]">{result.guildShare.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                            <span className="text-[#e0e0e0]">{result.guildShare.silver}<CoinUnit type="silver" /></span>
                            <span className="text-[#ff9966]">{result.guildShare.copper}<CoinUnit type="copper" /></span>
                        </div>
                    </div>

                    <div className="p-4 bg-[#1a1a1a] rounded-2xl border-l-4 border-orange-500">
                        <div className="flex justify-between items-center mb-2">
                            <small className="text-orange-500 font-medium">เทรดปกติ (หักค่าธรรมเนียม):</small>
                            <span className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">Fee 0.3%</span>
                        </div>
                        <div className="flex gap-3 text-lg font-semibold">
                            <span className="text-[#ffcc00]">{result.nonGuildTransfer.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                            <span className="text-[#e0e0e0]">{result.nonGuildTransfer.silver}<CoinUnit type="silver" /></span>
                            <span className="text-[#ff9966]">{result.nonGuildTransfer.copper}<CoinUnit type="copper" /></span>
                        </div>
                    </div>

                    <div className="p-4 bg-[#1a1a1a] rounded-2xl border-l-4 border-blue-400">
                        <div className="flex justify-between items-center mb-2">
                            <small className="text-blue-400 font-medium">ส่งจดหมาย (หักค่าธรรมเนียม + 20 C):</small>
                            <span className="text-[10px] bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded">Fee 0.3% + 20 C</span>
                        </div>
                        <div className="flex gap-3 text-lg font-semibold">
                            <span className="text-[#ffcc00]">{result.mailTransfer.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                            <span className="text-[#e0e0e0]">{result.mailTransfer.silver}<CoinUnit type="silver" /></span>
                            <span className="text-[#ff9966]">{result.mailTransfer.copper}<CoinUnit type="copper" /></span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-[0.75rem] text-blue-300 leading-relaxed text-center">
                            <i className="fas fa-info-circle mr-1"></i>
                            ระบบคำนวณแบบ <b>"คนเทรดไม่เข้าเนื้อ"</b> <br />
                            คนที่ไม่ได้เทรดผ่านคลังกิลด์จะได้รับยอดที่หัก 0.3% ออกไปแล้ว ถ้าส่งจดหมายหักอีก 20 C
                        </p>
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