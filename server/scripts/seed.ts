import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import User from '../src/models/User.js';
import Portfolio from '../src/models/Portfolio.js';
import Transaction from '../src/models/Transaction.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Limpiar datos previos
  await Promise.all([
    User.deleteMany({}),
    Portfolio.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // --- Usuarios ---
  const password = await bcrypt.hash('password123', 12);

  const [ana, carlos] = await User.insertMany([
    { email: 'ana@fintrack.dev', password, name: 'Ana García' },
    { email: 'carlos@fintrack.dev', password, name: 'Carlos López' },
  ]);
  console.log('Created users: ana@fintrack.dev / carlos@fintrack.dev (password: password123)');

  // --- Portfolios de Ana ---
  const [techStocks, crypto] = await Portfolio.insertMany([
    { userId: ana._id, name: 'Tech Stocks', description: 'Acciones del sector tecnológico' },
    { userId: ana._id, name: 'Crypto', description: 'Bitcoin y Ethereum' },
  ]);

  // --- Portfolio de Carlos ---
  const [diversificado] = await Portfolio.insertMany([
    { userId: carlos._id, name: 'Portfolio Diversificado', description: 'Mix de acciones y fondos' },
  ]);

  // --- Transacciones Tech Stocks (Ana) ---
  const now = new Date();
  const months = (n: number) => new Date(now.getFullYear(), now.getMonth() - n, 15);

  await Transaction.insertMany([
    // AAPL — posición abierta con beneficio
    { portfolioId: techStocks._id, assetSymbol: 'AAPL', type: 'buy', quantity: 20, priceAtTransaction: 165.00, date: months(6), notes: 'Entrada inicial' },
    { portfolioId: techStocks._id, assetSymbol: 'AAPL', type: 'buy', quantity: 10, priceAtTransaction: 172.50, date: months(4), notes: 'Promediando' },
    { portfolioId: techStocks._id, assetSymbol: 'AAPL', type: 'sell', quantity: 5, priceAtTransaction: 189.00, date: months(2), notes: 'Recogida parcial de beneficios' },

    // MSFT — posición abierta
    { portfolioId: techStocks._id, assetSymbol: 'MSFT', type: 'buy', quantity: 15, priceAtTransaction: 310.00, date: months(5) },
    { portfolioId: techStocks._id, assetSymbol: 'MSFT', type: 'buy', quantity: 5, priceAtTransaction: 325.00, date: months(3) },

    // NVDA — posición cerrada (compra y venta total)
    { portfolioId: techStocks._id, assetSymbol: 'NVDA', type: 'buy', quantity: 8, priceAtTransaction: 420.00, date: months(7) },
    { portfolioId: techStocks._id, assetSymbol: 'NVDA', type: 'sell', quantity: 8, priceAtTransaction: 580.00, date: months(1), notes: 'Posición cerrada con beneficio' },

    // GOOGL
    { portfolioId: techStocks._id, assetSymbol: 'GOOGL', type: 'buy', quantity: 12, priceAtTransaction: 140.00, date: months(4) },
  ]);

  // --- Transacciones Crypto (Ana) ---
  await Transaction.insertMany([
    // BTC
    { portfolioId: crypto._id, assetSymbol: 'BTC', type: 'buy', quantity: 0.5, priceAtTransaction: 42000, date: months(8) },
    { portfolioId: crypto._id, assetSymbol: 'BTC', type: 'buy', quantity: 0.25, priceAtTransaction: 38500, date: months(5) },

    // ETH
    { portfolioId: crypto._id, assetSymbol: 'ETH', type: 'buy', quantity: 5, priceAtTransaction: 2200, date: months(6) },
    { portfolioId: crypto._id, assetSymbol: 'ETH', type: 'sell', quantity: 1, priceAtTransaction: 2800, date: months(2), notes: 'Venta parcial' },

    // SOL
    { portfolioId: crypto._id, assetSymbol: 'SOL', type: 'buy', quantity: 30, priceAtTransaction: 85, date: months(3) },
  ]);

  // --- Transacciones Portfolio Diversificado (Carlos) ---
  await Transaction.insertMany([
    { portfolioId: diversificado._id, assetSymbol: 'AAPL', type: 'buy', quantity: 10, priceAtTransaction: 175.00, date: months(5) },
    { portfolioId: diversificado._id, assetSymbol: 'MSFT', type: 'buy', quantity: 8, priceAtTransaction: 315.00, date: months(4) },
    { portfolioId: diversificado._id, assetSymbol: 'AMZN', type: 'buy', quantity: 6, priceAtTransaction: 178.00, date: months(3) },
    { portfolioId: diversificado._id, assetSymbol: 'BTC', type: 'buy', quantity: 0.1, priceAtTransaction: 45000, date: months(2) },
    { portfolioId: diversificado._id, assetSymbol: 'AMZN', type: 'sell', quantity: 2, priceAtTransaction: 195.00, date: months(1), notes: 'Recogida beneficios' },
  ]);

  console.log('\nSeed completado:');
  console.log('  Ana García (ana@fintrack.dev):');
  console.log('    - Tech Stocks: AAPL (25), MSFT (20), GOOGL (12)  [NVDA cerrada]');
  console.log('    - Crypto: BTC (0.75), ETH (4), SOL (30)');
  console.log('  Carlos López (carlos@fintrack.dev):');
  console.log('    - Portfolio Diversificado: AAPL (10), MSFT (8), AMZN (4), BTC (0.1)');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
