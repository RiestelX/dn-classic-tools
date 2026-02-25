export const calculateGoldSplit = (g: number, s: number, cp: number, stamps: number, totalMembers: number, nonGuildCount: number) => {
  const totalCopper = (g * 10000) + (s * 100) + cp;
  const stampCost = stamps * 5 * 10000;
  const netPool = totalCopper - stampCost;

  if (netPool < 0) return null;

  const rawShare = netPool / totalMembers;

  const nonGuildTransferAmount = rawShare / 1.003; 
  
  const totalGuildPortion = netPool - (rawShare * nonGuildCount);

  const sellerAndNonGuildShares = rawShare * (1 + nonGuildCount);

  const netGuildDeposit = netPool - sellerAndNonGuildShares;

  const formatCoin = (copperVal: number) => ({
    gold: Math.floor(copperVal / 10000),
    silver: Math.floor((copperVal % 10000) / 100),
    copper: Math.floor(copperVal % 100)
  });

  return {
    guildShare: formatCoin(rawShare),
    nonGuildTransfer: formatCoin(nonGuildTransferAmount),
    mailTransfer: formatCoin(Math.max(0, nonGuildTransferAmount - 20)),
    totalGuildPortion: formatCoin(totalGuildPortion),
    netGuildDeposit: formatCoin(netGuildDeposit)
  };
};

import type {BuildState,SkillConfig,StatRow,Pair,WeaponData,ArmorSlot,CostumeSlot} from './data';
import { FD_TABLE } from './data';

// Number Parser
const g = (v: string | undefined, fb = '0') => {
  if (v !== undefined && v !== null && typeof v === 'string' && v.trim() !== '') {
    const p = parseFloat(v.replace(/,/g, ''));
    if (!isNaN(p)) return p;
  }
  const pFb = parseFloat(typeof fb === 'string' ? fb.replace(/,/g, '') : fb);
  return isNaN(pFb) ? 0 : pFb;
};

// Primitive stat aggregators
export function sumFlat(rows: StatRow[], type: string): number {
  return rows
    .filter(r => r.type === type && !r.isPercent)
    .reduce((a, r) => a + g(r.value), 0);
}

export function sumPct(rows: StatRow[], type: string): number {
  return rows
    .filter(r => r.type === type && r.isPercent)
    .reduce((a, r) => a + g(r.value), 0);
}

// Final Damage % conversion
export function fdToPercent(fdRaw: number, patchLv: number): number {
  const row = FD_TABLE.find(r => r.patch === patchLv) ?? FD_TABLE[FD_TABLE.length - 1];
  if (fdRaw <= 0) return 0;
  const fdAt45 = row.r145 * 45;
  if (fdRaw <= fdAt45) return Math.min(fdRaw / row.r145, 45);
  return Math.min(45 + (fdRaw - fdAt45) / row.r4560, 60);
}

// Row collector
export function getEffRows(pair: Pair, side: 0 | 1): StatRow[] {
  if (side === 0) return pair[0];
  const s1 = pair[1].filter(r => r.type !== '' || r.value !== '');
  return s1.length > 0 ? pair[1] : pair[0];
}

export function collectRows(b: BuildState, side: 0 | 1): StatRow[] {
  const R: StatRow[] = [];
  const push = (pair: Pair) => R.push(...getEffRows(pair, side));
  const pushAll = (pairs: Pair[]) => pairs.forEach(push);

  push(b.weaponMain.statPair);    push(b.weaponMain.enhancedPair);    if(b.weaponMain.potentialPair)push(b.weaponMain.potentialPair);
  push(b.weaponSub.statPair);     push(b.weaponSub.enhancedPair);     if(b.weaponSub.potentialPair)push(b.weaponSub.potentialPair);

  b.armorSlots.forEach((s:ArmorSlot)=>{push(s.statPair);push(s.enhancedPair);if(s.potentialPair)push(s.potentialPair);});

  b.generalSetBonus.forEach(sb => {
    if ((side===0?sb.enabledCur:sb.enabledCmp) && sb.pieces>0) sb.effects.forEach(ef=>push(ef.pair));
  });

  pushAll(b.generalAcc);
  if(b.generalAccPot)pushAll(b.generalAccPot);
  b.generalAccSetBonus.forEach(sb => {
    if ((side===0?sb.enabledCur:sb.enabledCmp) && sb.pieces>0) sb.effects.forEach(ef=>push(ef.pair));
  });

  b.costumeSlots.forEach((s:CostumeSlot)=>{push(s.statPair);if(s.enhancedPair)push(s.enhancedPair);if(s.potentialPair)push(s.potentialPair);});
  b.costumeSetBonus.forEach(sb => {
    if ((side===0?sb.enabledCur:sb.enabledCmp) && sb.pieces>0) sb.effects.forEach(ef=>push(ef.pair));
  });
  pushAll(b.costumeAcc);
  if(b.costumeAccPot)pushAll(b.costumeAccPot);
  b.costumeAccSetBonus.forEach(sb => {
    if ((side===0?sb.enabledCur:sb.enabledCmp) && sb.pieces>0) sb.effects.forEach(ef=>push(ef.pair));
  });

  pushAll(b.heraldryUnique);
  pushAll(b.heraldryFree);
  pushAll(b.runes);
  push(b.cardStats);
  push(b.costumeCollection);
  push(b.titleStats);

  return R;
}

