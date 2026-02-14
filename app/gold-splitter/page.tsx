'use client';
import { useState } from 'react';
import { calculateGoldSplit } from '@/utils/calculations';

export default function GoldSplitter() {
    const [inputs, setInputs] = useState({ gold: '', silver: '', copper: '', stamps: '', members: '8', nonGuild: '0' });
    const [result, setResult] = useState<{ guildShare: any, nonGuildTransfer: any, mailTransfer: any, totalGuildPortion: any, netGuildDeposit: any } | null>(null);

    const performCalculation = () => {
        const res = calculateGoldSplit(
            Number(inputs.gold) || 0,
            Number(inputs.silver) || 0,
            Number(inputs.copper) || 0,
            Number(inputs.stamps) || 0,
            Number(inputs.members) || 1,
            Number(inputs.nonGuild) || 0
        );

        if (res === null) {
            alert("เงินไม่พอออออออออ");
            return;
        }
        setResult(res);
    };

    const handleReset = () => {
        setInputs({ gold: '', silver: '', copper: '', stamps: '', members: '8', nonGuild: '0' });
        setResult(null);
    };

    const handleInputChange = (field: string, value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        if (field === 'silver' || field === 'copper') {
            if (cleanValue.length <= 2) {
                setInputs(prev => ({ ...prev, [field]: cleanValue }));
            }
        } else {
            setInputs(prev => ({ ...prev, [field]: cleanValue }));
        }
    };

    const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
        e.preventDefault();
    }
    };

    return (
        <div className="container mx-auto w-[95%] max-w-[550px] mt-2 mb-4 p-8 bg-[#252525] rounded-[24px] shadow-2xl font-kanit">
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
                        <input type="number" placeholder="0" className="coin-input" value={inputs.gold} onChange={e => handleInputChange('gold', e.target.value)} onKeyDown={blockInvalidChar} />
                        <input type="number" placeholder="0" className="coin-input" value={inputs.silver} onChange={e => handleInputChange('silver', e.target.value)} onKeyDown={blockInvalidChar} />
                        <input type="number" placeholder="0" className="coin-input" value={inputs.copper} onChange={e => handleInputChange('copper', e.target.value)} onKeyDown={blockInvalidChar}/>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-light text-[#bbb] mb-2 block">
                            <i className="fas fa-ticket-alt mr-1"></i> สแตมป์ (5 Gold)
                        </label>
                        <input type="number" placeholder="0" className="coin-input" value={inputs.stamps} onChange={e => handleInputChange('stamps', e.target.value)} onKeyDown={blockInvalidChar}/>
                    </div>
                    <div>
                        <label className="text-sm font-light text-[#bbb] mb-2 block">
                            <i className="fas fa-users mr-1"></i> สมาชิกทั้งหมด (คน)
                        </label>
                        <input type="number" className="coin-input" value={inputs.members} onChange={e => handleInputChange('members', e.target.value)} onKeyDown={blockInvalidChar}/>
                    </div>
                    <div>
                        <label className="text-sm font-light text-[#ffb347] mb-2 block">
                            <i className="fas fa-user-minus mr-1"></i> ไม่ผ่านคลังกิลด์ (คน)
                        </label>
                        <input type="number" placeholder="0" className="coin-input border-orange-500/30" value={inputs.nonGuild} onChange={e => handleInputChange('nonGuild', e.target.value)} onKeyDown={blockInvalidChar}/>
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-4 bg-[#631c1c] text-[#ff8888] font-semibold rounded-xl text-lg hover:bg-[#852525] transition-colors shadow-lg border border-[#ff0000]/10"
                        title="ล้างค่าทั้งหมด"
                    >
                        <i className="fas fa-undo"></i>
                    </button>

                    <button
                        type="submit"
                        className="flex-1 py-4 bg-[#ffd700] text-black font-semibold rounded-xl text-lg hover:scale-[0.98] transition-transform shadow-lg shadow-yellow-500/10"
                    >
                        คำนวณเงิน
                    </button>
                </div>
            </form>

            {result && (
                <div className="mt-4 space-y-4">
                    <div className="p-5 bg-[#ffd700]/10 rounded-2xl border-2 border-[#ffd700] animate-pulse-slow">
                        <div className="flex justify-between items-center mb-0">
                            <small className="text-[#ffd700] font-bold text-lg">ยอดที่ต้องฝากเข้าคลังกิลด์:</small>
                            <span className="text-[10px] bg-[#ffd700] text-black px-2 py-0.5 rounded font-bold">NET DEPOSIT</span>
                        </div>
                        <p className="text-[11px] text-[#ffd700]/70 mt-0">
                            * รวมเงินคนในกิลด์ทุกคน + เงินคนขาย + เศษที่เหลือจากการหารแล้ว
                        </p>
                        <div className="flex gap-3 text-2xl font-bold">
                            <span className="text-[#ffcc00]">{result.totalGuildPortion.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                            <span className="text-[#e0e0e0]">{result.totalGuildPortion.silver}<CoinUnit type="silver" /></span>
                            <span className="text-[#ff9966]">{result.totalGuildPortion.copper}<CoinUnit type="copper" /></span>
                        </div>

                        <div className="flex justify-between items-center mb-1 mt-4">
                            <small className="text-green-400 font-bold">ฝากเฉพาะส่วนของเพื่อน (หักส่วนตัวออกแล้ว)</small>
                            <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-bold">แนะนำ</span>
                        </div>
                        <div className="flex gap-3 text-2xl font-bold">
                            <span className="text-[#ffcc00]">{result.netGuildDeposit.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                            <span className="text-[#e0e0e0]">{result.netGuildDeposit.silver}<CoinUnit type="silver" /></span>
                            <span className="text-[#ff9966]">{result.netGuildDeposit.copper}<CoinUnit type="copper" /></span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-500/20">
                            <p className="text-xs text-green-300">
                                <i className="fas fa-hand-holding-usd mr-1"></i>
                                <b>คนขายเก็บเงินส่วนตัวไว้:</b> {result.guildShare.gold.toLocaleString()}G {result.guildShare.silver}S {result.guildShare.copper}C
                            </p>
                        </div>
                    </div>
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

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col p-4 bg-[#1a1a1a] rounded-2xl border-l-4 border-orange-500 h-full">
                            <div className="flex justify-between items-start mb-2 h-8">
                                <small className="text-orange-500 text-[11px] font-medium leading-tight">เทรดปกติ<br />(หักค่าธรรมเนียม):</small>
                                <span className="text-[9px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded h-fit">0.3%</span>
                            </div>
                            <div className="mt-auto flex flex-wrap gap-2 text-[15px] font-semibold">
                                <span className="text-[#ffcc00] flex items-center">{result.nonGuildTransfer.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                                <span className="text-[#e0e0e0] flex items-center">{result.nonGuildTransfer.silver}<CoinUnit type="silver" /></span>
                                <span className="text-[#ff9966] flex items-center">{result.nonGuildTransfer.copper}<CoinUnit type="copper" /></span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col p-4 bg-[#1a1a1a] rounded-2xl border-l-4 border-blue-400 h-full">
                            <div className="flex justify-between items-start mb-2 h-8">
                                <small className="text-blue-400 text-[11px] font-medium leading-tight">ส่งจดหมาย<br />(Fee + 20 C):</small>
                                <span className="text-[9px] bg-blue-400/20 text-blue-400 px-1.5 py-0.5 rounded h-fit">0.3%+20C</span>
                            </div>
                            <div className="mt-auto flex flex-wrap gap-2 text-[15px] font-semibold">
                                <span className="text-[#ffcc00] flex items-center">{result.mailTransfer.gold.toLocaleString()}<CoinUnit type="gold" /></span>
                                <span className="text-[#e0e0e0] flex items-center">{result.mailTransfer.silver}<CoinUnit type="silver" /></span>
                                <span className="text-[#ff9966] flex items-center">{result.mailTransfer.copper}<CoinUnit type="copper" /></span>
                            </div>
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