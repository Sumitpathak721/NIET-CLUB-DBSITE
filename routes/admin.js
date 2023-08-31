const express = require("express");
// const fs = require('fs')
const multer = require('multer')
const multerS3 = require("multer-s3");
const AWS = require('aws-sdk');
const sentEmail = require("./sendEmail.js")
require("dotenv").config();

require("../db/config");
const userModel = require("../db/users")
const clubModel = require("../db/clubs")
const mainModel = require("../db/main")
const messageModel = require("../db/message");
let {verifyToken} = require("../server.js");

const route=express()

AWS.config.update({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
})



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

const s3 = new AWS.S3();

var upload = multer({
    
    storage: multerS3({
        s3: s3,
        bucket: 'niet-dsw',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            if(file.fieldname=="icon"){
                cb(null,req.body.name+"-clubIcon")
            }else if(file.fieldname=='DSWIcon'){
                cb(null,"DSW-clubIcon")
            }else if(file.fieldname=="video"){
                cb(null,"DSW-clubVideo")
            }
        }
    })
})

// var upload = multer({
//     storage:multer.diskStorage({
//         destination:(req,file,cb)=>{
//             if(file.mimetype.split("/")[0]=="video"){
//                 cb(null,'/')
//             }
//             if(file.mimetype.split("/")[0]=="image"){
//                 cb(null,"public/dynamic/images")
//             }
//         },
//         filename:(req,file,cb)=>{
//             if(file.fieldname=="icon"){
//                 cb(null,req.body.name+"-clubIcon.png")
//             }else if(file.fieldname=='DSWIcon'){
//                 cb(null,"DSW-"+Date.now()+"clubIcon.png")
//             }else if(file.fieldname=="video"){
//                     //for api edit-dsw-video
//                     cb(null,"DSW"+Date.now()+"-clubVideo.mp4")
//             }
                
//         }
//     })
// });


route.post("/addClub",upload.fields([{name:"icon",maxCount:1},{name:"video",maxCount:1}]),verifyToken,async(req,res)=>{
    try{
    let admin = req.body.validation.user;
    if(admin && admin.Access=="admin"){
        let clubAdmin = await userModel.findOne({ERP_ID:req.body.ERP_ID});
        if(clubAdmin){
            if(clubAdmin.access=='clubAdmin' || clubAdmin.access=="admin"){
                res.json({status:"Already clubAdmin"});
            }else{
                let club = await userModel.findOne({name:req.body.name});
                if(club && club.name==req.body.name){
                    res.json({status:"Club Already Exist"});
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
                        icon:"/files/"+req.body.name+"-clubIcon",
                        video:"/files/"+req.body.name+"-clubVideo",
                        event:[]
                    })
                    await newClub.members.push({userId:clubAdmin._id,position:"clubAdmin"});
                    clubAdmin.access = "clubAdmin";
                    clubAdmin.accessID = newClub._id;
                    await clubAdmin.save();
                    await newClub.save();
                    res.json({status:"ok"});
                }
            }
        }else{
            res.redirect({status:"clubAdmin not exist or not  verified"})
        }
    }else{
        res.redirect({status:"UnAuthorized"})
    }}catch(e){
        console.log("got error:",e);
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
            main.icon = "/files/"+req.files.DSWIcon[0].filename;
        }
        if(req.files.video){
            main.video = "/files/"+req.files.video[0].filename;
        }
        await main.save();
        res.send({status:"ok"})
    }else{
        let newMain =new mainModel({
            desc1:req.body.desc1,
            desc2:req.body.desc2,
            helpLineNo:[req.body.helplineNo1,req.body.helplineNo1],
            email:[req.body.email1,req.body.email2],
            icon:"/files/"+req.files.DSWIcon[0].filename,
            video:"/files/"+req.files.video[0].filename,
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
            let year = "";
            let users = [];
            if(req.body.year=="All"){
                if(req.body.club_name=="All"){
                    tempUsers = await userModel.find({isverified:true}); 
                    for(let i=0;i<tempUsers.length;i++){
                        users.push(tempUsers[i].ERP_ID);
                    }
                }else{
                    let clubMembers = (await clubModel.findOne({name:req.body.club_name})).members;
                    for(let i=0;i<clubMembers.length;i++){
                        users.push((await userModel.find({_id:clubMembers[i].userId,isverified:true})).ERP_ID);
                    }
                }
            }else{
                if(req.body.club_name=="All"){
                    tempUsers = await userModel.find({isverified:true,year:req.body.year});
                    for(let i=0;i<tempUsers.length;i++){
                        users.push(tempUsers[i].ERP_ID);
                    }
                }else{
                    let clubMembers = (await clubModel.findOne({name:req.body.club_name})).members;
                    // console.log(clubMembers);
                    for(let i=0;i<clubMembers.length;i++){
                        users.push((await userModel.findOne({_id:clubMembers[i].userId,isverified:true,year:req.body.year})).ERP_ID);
                    }
                }
            }
            // let users = await userModel.find({isverified:true,year});
            let newMessage = new messageModel({
                title:req.body.title,
                detail:req.body.message,
                date:isoDate,
                access:users,
            });
            await newMessage.save();
            for(let i=0;i<users.length;i++){
                await sentEmail(users[i]+"@niet.co.in","DSW-NIET: Notification",req.body.title);
            }
            res.send({status:"Message Sent Succesfully:)"})
    }else{
        res.send({status:"Unauthorized access"});
    }
});

route.post("/update-coty",verifyToken,async(req,res)=>{
    let {user} = req.body.validation;
    if(user && user.Access=="admin"){
        let club = await  clubModel.findOne({name:req.body.clubName});
        if(club){
            let data = await mainModel.findOne({});
            data.clubOftheYear = club._id;
            await data.save();
            res.send({status:200});
        }else{
            res.send({status:404});
        }
    }else{
        res.send({status:401});
    }
});

module.exports = route;