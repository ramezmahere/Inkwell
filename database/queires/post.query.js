import e from "express";
import { db } from "../db.js";
import * as schemas from "../schema.js";
import { count, eq, exists, and, desc, sql } from "drizzle-orm"

const { comments, likes, posts, relations, users } = schemas;


const feedQuery = (currentUserId)=>{
    const likedByMe = db
    .select({one : sql`1`})
    .from(likes)
    .where(and(
        eq(likes.postId , posts.id),
        eq(likes.userId , currentUserId)
    ))
    return db.
    select({
        id : posts.id ,
        content : posts.content ,
        image : posts.image ,
        created_at : posts.createdAt , 
        username : users.username ,
        like_count : sql`(SELECT count(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id})`.mapWith(Number),
        comment_count : sql`(SELECT count(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`.mapWith(Number),
        liked_by_me : exists(likedByMe)
    })
    .from(posts)
    .innerJoin(users , eq(posts.userId,users.id))
}

export const getAllPosts = async (currentUserId) => await feedQuery(currentUserId).orderBy(desc(posts.createdAt));
export const getSinglePost = async(currentUserId , postId) => await feedQuery(currentUserId).where(eq(posts.id , postId));