require("./services/NotificationService").startNotificationJob();
const express = require("express");
const dbcon = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const kcAuth = require('./middlewares/kcAuth');
const groupRoutes = require("./routes/groupRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const errorHandler = require("./middlewares/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger");

require("./services/CronService").startCronJobs();

require("dotenv").config({ path: "../.env" });

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

dbcon();

app.get("/", (req, res) => {
  res.send("IT IS WORKING!!!!");
});

app.use("/api/users", (req,res,next)=>{
  if(req.path === '/register' || req.path === '/login'){
    return res.status(410).json({ message: 'Deprecated. Use Keycloak SSO /api/auth/login on Darna or obtain token from Keycloak.' });
  }
  kcAuth(req,res,next);
}, userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/contributions", contributionRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server Started on PORT: ${port}`);
});

module.exports = app;
