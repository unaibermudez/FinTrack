import type { Transaction } from '../api/transactions';

export const exportToCsv = (filename: string, transactions: Transaction[]): void => {
  const header = 'date,symbol,type,quantity,price,notes';
  const rows = transactions.map((t) => {
    const date = new Date(t.date).toISOString().split('T')[0];
    const notes = (t.notes ?? '').replace(/,/g, ';');
    return `${date},${t.assetSymbol},${t.type},${t.quantity},${t.priceAtTransaction},${notes}`;
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const CSV_TEMPLATE =
  'date,symbol,type,quantity,price,notes\n' +
  '2024-01-15,AAPL,buy,10,182.50,Initial purchase\n' +
  '2024-03-20,MSFT,buy,5,415.00,\n' +
  '2024-06-01,AAPL,sell,3,210.00,Partial profit taking\n';
