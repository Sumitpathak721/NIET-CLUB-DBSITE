const express = require("express");
const fs = require('fs')
const multer = require('multer')
require("dotenv").config();

require("../db/config");
const userModel = require("../db/users")
const clubModel = require("../db/clubs")
const mainModel = require("../db/main")
const messageModel = require("../db/message");
let {templatesLoc, verifyToken} = require("../server.js");
const { runInNewContext } = require("vm");
const path = require("path");

const route=express()

route.post("/",async(req,res)=>{
    if(req.body.id){
        let user = await userModel.findOne({_id:req.body.id,access:"admin"});
        if(user){
            
            res.send({status:"ok"});
        }else{
            res.send({status:"false"});
        }
    }else{
        res.send({status:"error"});
    }
});


var upload = multer({
    storage:multer.diskStorage({
        destination:(req,file,cb)=>{
            if(file.mimetype.split("/")[0]=="video"){
                cb(null,'public/dynamic/videos')
            }
            if(file.mimetype.split("/")[0]=="image"){
                cb(null,"public/dynamic/images")
            }
        },
        filename:(req,file,cb)=>{
            if(file.fieldname=="icon"){
                cb(null,req.body.name+"-clubIcon.png")
            }else if(file.fieldname=='DSWIcon'){
                cb(null,"DSW-"+Date.now()+"clubIcon.png")
            }else if(file.fieldname=="video"){
                    //for api edit-dsw-video
                    cb(null,"DSW"+Date.now()+"-clubVideo.mp4")
            }
                
        }
    })
});

route.post("/addClub",upload.fields([{name:"icon",maxCount:1},{name:"video",maxCount:1}]),verifyToken,async(req,res)=>{
    let admin = req.body.validation.user;
    if(admin && admin.Access=="admin"){
        let clubAdmin = await userModel.findOne({ERP_ID:req.body.ERP_ID});
        if(clubAdmin){
            if(clubAdmin.access=='clubAdmin' || clubAdmin.access=="admin"){
                res.send({status:"Already clubAdmin"});
            }else{
                let club = await userModel.findOne({name:req.body.name});
                if(club && club.name==req.body.name){
                    res.send({status:"Club Already Exist"});
                }else{
                    let newClub =new clubModel({
                        name:req.body.name,
                        admin:clubAdmin._id,
                        description:req.body.desc,
                        desc2:req.body.desc2,
                        whatsapp:req.body.whatsapp,
                        members:[],
                        number:req.body.number,
                        Email:req.body.Email,
                        icon:"/dynamic/images/"+req.body.name+"-clubIcon.png",
                        video:"/dynamic/videos/"+req.body.name+"-clubVideo.mp4",
                        event:[]
                    })
                    await newClub.members.push({userId:clubAdmin._id,position:"clubAdmin"});
                    clubAdmin.access = "clubAdmin";
                    clubAdmin.accessID = newClub._id;
                    await clubAdmin.save();
                    await newClub.save();
                    res.send({status:"ok"});
                }
            }
        }else{
            res.redirect({status:"clubAdmin not exist or not  verified"})
        }
    }else{
        res.redirect({status:"UnAuthorized"})
    }
    
});
//-----------Edit DSW club info API Start-----------
route.put("/edit-dsw-info",upload.fields([{name:"DSWIcon",maxCount:1},{name:"video",maxCount:1}]),verifyToken,async(req,res)=>{
    if(req.body.validation.user.Access!="admin"){
        res.send({status:"access Denied!!"})
        return;
    }
    let main = await mainModel.findOne({});
    if(main){
        main.desc1=req.body.desc1;
        main.desc2=req.body.desc2;
        main.helplineNo=[req.body.helplineNo1,req.body.helplineNo1];
        main.email=[req.body.email1,req.body.email2]
        if(req.files.DSWIcon){
            console.log(path.join("public",main.icon));
            fs.unlink(`${path.join("public",main.icon)}`,(e)=>{
                console.log("i am here");
                if(e){
                    console.log("error got called");
                    console.log("File Deletion error:",e)
                    return;
                }
            });
            main.icon = "/dynamic/images/"+req.files.DSWIcon[0].filename;
        }
        if(req.files.video){
            fs.unlink(`${path.join("public",main.video)}`,(e)=>{
                console.log("i am here");
                if(e){
                    console.log("error got called");
                    console.log("File Deletion error:",e)
                    return;
                }
            });
            main.video = "/dynamic/videos/"+req.files.video[0].filename;
        }
        await main.save();
        res.send({status:"ok"})
    }else{
        let newMain =new mainModel({
            desc1:req.body.desc1,
            desc2:req.body.desc2,
            helpLineNo:[req.body.helplineNo1,req.body.helplineNo1],
            email:[req.body.email1,req.body.email2],
            icon:"/dynamic/images/"+req.files.DSWIcon[0].filename,
            video:"/dynamic/video/"+req.files.video[0].filename,
        });
        await newMain.save();
        res.send({status:"ok"})
    }
});


//------------Message api-----------

route.post("/sent-message",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
    if(req.body.validation.verified && user.Access=="admin"){
            const isoDate = (new Date()).toISOString().substring(0,10);//yyyy-mm-dd
            let newMessage = new messageModel({
                title:req.body.title,
                detail:req.body.message,
                date:isoDate,
            });
            await newMessage.save();
            res.send({status:"Message Sent Succesfully:)"})
    }else{
        res.send({status:"Unauthorized access"});
    }
});


module.exports = route;