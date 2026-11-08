import {defineConfig} from "drizzle-kit"


export default defineConfig({
    out : "./database/drizzle",
    dialect : "postgresql",
    schema : "./database/schema.js",
    dbCredentials : {
        url :  process.env.DATABASE_URL
    }
})