// Damage result shape
export interface DmgResult {
  strFin:  number; agiFin: number; intFin: number
  physAtkMin: number; physAtkMax: number;
  magAtkMin: number; magAtkMax: number;
  firePct: number; icePct: number; lightPct: number; darkPct: number;
  fdPct:   number; fdRaw: number; elemPct: number
  baseMin:  number; baseMax:  number
  elemMin:  number; elemMax:  number
  fdMin:    number; fdMax:    number
  critMin:  number; critMax:  number
}

// Main damage calculator
export function calcDmg(
  b: BuildState,
  sk: SkillConfig,
  side: 0 | 1
): DmgResult {
  const cls  = b.class;
  const rows = collectRows(b, side);
  const expert = getEffRows(b.expertStats, side);

  // 1. Raw primary stats
  const cbStr = g(b.classBaseStr);
  const cbAgi = g(b.classBaseAgi);
  const cbInt = g(b.classBaseInt);
  const strBase = cbStr + sumFlat(rows, 'STR'); const strPctV = sumPct(rows, 'STR');
  const agiBase = cbAgi + sumFlat(rows, 'AGI'); const agiPctV = sumPct(rows, 'AGI');
  const intBase = cbInt + sumFlat(rows, 'INT'); const intPctV = sumPct(rows, 'INT');

  const strF = Math.floor(strBase * (1 + strPctV / 100));
  const agiF = Math.floor(agiBase * (1 + agiPctV / 100));
  const intF = Math.floor(intBase * (1 + intPctV / 100));

  // 2. Class-based base ATK from primary stats
  let basePhys = 0;
  if (['Warrior', 'Cleric', 'Kali', 'Lancea', 'Machina'].includes(cls))
    basePhys = strF * 0.5 + agiF * 0.25;
  else if (['Archer', 'Academic'].includes(cls))
    basePhys = strF * 0.25 + agiF * 0.5;
  else if (cls === 'Sorceress')
    basePhys = strF * 0.25 + agiF * 0.3;

  let baseMag = 0;
  if (cls === 'Sorceress')
    baseMag = intF * 0.75;
  else
    baseMag = intF * 0.5;

  // 3. Flat ATK from gears & buffs
  const flatPhys = sumFlat(rows, 'Physical Attack');
  const flatMag  = sumFlat(rows, 'Magic Attack');
  const expPhys = sumFlat(expert, 'Physical Attack');
  const expMag  = sumFlat(expert, 'Magic Attack');

  // 4. Flat ATK strictly from Weapons (Base + Enhanced Ability)
  const wPhysMinFlat = 
    (side === 0 ? g(b.weaponMain.physMin) : g(b.weaponMain.physMinCmp, b.weaponMain.physMin)) +
    (side === 0 ? g(b.weaponMain.enhPhysMin) : g(b.weaponMain.enhPhysMinCmp, b.weaponMain.enhPhysMin)) +
    (side === 0 ? g(b.weaponSub.physMin) : g(b.weaponSub.physMinCmp, b.weaponSub.physMin)) +
    (side === 0 ? g(b.weaponSub.enhPhysMin) : g(b.weaponSub.enhPhysMinCmp, b.weaponSub.enhPhysMin));

  const wPhysMaxFlat = 
    (side === 0 ? g(b.weaponMain.physMax) : g(b.weaponMain.physMaxCmp, b.weaponMain.physMax)) +
    (side === 0 ? g(b.weaponMain.enhPhysMax) : g(b.weaponMain.enhPhysMaxCmp, b.weaponMain.enhPhysMax)) +
    (side === 0 ? g(b.weaponSub.physMax) : g(b.weaponSub.physMaxCmp, b.weaponSub.physMax)) +
    (side === 0 ? g(b.weaponSub.enhPhysMax) : g(b.weaponSub.enhPhysMaxCmp, b.weaponSub.enhPhysMax));

  const wMagMinFlat = 
    (side === 0 ? g(b.weaponMain.magMin) : g(b.weaponMain.magMinCmp, b.weaponMain.magMin)) +
    (side === 0 ? g(b.weaponMain.enhMagMin) : g(b.weaponMain.enhMagMinCmp, b.weaponMain.enhMagMin)) +
    (side === 0 ? g(b.weaponSub.magMin) : g(b.weaponSub.magMinCmp, b.weaponSub.magMin)) +
    (side === 0 ? g(b.weaponSub.enhMagMin) : g(b.weaponSub.enhMagMinCmp, b.weaponSub.enhMagMin));

  const wMagMaxFlat = 
    (side === 0 ? g(b.weaponMain.magMax) : g(b.weaponMain.magMaxCmp, b.weaponMain.magMax)) +
    (side === 0 ? g(b.weaponMain.enhMagMax) : g(b.weaponMain.enhMagMaxCmp, b.weaponMain.enhMagMax)) +
    (side === 0 ? g(b.weaponSub.magMax) : g(b.weaponSub.magMaxCmp, b.weaponSub.magMax)) +
    (side === 0 ? g(b.weaponSub.enhMagMax) : g(b.weaponSub.enhMagMaxCmp, b.weaponSub.enhMagMax));

  // 5. Total % Multipliers from Weapon Potentials & Costume Weapons
  const potPhysMinPct = 
    (side === 0 ? g(b.weaponMain.potPhysMin) : g(b.weaponMain.potPhysMinCmp, b.weaponMain.potPhysMin)) +
    (side === 0 ? g(b.weaponSub.potPhysMin) : g(b.weaponSub.potPhysMinCmp, b.weaponSub.potPhysMin)) +
    (side === 0 ? g(b.costumeSlots[0].physMin) : g(b.costumeSlots[0].physMinCmp, b.costumeSlots[0].physMin)) +
    (side === 0 ? g(b.costumeSlots[1].physMin) : g(b.costumeSlots[1].physMinCmp, b.costumeSlots[1].physMin));

  const potPhysMaxPct = 
    (side === 0 ? g(b.weaponMain.potPhysMax) : g(b.weaponMain.potPhysMaxCmp, b.weaponMain.potPhysMax)) +
    (side === 0 ? g(b.weaponSub.potPhysMax) : g(b.weaponSub.potPhysMaxCmp, b.weaponSub.potPhysMax)) +
    (side === 0 ? g(b.costumeSlots[0].physMax) : g(b.costumeSlots[0].physMaxCmp, b.costumeSlots[0].physMax)) +
    (side === 0 ? g(b.costumeSlots[1].physMax) : g(b.costumeSlots[1].physMaxCmp, b.costumeSlots[1].physMax));

  const potMagMinPct = 
    (side === 0 ? g(b.weaponMain.potMagMin) : g(b.weaponMain.potMagMinCmp, b.weaponMain.potMagMin)) +
    (side === 0 ? g(b.weaponSub.potMagMin) : g(b.weaponSub.potMagMinCmp, b.weaponSub.potMagMin)) +
    (side === 0 ? g(b.costumeSlots[0].magMin) : g(b.costumeSlots[0].magMinCmp, b.costumeSlots[0].magMin)) +
    (side === 0 ? g(b.costumeSlots[1].magMin) : g(b.costumeSlots[1].magMinCmp, b.costumeSlots[1].magMin));

  const potMagMaxPct = 
    (side === 0 ? g(b.weaponMain.potMagMax) : g(b.weaponMain.potMagMaxCmp, b.weaponMain.potMagMax)) +
    (side === 0 ? g(b.weaponSub.potMagMax) : g(b.weaponSub.potMagMaxCmp, b.weaponSub.potMagMax)) +
    (side === 0 ? g(b.costumeSlots[0].magMax) : g(b.costumeSlots[0].magMaxCmp, b.costumeSlots[0].magMax)) +
    (side === 0 ? g(b.costumeSlots[1].magMax) : g(b.costumeSlots[1].magMaxCmp, b.costumeSlots[1].magMax));

  // 6. Final aggregated % (Gear % + Weapon %)
  const physPctVMin = sumPct(rows, 'Physical Attack') + potPhysMinPct;
  const physPctVMax = sumPct(rows, 'Physical Attack') + potPhysMaxPct;
  const magPctVMin  = sumPct(rows, 'Magic Attack') + potMagMinPct;
  const magPctVMax  = sumPct(rows, 'Magic Attack') + potMagMaxPct;
  

  // 7. Calculate overall ATK Boundaries
  const physMinFinal = Math.floor((basePhys + flatPhys + wPhysMinFlat) * Number((1 + physPctVMin / 100).toFixed(3))) + expPhys;
  const physMaxFinal = Math.floor((basePhys + flatPhys + wPhysMaxFlat) * Number((1 + physPctVMax / 100).toFixed(3))) + expPhys;
  const magMinFinal  = Math.floor((baseMag  + flatMag  + wMagMinFlat)  * Number((1 + magPctVMin  / 100).toFixed(3))) + expMag;
  const magMaxFinal  = Math.floor((baseMag  + flatMag  + wMagMaxFlat)  * Number((1 + magPctVMax  / 100).toFixed(3))) + expMag;

  // 8. Choose ATK value based on skill type
  const atkMin = sk.skillType === 'phys' ? physMinFinal : magMinFinal;
  const atkMax = sk.skillType === 'phys' ? physMaxFinal : magMaxFinal;

  // 9. Element bonus calculations
  const firePct = sumPct(rows, 'Fire Attack') + sumPct(expert, 'Fire Attack');
  const icePct = sumPct(rows, 'Ice Attack') + sumPct(expert, 'Ice Attack');
  const lightPct = sumPct(rows, 'Light Attack') + sumPct(expert, 'Light Attack');
  const darkPct = sumPct(rows, 'Dark Attack') + sumPct(expert, 'Dark Attack');

  const elemKey =
    sk.skillElement === 'fire'  ? 'Fire Attack'  :
    sk.skillElement === 'ice'   ? 'Ice Attack'   :
    sk.skillElement === 'light' ? 'Light Attack' :
    sk.skillElement === 'dark'  ? 'Dark Attack'  : null;

  const elemPctVal = elemKey ? sumPct(rows, elemKey) + sumPct(expert, elemKey) : 0;
  const targetRes = g(sk.targetRes);
  const debuff    = g(sk.debuffSum) / 100;

  // 10. Final Damage %
  const fdRaw =
    sumFlat(rows, 'Final Damage') + sumPct(rows, 'Final Damage') +
    sumFlat(expert, 'Final Damage') + sumPct(expert, 'Final Damage');
  const fdPct = Math.round(Math.min(fdToPercent(fdRaw, sk.patchLv), 60));

  // 11. Skill multipliers
  const skillPct   = g(sk.skillPct, '100') / 100;
  const fixedValue = g(sk.fixedValue);

  // 12. Damage chain
  const fl2 = Math.floor;
  const baseMin = fl2(atkMin * skillPct + fixedValue);
  const baseMax = fl2(atkMax * skillPct + fixedValue);

  const elemMult = (1 + elemPctVal / 100 - targetRes / 100) * (1 + debuff);
  const elemMin  = fl2(baseMin * elemMult);
  const elemMax  = fl2(baseMax * elemMult);

  const fdMult = 1 + fdPct / 100;
  const fdMin  = fl2(elemMin * fdMult);
  const fdMax  = fl2(elemMax * fdMult);

  const fl = Math.floor;
  return {
    strFin:  fl(strF), agiFin:  fl(agiF), intFin:  fl(intF),
    physAtkMin: fl(physMinFinal), physAtkMax: fl(physMaxFinal),
    magAtkMin:  fl(magMinFinal),  magAtkMax:  fl(magMaxFinal),
    firePct: fl(firePct * 10) / 10, icePct: fl(icePct * 10) / 10,
    lightPct: fl(lightPct * 10) / 10, darkPct: fl(darkPct * 10) / 10,
    fdPct:   fdPct, fdRaw: fl(fdRaw),
    elemPct: fl(elemPctVal * 10) / 10,
    baseMin: fl(baseMin), baseMax: fl(baseMax),
    elemMin: fl(elemMin), elemMax: fl(elemMax),
    fdMin:   fl(fdMin),   fdMax:   fl(fdMax),
    critMin: fl(fdMin * 2), critMax: fl(fdMax * 2),
  };
}