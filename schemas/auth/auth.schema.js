import z from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod"
import { users } from "../../database/schema.js"
const insertSchema = createInsertSchema(users);

export const registerSchema = insertSchema
    .omit({ id: true })
    .extend({
        username: z.string().min(1, "username is required").max(255, "username is to large"),
        email: z.email("Invalid email format"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long.")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
            .regex(/[0-9]/, "Password must contain at least one number."),
        password_confirmation: z.string()
}).refine((data) => data.password === data.password_confirmation , {
    path : "password_confirmation",
    error : "password has to match"
})
export const loginSchema = insertSchema
    .omit({ id: true  , createdAt : true , username : true })
    .extend({
        email: z.email("Invalid email format"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long.")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
            .regex(/[0-9]/, "Password must contain at least one number."),
})
