import { Pool } from "pg";
import {drizzle} from "drizzle-orm/node-postgres";
import {relations} from "./schema.js"
import { configDotenv } from "dotenv";

configDotenv();

export const pool = new Pool({
    connectionString : process.env.DATABASE_URL
});

export const db = drizzle({
    client : pool ,
    relations : relations
})