import multer, { MulterError } from "multer";
import path from "path";
import { randomUUID } from "crypto";

export const uploadsPath = path.join(import.meta.dirname , "../uploads");

const storage = multer.diskStorage({
    destination : (req , file ,cb )=>{
        cb(null , uploadsPath)
    },
    filename : (req,file,cb) =>{
        const extentions = {
            "image/jpeg" : ".jpg",
            "image/png" : ".png",
            "image/webp" : ".webp",
            "image/gif" : ".gif",
        }
        cb(null , randomUUID()+extentions[file.mimetype])
    }
});

export const upload = multer({
    fileFilter : (req,file,cb) =>{
        const allowedExtentions = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if(!allowedExtentions.includes(file.mimetype)){
            return cb(new Error("invalid image type") , false);
        }
        cb(null , true)
    },
    limits : {
        fileSize : 1024 * 1024 * 5
    },
    storage
})

export const multerErrorHandler = (err , req , res , next) =>{
    if(err instanceof MulterError){
        if(err.code === "LIMIT_FILE_SIZE"){
            return res.status(400).json({
                errors : {
                    image : {
                        errors : ["max file size has to be 5MB"]
                    }
                }
            })
        }

        return res.status(400).json({
            errors : {
                image : {
                    errors : [err.message]
                }
            }
        })
    }

    if(err){
        return res.status(400).json({
            errors : {
                image : {
                    errors : [err.message]
                }
            }
        })
    }

    next();
}