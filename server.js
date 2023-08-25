const express=require("express");
const ejs = require("ejs");
require("dotenv").config();
const bodyParser = require("body-parser");
const path = require("path")
require("./db/config.js");
const jwt = require("jsonwebtoken");
const userModel = require("./db/users.js");
const clubModel = require("./db/clubs.js");
const eventModel = require("./db/events.js");
const mainModel = require("./db/main.js");


const app = express();

//MiddleWare
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))//configuring templates files to ejs extension
app.use(express.static(path.join(__dirname,"./public")));//location of static file
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));



const verifyToken = async(req, res, next) => {
    // Get the token from the Authorization header
    const token = req.headers.authorization;
    // Check if the token exists
    if (!token) {
      req.body.validation = {verify:false};
    }else{
        try{
            jwt.verify(token, process.env.JWT_SECRET_TOKEN,(err,decode)=>{
                if(err){
                    console.log("Verification failed:",err.message);
                    req.body.validation = {verify:false};
                }else{
                    user = jwt.decode(token, process.env.JWT_SECRET_TOKEN);
                    req.body.validation = {
                        user:user,
                        verified:true
                    };
                }
            });
        }catch(e){
            req.body.validation = {verified:false};
            res.sendStatus(401);
        }
    next();
  };
}

app.get("/",async(req,res)=>{
    res.render("login.ejs");
});

app.post("/login",async(req,res)=>{
    if(req.body.ERP_ID!=null && req.body.password!=null){
        let user = await userModel.findOne({ERP_ID:req.body.ERP_ID,password:req.body.password});
        if(user && user.isverified){
            if(user.access!="user"){
                if(user.access=="admin"){
                    data = {
                        ERPID:user.ERP_ID,
                        PrivateID:user._id,
                        Name:user.name,
                        Access:user.access
                    };
                }else if(user.access=="clubAdmin"){
                    data = {
                        ERPID:user.ERP_ID,
                        PrivateID:user._id,
                        Name:user.name,
                        Access:user.access,
                        AccessID:user.accessID
                    };
                }
                const token = jwt.sign(data,process.env.JWT_SECRET_TOKEN);
                res.send({status:400,respond:{token:token}});
            }else{
                res.send({status:401});
            }
        }else{
            res.send({status:404});
        }
    }
});
app.get("/validate",verifyToken,async(req,res)=>{
    res.send(req.body.validation);
})
module.exports = {verifyToken};

const route=express()

route.get("/",async(req,res)=>{
    res.render("dashboard.ejs");
});

route.get("/getAccessData",verifyToken,async(req,res)=>{
    if(req.body.validation.verified){
        if(req.body.validation.user.Access=="admin"){
            let clubs = await clubModel.find({},{name:1});
            let main = await mainModel.findOne({});
            res.render("admin.ejs",{main:main,clubs:clubs,MAIN_DIR:process.env.MAIN_DIR});
        }else if(req.body.validation.user.Access=="clubAdmin"){
            let club = await clubModel.findOne({_id:req.body.validation.user.AccessID});
            res.render("clubAdmin.ejs",{club:club,MAIN_DIR:process.env.MAIN_DIR});
        }else{
            res.sendStatus(403);
        }
    }else{
        res.sendStatus(404);
    }
});
route.get("/getEvent",async(req,res)=>{
    let event = await eventModel.findOne({_id:req.query.clubID});
    res.send(event);
});

app.use('/dashboard',route);
app.use('/admin',require("./routes/admin.js"));
app.use("/clubAdmin",require("./routes/clubAdmin.js"));



app.listen(process.env.PORT|| 3001,()=>{
    console.log("Listening...")
});
