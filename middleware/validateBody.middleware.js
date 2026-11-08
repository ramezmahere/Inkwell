import z from "zod";


export const validateBody = (schema) =>{
    return(req,res,next) =>{
        const parsedSchema = schema.safeParse(req.body);
        if(!parsedSchema.success){
            const errors = z.treeifyError(parsedSchema.error).properties;
            return res.status(422).json({
                errors:errors
            })
        }
        req.body = parsedSchema.data ; 
        next();
    }
} 