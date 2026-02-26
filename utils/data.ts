// Stat metadata
export const STAT_TYPES = [
  'STR', 'AGI', 'INT',
  'Physical Attack', 'Magic Attack',
  'Fire Attack', 'Ice Attack', 'Light Attack', 'Dark Attack',
  'Final Damage',
] as const;

export const STAT_COLORS: Record<string,string> = {
  STR:'#ef4444', AGI:'#22c55e', INT:'#a78bfa',
  'Physical Attack':'#fb923c', 'Magic Attack':'#38bdf8',
  'Fire Attack':'#f97316', 'Ice Attack':'#67e8f9',
  'Light Attack':'#fde047', 'Dark Attack':'#c084fc',
  'Final Damage':'#ffd700',
};

export const FD_TABLE = [
  {patch:32,  fd60:1387,  r145:17.6,  r4560:39.7},
  {patch:40,  fd60:1943,  r145:24.7,  r4560:55.5},
  {patch:50,  fd60:2718,  r145:34.5,  r4560:77.7},
  {patch:60,  fd60:3805,  r145:48.3,  r4560:108.8},
  {patch:70,  fd60:5327,  r145:67.6,  r4560:152.3},
  {patch:80,  fd60:7458,  r145:94.7,  r4560:213.2},
  {patch:90,  fd60:10441, r145:132.5, r4560:298.5},
  {patch:100, fd60:14617, r145:185.5, r4560:417.9},
] as const;

// export type ClassType = 'Warrior'|'Archer'|'Sorceress'|'Cleric'|'Academic'|'Kali'|'Lancea'|'Machina';
export type ClassType = 'Warrior'|'Archer'|'Sorceress'|'Cleric'|'Academic';
export const CLASS_INFO: Record<ClassType,{color:string;stats:string[];icon:string;physW:{str:number;agi:number};magW:{int:number}}> = {
  Warrior:   {color:'#ef4444',stats:['STR','AGI'],icon:'/images/Warrior_Class_Icon.png', physW:{str:0.5,agi:0.25}, magW:{int:0.5}},
  Archer:    {color:'#22c55e',stats:['AGI'],       icon:'/images/Archer_Class_Icon.png', physW:{str:0.25,agi:0.5}, magW:{int:0.5}},
  Sorceress: {color:'#a78bfa',stats:['INT'],        icon:'/images/Sorceress_Class_Icon.png', physW:{str:0.25,agi:0.3}, magW:{int:0.75}},
  Cleric:    {color:'#3b82f6',stats:['INT'],        icon:'/images/Cleric_Class_Icon.png', physW:{str:0.5,agi:0.25}, magW:{int:0.5}},
  Academic:  {color:'#f59e0b',stats:['INT','AGI'], icon:'/images/Academic_Class_Icon.png', physW:{str:0.25,agi:0.5}, magW:{int:0.5}},
//   Kali:      {color:'#f472b6',stats:['AGI','INT'], icon:'🗡️', physW:{str:0.5,agi:0.25}, magW:{int:0.5}},
//   Lancea:    {color:'#fb923c',stats:['STR','AGI'], icon:'🔱', physW:{str:0.5,agi:0.25}, magW:{int:0.5}},
//   Machina:   {color:'#94a3b8',stats:['STR','INT'], icon:'⚙️', physW:{str:0.5,agi:0.25}, magW:{int:0.5}},
};
export const ARMOR_LABELS   = ['หมวก','ส่วนบน','ส่วนล่าง','ถุงมือ','รองเท้า'] as const;
export const COSTUME_LABELS = ['อาวุธหลัก','อาวุธรอง','ปีก','หาง','แก้ม'] as const;
export const ELEM_COLORS: Record<string,string> = {
  none:'#555', fire:'#f97316', ice:'#67e8f9', light:'#fde047', dark:'#c084fc',
};

// Types
export interface StatRow {id:string; type:string; value:string; isPercent:boolean}
export type Pair = [StatRow[], StatRow[]]
export interface SetBonusEffect {id:string; pair:Pair}
export interface SetBonusEntry {pieces:number; effects:SetBonusEffect[]; enabledCur:boolean; enabledCmp:boolean}
export interface ArmorSlot {statPair:Pair; enhancedPair:Pair; potentialPair:Pair}
export interface CostumeSlot {physMin:string;physMax:string;magMin:string;magMax:string;physMinCmp:string;physMaxCmp:string;magMinCmp:string;magMaxCmp:string;statPair:Pair;enhancedPair?:Pair;potentialPair?:Pair;enhPhysMin?:string;enhPhysMax?:string;enhMagMin?:string;enhMagMax?:string;enhPhysMinCmp?:string;enhPhysMaxCmp?:string;enhMagMinCmp?:string;enhMagMaxCmp?:string;potPhysMin?:string;potPhysMax?:string;potMagMin?:string;potMagMax?:string;potPhysMinCmp?:string;potPhysMaxCmp?:string;potMagMinCmp?:string;potMagMaxCmp?:string}
export interface WeaponData {
  physMin:string; physMax:string; magMin:string; magMax:string;
  physMinCmp:string; physMaxCmp:string; magMinCmp:string; magMaxCmp:string;
  statPair:Pair; enhancedPair:Pair; potentialPair:Pair;
  enhPhysMin:string; enhPhysMax:string; enhMagMin:string; enhMagMax:string;
  enhPhysMinCmp:string; enhPhysMaxCmp:string; enhMagMinCmp:string; enhMagMaxCmp:string;
  potPhysMin:string; potPhysMax:string; potMagMin:string; potMagMax:string;
  potPhysMinCmp:string; potPhysMaxCmp:string; potMagMinCmp:string; potMagMaxCmp:string;
}
export interface BuildState {
  class:ClassType; weaponMain:WeaponData; weaponSub:WeaponData;
  armorSlots:ArmorSlot[]; generalSetBonus:SetBonusEntry[];
  generalAcc:Pair[]; generalAccPot:Pair[]; generalAccSetBonus:SetBonusEntry[];
  costumeSlots:CostumeSlot[]; costumeSetBonus:SetBonusEntry[];
  costumeAcc:Pair[]; costumeAccPot:Pair[]; costumeAccSetBonus:SetBonusEntry[];
  heraldryUnique:Pair[]; heraldryFree:Pair[]; runes:Pair[];
  cardStats:Pair; costumeCollection:Pair; titleStats:Pair; expertStats:Pair;
  classBaseStr:string; classBaseAgi:string; classBaseInt:string;
}
export interface SkillConfig {
  skillPct:string; fixedValue:string;
  skillType:'phys'|'magic'; skillElement:'none'|'fire'|'ice'|'light'|'dark';
  patchLv:number; targetRes:string; debuffSum:string;
}

