import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import inventoryRoutes from './routes/inventory.routes.js';

const app = express();
const PORT: number = Number(process.env['PORT']) || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// 서버 확인
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ShoppingEx TypeScript API Server is running!',
    status: 'success',
  });
});

// InventoryItem API
app.use('/api/inventory-items', inventoryRoutes);

app.listen(PORT, () => {
  console.log(`TypeScript Server running on port ${PORT}`);
});