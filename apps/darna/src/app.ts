require("dotenv").config();

import http from "http";
import express from "express";
import cors, { CorsOptions } from "cors";
import swaggerUi from "swagger-ui-express";
import { connectionDB } from "./config/db_config";
import RealEstateRoutes from "./routes/realEstate.routes";
import AuthRoutes from "./routes/authRoutes";
import SubscriptionRoutes from "./routes/subscription.routes";
import ChatRoutes from "./routes/chat.routes";
import NotificationRoutes from "./routes/notification.routes";
import LeadRoutes from "./routes/lead.routes";
import FinancingRoutes from "./routes/financing.routes";
import AdminRoutes from "./routes/admin.routes";
import UserRoutes from "./routes/user.routes";
import { kcProtect } from "./middlewares/kcJwt";
import { initSocketServer } from "./realtime/socketServer";
import swaggerDocument from "./docs/swagger";

connectionDB();

const app = express();
const port = process.env.PORT || "3001";

const corsOptions: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", AuthRoutes);
app.use("/api/realEstate", RealEstateRoutes);
app.use("/api/users", kcProtect, UserRoutes);
app.use("/api/subscriptions", SubscriptionRoutes);
app.use("/api/chat", ChatRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use("/api/leads", LeadRoutes);
app.use("/api/financing", FinancingRoutes);
app.use("/api/admin", AdminRoutes);

const server = http.createServer(app);
initSocketServer(server);

server.listen(Number(port), () => {
  console.log(`running Server on http://localhost:${port}`);
});
