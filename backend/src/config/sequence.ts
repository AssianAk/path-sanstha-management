export function generateTransactionReference(businessDate: string = '2026-09-11'): string {
  const dateStr = businessDate.replace(/-/g, '');
  const timePart = Date.now().toString().slice(-5);
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${dateStr}-${timePart}${randPart}`;
}