// Factories
export const uid       = () => Math.random().toString(36).slice(2,8);
export const emptyRow  = (): StatRow => ({id:uid(), type:'', value:'', isPercent:false});
export const emptyPair = (): Pair    => [[emptyRow()],[emptyRow()]];
export const emptyEffect = (): SetBonusEffect => ({id:uid(), pair:emptyPair()});
export const makeSB = (ns:number[]): SetBonusEntry[] =>
  ns.map(p => ({pieces:p, effects:[emptyEffect()], enabledCur:false, enabledCmp:false}));
export const emptySBEntry = (pieces:number): SetBonusEntry => ({pieces, effects:[emptyEffect()], enabledCur:false, enabledCmp:false});
export const emptySetBonus = (): SetBonusEntry[] => [];
export const emptyArmorSlot = (): ArmorSlot => ({statPair:emptyPair(), enhancedPair:emptyPair(), potentialPair:emptyPair()});
export const emptyWeapon = (): WeaponData => ({
  physMin:'', physMax:'', magMin:'', magMax:'',
  physMinCmp:'', physMaxCmp:'', magMinCmp:'', magMaxCmp:'',
  statPair:emptyPair(), enhancedPair:emptyPair(), potentialPair:emptyPair(),
  enhPhysMin:'', enhPhysMax:'', enhMagMin:'', enhMagMax:'',
  enhPhysMinCmp:'', enhPhysMaxCmp:'', enhMagMinCmp:'', enhMagMaxCmp:'',
  potPhysMin:'', potPhysMax:'', potMagMin:'', potMagMax:'',
  potPhysMinCmp:'', potPhysMaxCmp:'', potMagMinCmp:'', potMagMaxCmp:'',
});
export const emptyCostumeSlot = (): CostumeSlot => ({physMin:'',physMax:'',magMin:'',magMax:'',physMinCmp:'',physMaxCmp:'',magMinCmp:'',magMaxCmp:'',statPair:emptyPair()});
export const defaultBuild = (): BuildState => ({
  class:'Warrior',
  weaponMain:emptyWeapon(), weaponSub:emptyWeapon(),
  armorSlots: Array(5).fill(null).map(emptyArmorSlot),
  generalSetBonus:    [],
  generalAcc:         Array(4).fill(null).map(emptyPair),
  generalAccPot:      Array(4).fill(null).map(emptyPair),
  generalAccSetBonus: [],
  costumeSlots:       Array(5).fill(null).map(emptyCostumeSlot),
  costumeSetBonus:    [],
  costumeAcc:         Array(4).fill(null).map(emptyPair),
  costumeAccPot:      Array(4).fill(null).map(emptyPair),
  costumeAccSetBonus: [],
  heraldryUnique: [emptyPair()],
  heraldryFree:   [emptyPair()],
  runes:          [emptyPair()],
  cardStats:emptyPair(), costumeCollection:emptyPair(),
  titleStats:emptyPair(), expertStats:emptyPair(),
  classBaseStr:'', classBaseAgi:'', classBaseInt:'',
});
export const defaultSkill = (): SkillConfig => ({
  skillPct:'100', fixedValue:'0',
  skillType:'magic', skillElement:'none',
  patchLv:50, targetRes:'0', debuffSum:'0',
});

// Section resets
export const resetWeapons            = () => ({weaponMain:emptyWeapon(), weaponSub:emptyWeapon()});
export const resetArmor              = () => ({armorSlots:Array(5).fill(null).map(emptyArmorSlot)});
export const resetGeneralSetBonus    = () => ({generalSetBonus:[]});
export const resetGeneralAcc         = () => ({generalAcc:Array(4).fill(null).map(emptyPair),generalAccPot:Array(4).fill(null).map(emptyPair)});
export const resetGeneralAccSetBonus = () => ({generalAccSetBonus:[]});
export const resetCostume = () => ({costumeSlots:Array(5).fill(null).map(emptyCostumeSlot)});
export const resetCostumeSetBonus    = () => ({costumeSetBonus:[]});
export const resetCostumeAcc         = () => ({costumeAcc:Array(4).fill(null).map(emptyPair),costumeAccPot:Array(4).fill(null).map(emptyPair)});
export const resetCostumeAccSetBonus = () => ({costumeAccSetBonus:[]});
export const resetHeraldryUnique     = () => ({heraldryUnique:[emptyPair()]});
export const resetHeraldryFree       = () => ({heraldryFree:[emptyPair()]});
export const resetRunes              = () => ({runes:[emptyPair()]});
export const resetCard               = () => ({cardStats:emptyPair()});
export const resetExpertStats        = () => ({expertStats:emptyPair()});
export const resetCostumeCollection  = () => ({costumeCollection:emptyPair()});
export const resetTitle              = () => ({titleStats:emptyPair()});