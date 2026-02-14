export const calculateGoldSplit = (g: number, s: number, cp: number, stamps: number, totalMembers: number) => {
  const totalCopper = (g * 10000) + (s * 100) + cp;
  const netPool = totalCopper - (stamps * 5 * 10000);

  if (netPool < 0) return null;

  const rawShare = netPool / totalMembers;
  const nonGuildTransferAmount = rawShare / 1.003;

  const formatCoin = (copperVal: number) => ({
    gold: Math.floor(copperVal / 10000),
    silver: Math.floor((copperVal % 10000) / 100),
    copper: Math.floor(copperVal % 100)
  });

  return {
    guildShare: formatCoin(rawShare),
    nonGuildTransfer: formatCoin(nonGuildTransferAmount)
  };
};