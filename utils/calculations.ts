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