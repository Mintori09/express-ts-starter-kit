import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running with pnpm and TypeScript!");
});

export default app;
