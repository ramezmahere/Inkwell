import { sql , defineRelations } from "drizzle-orm";
import { pgTable, integer, serial, varchar, text, timestamp, check, primaryKey  } from "drizzle-orm/pg-core"
import crypto from "crypto";



export const users = pgTable('users', {
    id: serial().primaryKey(),
    username: varchar({ length: 255 }).unique().notNull(),
    email: varchar({ length: 255 }).unique().notNull(),
    password: text().notNull(),
    createdAt : timestamp('created_at' , {withTimezone : true}).defaultNow().notNull()
});


export const posts = pgTable('posts' , {
    id : text().primaryKey().$defaultFn(()=>crypto.randomUUID()) ,
    userId : integer("user_id").references(()=>users.id , {onDelete : "cascade" , onUpdate : "cascade"}).notNull() ,
    content : text(),
    image : text() ,
    createdAt : timestamp('created_at' , {withTimezone : true}).notNull().defaultNow()
}, (table) =>[
    check("image_content_NOT_NULL" , sql `
        ${table.content} IS NOT NULL OR ${table.image} IS NOT NULL 
        `)
]);

export const comments = pgTable('comments' , {
    id : text().primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId : text('post_id').references(()=>posts.id , {onDelete : "cascade" , onUpdate : "cascade"}).notNull(),
    userId : integer('user_id').references(()=>users.id , {onDelete : "cascade" , onUpdate : "cascade"}).notNull(),
    content : text().notNull(),
    createdAt : timestamp('created_at' , {withTimezone : true}).notNull().defaultNow()
})

export const likes = pgTable('likes' , {
    userId : integer("user_id").references(()=>users.id , {onUpdate : 'cascade'}).notNull(),
    postId : text("post_id").references(()=> posts.id , {onDelete : "cascade" , onUpdate : "cascade"}).notNull()
}, (table) =>[
    primaryKey({
        columns : [table.postId , table.userId]
    })
]);


export const relations = defineRelations({users , comments , likes , posts } , (r) =>{
    return {
        users : {

            post : r.many.posts({
                from : r.users.id , 
                to : r.posts.userId
            }),
            comments : r.many.comments({
                from : r.users.id ,
                to : r.comments.userId
            }),
            likes : r.many.likes({
                from : r.users.id , 
                to : r.likes.userId
            })
        },

        posts:{
            user : r.one.users(),
            comments : r.many.comments({
                from : r.posts.id , 
                to : r.comments.postId
            }),
            likes : r.many.likes({
                from : r.posts.id,
                to : r.likes.postId
            })
        },
        comments :{
            user : r.one.users(),
            post : r.one.posts(),
        },
        likes :{
            user : r.one.users(),
            post : r.one.posts()
        }
    }
})