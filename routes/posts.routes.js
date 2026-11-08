import { Router } from "express";
import { checkAuth } from "../middleware/checkAuth.js";
import { validateBody } from "../middleware/validateBody.middleware.js";
import { multerErrorHandler, upload } from "../middleware/imageUpload.js";
import { db } from "../database/db.js";
import { getAllPosts, getSinglePost } from "../database/queires/post.query.js"
import { eq, and, desc } from "drizzle-orm"
import * as schemas from "../database/schema.js"
import z from "zod";

export const postsRouter = Router();

const postUploadSchema = z.object({
    content: z.string().trim().min(1).max(500)
})

// upload post
postsRouter.post("/", [checkAuth, upload.single("image"), multerErrorHandler, validateBody(postUploadSchema)], async (req, res) => {
    const [data] = await db.insert(schemas.posts).values({
        userId: req.session.userId,
        content: req.body.content,
        image: req.file?.filename ?? null,
    }).returning();

    res.status(201).json({
        message: "post created successfully",
        data :{
            ...data
        }
    })
});

// get all posts
postsRouter.get("/", checkAuth, async (req, res) => {
    const allPosts = await getAllPosts(req.session.userId);
    res.status(200).json({
        data: allPosts
    })
})

// get single post
postsRouter.get("/:id", checkAuth, async (req, res) => {
    const [post] = await getSinglePost(req.session.userId, req.params.id);
    if (!post) return res.status(404).json({ message: "post is not found" })

    const comments = await db.select({
        id: schemas.comments.id,
        content: schemas.comments.content,
        created_at: schemas.comments.createdAt,
        username: schemas.users.username
    }).from(schemas.comments).where(eq(schemas.comments.postId, req.params.id))
        .innerJoin(schemas.users, eq(schemas.comments.userId, schemas.users.id))
        .orderBy(desc(schemas.comments.createdAt));


    res.status(200).json({
        data: {
            post : {
                ...post
            },
            comments : [...comments]
        }
    })
})

// post a like 
postsRouter.post("/:id/like", checkAuth, async (req, res) => {
    const [post] = await getSinglePost(req.session.userId, req.params.id);
    if (!post) return res.status(404).json({ message: "post is not found" })
    if (post.liked_by_me) {
        post.like_count--;
        await db.delete(schemas.likes).where(and(
            eq(schemas.likes.postId, req.params.id),
            eq(schemas.likes.userId, req.session.userId),
        ))
        return res.status(200).json({
            data: {
                liked: false,
                like_count: post.like_count
            }
        })
    }
    post.like_count++;
    await db.insert(schemas.likes).values({
        postId: req.params.id,
        userId: req.session.userId
    }).onConflictDoNothing();
    return res.status(200).json({
        data: {
            liked: true,
            like_count: post.like_count
        }
    })
})

const commentUploadSchema = z.object({
    content: z.string().trim().min(1).max(2000)
})
// post a comment 
postsRouter.post("/:id/comments", [checkAuth, validateBody(commentUploadSchema)], async (req, res) => {
    const [post] = await db.select().from(schemas.posts).where(eq(schemas.posts.id, req.params.id));
    if (!post) {
        return res.status(404).json({ "error": "post not found" })
    }
    const [newComment] = await db.insert(schemas.comments).values({
        content: req.body.content,
        postId: req.params.id,
        userId: req.session.userId
    }).returning();
    res.status(201).json({
        message: "comment created successfully",
        data: {
            id: newComment.id,
            content: newComment.content,
            created_at: newComment.createdAt,
            username: req.session.username,
        },
    });
})