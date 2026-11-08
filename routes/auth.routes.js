import { Router } from "express";
import { db } from "../database/db.js"
import { users } from "../database/schema.js"
import { registerSchema, loginSchema } from "../schemas/auth/auth.schema.js";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt";
import { toJson } from "../data.js";
import { checkAuth } from "../middleware/checkAuth.js";
export const authRouter = Router();


authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
    const [existingUser] = await db.select().from(users).where(eq(users.email, req.body.email))
    if (existingUser) {
        return res.status(422).json({
            errors: {
                email: ["email already in use"]
            }
        })
    }
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const [data] = await db.insert(users).values({
        email: req.body.email,
        password: passwordHash,
        username: req.body.username
    }).returning()

    const { password, ...user } = data
    await toJson();
    res.status(201).json({
        message: "register successful, you can now login",
        data: user
    })
});



authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, req.body.email))
        .limit(1);

    const isValid = user ? await bcrypt.compare(req.body.password, user.password) : false;
    if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userEmail = user.email;

        req.session.save(async (err) => {
            if (err) return next(err);
            try {
                await toJson();
                const { password, ...safeUser } = user;
                res.status(200).json({
                    message: "login successful",
                    data: { user: safeUser },
                });
            } catch (e) {
                next(e);
            }
        });
    });
});

authRouter.post("/logout", checkAuth, (req, res) => {
    req.session.destroy(async (error) => {
        if (error) {
            console.log(error);
            return res.status(500).json({
                error: "failed to logout"
            })
        }

        res.clearCookie("sSession");
        await toJson();
        return res.status(200).json({ "message": "logout successful" });
    })
});

authRouter.get("/me", checkAuth, (req, res) => {
    const { userEmail, username, userId } = req.session;
    res.status(200).json({
        data: {
            user : {
                id : userId,
                email : userEmail,
                username : username
            }
        }
    })
})
