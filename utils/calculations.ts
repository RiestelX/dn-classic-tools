export const calculateGoldSplit = (g: number, s: number, cp: number, stamps: number, members: number) => {
  const totalCopper = (g * 10000) + (s * 100) + cp;
  const netPool = totalCopper - (stamps * 5 * 10000);

  if (netPool < 0) return null;

  const transferCount = members - 1;
  const share = netPool / (members + (transferCount * 0.003));

  return {
    gold: Math.floor(share / 10000),
    silver: Math.floor((share % 10000) / 100),
    copper: Math.floor(share % 100)
  };
};