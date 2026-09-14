// index.ts

import "dotenv/config";
import express, {
    type Request,
    type Response,
} from "express";
import cors from "cors";

import inventoryRoutes from "./routes/inventory.routes.js";
import productPostRoutes from "./routes/productPost.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes from "./routes/order.routes.js";
import displayRoutes from "./routes/client/display.routes.js";
import clientOrderRoutes from "./routes/client/order.routes.js";
import pageConfig from "./routes/pageConfig.routes.js";
import usersRoutes from "./routes/users.routes.js";
import clientHistoryRoutes from "./routes/client/history.routes.js";

import clientRefundRoutes from "./routes/client/refund.routes.js";
import adminRefundRoutes from "./routes/refund.routes.js";

const app = express();
const PORT: number =
    Number(process.env["PORT"]) || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get(
    "/",
    (
        req: Request,
        res: Response,
    ) => {
        res.json({
            message:
                "ShoppingEx API Server is running!",
            status: "success",
        });
    },
);

// page
app.use(
    "/api/page-config",
    pageConfig,
);

// API Routes
app.use(
    "/api/inventory-items",
    inventoryRoutes,
);

app.use(
    "/api/users",
    usersRoutes,
);

app.use(
    "/api",
    categoryRoutes,
);

app.use(
    "/api/orders",
    orderRoutes,
);

// Admin ProductPost
app.use(
    "/api",
    productPostRoutes,
);

// Client ProductPost
app.use(
    "/api/product-posts",
    displayRoutes,
);

app.use(
    "/api/client/orders",
    clientOrderRoutes,
);

app.use(
    "/api/client/history",
    clientHistoryRoutes,
);

app.use(
    "/api/client/refunds",
    clientRefundRoutes,
);

// Admin Refund
app.use(
    "/api/admin/refunds",
    adminRefundRoutes,
);

// Server
app.listen(PORT, () => {
    console.log(
        `TypeScript Server running on port ${PORT}`,
    );
});