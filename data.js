import fs from "fs/promises";
import { comments , likes, posts , users } from "./database/schema.js"
import {db , pool} from "./database/db.js"

import path from "path";

export const toJson = async () => {
    const dbPath = path.join(import.meta.dirname, "./data.json")

    const usersJSON = await db.select().from(users);
    const commentsJSON = await db.select().from(comments);
    const sessionsJSON = await pool.query(`SELECT * FROM session`);
    const likesJSON = await db.select().from(likes)
    const postsJSON = await db.select().from(posts)


    const data = {
        "users": usersJSON,
        "sessions": sessionsJSON.rows.at(0),
        "posts": postsJSON,
        "comments": commentsJSON,
        "likes": likesJSON
    }

    await fs.writeFile(dbPath, JSON.stringify(data, null, 4))

}


