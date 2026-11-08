import express from "express";
import { pagesRouter } from "./routes/pages.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { postsRouter } from "./routes/posts.routes.js";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./database/db.js";
import crypto from "crypto";
import { configDotenv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const pgSession = connectPgSimple(session);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "pages")));

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sSession",
    cookie: {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 3600,
    },
    genid: () => crypto.randomUUID(),
  })
);

app.use((req, res, next) => {
  console.log(new Date().toLocaleString(), req.method, req.url);
  next();
});

app.use("/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use(pagesRouter);

app.use((err, req, res, next) => {
  console.log("err", err);
  res.status(500).json({ error: "something went wrong" });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
