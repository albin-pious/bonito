const multer = require('multer');
const path = require('path');
const imageTypes = /jpeg|jpg|png|gif|svg|webp/;

let stroage = multer.diskStorage({
    destination:(req,file,cb)=>{
            cb(null,'public/uploads');
    },
    filename: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

module.exports = multer({
    storage:stroage,
    fileFilter:function(req,file,cb){
        const extname = imageTypes.test(
            path.extname(file.originalname).toLowerCase()      
        );
        const mimetype = imageTypes.test(file.mimetype);
        if(extname && mimetype){
            return cb(null,true);
        }else{
            return cb(new Error('Only image files are allowed'));
        }
    }
})