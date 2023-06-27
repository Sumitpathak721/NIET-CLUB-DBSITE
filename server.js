const express=require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const path = require("path")
require("./db/config.js");
const jwt = require("jsonwebtoken");
const userModel = require("./db/users.js");


const app = express();

//MiddleWare
app.set("view engine","ejs");//configuring templates files to ejs extension
app.use(express.static(path.join(__dirname,"./public")));//location of static file
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

var templatesLoc = path.join(__dirname,"templates");
var publicLoc  =  path.join(__dirname,"/public");


const verifyToken = async(req, res, next) => {
    // Get the token from the Authorization header
    const token = req.headers.authorization;
    // Check if the token exists
    if (!token) {
      req.body.validation = {verify:false};
    }else{
        try{
            let user =await jwt.decode(token, process.env.JWT_SECRET_TOKEN);
            
            req.body.validation = {
                user:user,
                verified:true
            };
            
        }catch(e){
            
            req.body.validation = {verified:false};
        }
    next();
  };
}

app.get("/",async(req,res)=>{
    res.render(templatesLoc+"/login.ejs");
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
module.exports = {templatesLoc,verifyToken};
app.use("/dashboard",require("./routes/dashboard.js"));
app.use('/admin',require("./routes/admin.js"));
app.use("/clubAdmin",require("./routes/clubAdmin.js"));



app.listen(3001,()=>{
    console.log("Listening to port 3001")
});
