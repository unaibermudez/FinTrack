import Transaction from '../models/Transaction.js';
import Portfolio from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';

export interface ImportResult {
  imported: number;
  errors: string[];
}

const HEADER_KEYWORDS = ['date', 'symbol', 'type', 'quantity', 'price'];

const isHeaderRow = (line: string) => {
  const lower = line.toLowerCase();
  return HEADER_KEYWORDS.filter((k) => lower.includes(k)).length >= 3;
};

const parseCols = (line: string): string[] =>
  line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

export const importFromCsv = async (
  portfolioId: string,
  userId: string,
  csvContent: string
): Promise<ImportResult> => {
  const portfolio = await Portfolio.findOne({ _id: portfolioId, userId });
  if (!portfolio) throw new ApiError(404, 'Portfolio not found');

  const lines = csvContent.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new ApiError(400, 'The CSV file is empty.');

  // Validate it looks like a CSV at all (first line must have at least 4 commas or be a header)
  const firstLineCols = parseCols(lines[0]);
  if (firstLineCols.length < 5 && !isHeaderRow(lines[0])) {
    throw new ApiError(
      400,
      `Invalid CSV format. Expected at least 5 columns (date, symbol, type, quantity, price) but found ${firstLineCols.length}. Make sure you are using a comma-separated file.`
    );
  }

  const hasHeader = isHeaderRow(lines[0]);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    throw new ApiError(400, 'The CSV file only contains a header row and no data.');
  }

  const docs: object[] = [];
  const errors: string[] = [];

  dataLines.forEach((line, i) => {
    const rowNum = hasHeader ? i + 2 : i + 1;
    const cols = parseCols(line);

    if (cols.length < 5) {
      errors.push(`Row ${rowNum}: expected 5 columns (date, symbol, type, quantity, price) but found ${cols.length} — "${line}"`);
      return;
    }

    const [rawDate, rawSymbol, rawType, rawQty, rawPrice, ...notesParts] = cols;

    // Date
    const date = new Date(rawDate);
    if (!rawDate || isNaN(date.getTime())) {
      errors.push(`Row ${rowNum}: invalid date "${rawDate}" — use format YYYY-MM-DD (e.g. 2024-01-15)`);
      return;
    }

    // Symbol
    const symbol = rawSymbol?.trim();
    if (!symbol) {
      errors.push(`Row ${rowNum}: missing asset symbol`);
      return;
    }
    if (!/^[A-Za-z0-9.\-^]+$/.test(symbol)) {
      errors.push(`Row ${rowNum}: symbol "${symbol}" contains invalid characters`);
      return;
    }

    // Type
    const type = rawType?.trim().toLowerCase();
    if (!type) {
      errors.push(`Row ${rowNum}: missing transaction type — must be "buy", "sell", "dividend" or "fee"`);
      return;
    }
    if (!['buy', 'sell', 'dividend', 'fee'].includes(type)) {
      errors.push(`Row ${rowNum}: invalid type "${rawType}" — must be "buy", "sell", "dividend" or "fee" (case-insensitive)`);
      return;
    }

    // Quantity
    const quantity = parseFloat(rawQty);
    if (!rawQty || isNaN(quantity)) {
      errors.push(`Row ${rowNum}: quantity "${rawQty}" is not a valid number`);
      return;
    }
    if (quantity <= 0) {
      errors.push(`Row ${rowNum}: quantity must be greater than 0 (got ${quantity})`);
      return;
    }

    // Price
    const price = parseFloat(rawPrice);
    if (!rawPrice || isNaN(price)) {
      errors.push(`Row ${rowNum}: price "${rawPrice}" is not a valid number`);
      return;
    }
    if (price <= 0) {
      errors.push(`Row ${rowNum}: price must be greater than 0 (got ${price})`);
      return;
    }

    const notes = notesParts.join(',').trim() || undefined;

    docs.push({
      portfolioId,
      assetSymbol: symbol.toUpperCase(),
      type,
      quantity,
      priceAtTransaction: price,
      date,
      notes,
    });
  });

  if (docs.length > 0) await Transaction.insertMany(docs);

  return { imported: docs.length, errors };
};
