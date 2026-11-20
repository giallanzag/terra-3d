/** Formatta una data (Ma fa) in italiano. */
export function formattaMa(ma: number): string {
  if (ma <= 0.0005) return 'Oggi';
  if (ma >= 1000) return `${(ma / 1000).toLocaleString('it-IT', { maximumFractionDigits: 3 })} miliardi di anni fa`;
  if (ma >= 1) return `${ma.toLocaleString('it-IT', { maximumFractionDigits: ma < 10 ? 2 : 0 })} milioni di anni fa`;
  return `${Math.round(ma * 1e6).toLocaleString('it-IT')} anni fa`;
}
