import express, { type Request, type Response } from 'express';

const app = express();

const PORT: number = Number(process.env['PORT']) || 8080;

app.use(express.json());

interface Product {
  id: number;
  name: string;
  price: number;
}

// 기본 루트 확인용 API
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ShoppingEx TypeScript API Server is running!',
    status: 'success'
  });
});

// 간단한 상품 목록 API 예제
app.get('/api/products', (req: Request, res: Response) => {
  const products: Product[] = [
    { id: 1, name: '스마트폰', price: 1000000 },
    { id: 2, name: '무선 이어폰', price: 200000 },
    { id: 3, name: '노트북', price: 1500000 }
  ];
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`TypeScript Server running on port ${PORT}`);
});