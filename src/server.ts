import express, { type Request, type Response } from 'express';
import { Pool } from 'pg';

const app = express();
const PORT: number = Number(process.env['PORT']) || 8080;

app.use(express.json());

const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
});

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'ShoppingEx TypeScript API Server is running!',
        status: 'success',
    });
});

app.get('/api/inventory-items', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
      SELECT uuid, name, cnt, meta
      FROM inventory_items
      ORDER BY name
    `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to fetch inventory items',
        });
    }
});

app.listen(PORT, () => {
    console.log(`TypeScript Server running on port ${PORT}`);
});