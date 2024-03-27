const mongoose = require('mongoose');
const Users = mongoose.model('users');
const otpAdharkyc = mongoose.model('otpAdharkyc');
const BankDetails = mongoose.model('bankDetails');

const express = require('express');
const router = express.Router();
const config = require('../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../logger');
const { registerUser } = require('../../helper/signups/signupValidation');
//const walletActions = require("../../aviator/updateWallet");
const { getUserDefaultFields, saveGameUser } = require('../../helper/signups/appStart');

/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/UserList', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const userList = await Users.find({isBot:false}, { username: 1,avatar:1,profileUrl:1,winningChips:1,bonusChips:1, id: 1,email:1,uniqueId:1,name:1,
            "blackandwhite.totalMatch":1,"aviator.totalMatch":1, mobileNumber: 1, "counters.totalMatch": 1, isVIP: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })
            
        logger.info('admin/dahboard.js post dahboard  error => ', userList);

        res.json({ userList });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/UserData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/UserData', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        //userInfo
        const userInfo = await Users.findOne({ _id: new mongoose.Types.ObjectId(req.query.userId) }, { name:1,winningChips:1,bonusChips:1,username: 1, id: 1, loginType: 1, profileUrl: 1, mobileNumber: 1, email: 1, uniqueId: 1, "counters.totalMatch": 1, deviceType: 1,location:1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        console.log("userInfo :::::::::::::::::::",userInfo)

        let UserOKYC = await otpAdharkyc.findOne({userId: new mongoose.Types.ObjectId(req.query.userId)},
                                                    {adharcard:1,verified:1,"userInfo":1,"DOB":1,adharcardfrontimages:1,adharcardbackimages:1,
                                                    pancardname:1,pancardfrontimages:1,pancard:1,"panInfo":1,pancardverified:1})
        console.log("UserOKYC",UserOKYC)

        UserOKYCData = {
            adharcard:" - ",
            full_name:"",
            verified:"",
            userInfo:"",
            DOB:"",
            gender:"",
            pincode:"",
            adharcardfrontimages:"",
            adharcardbackimages:""

        }
        UserOKYCData.adharcard = (UserOKYC != undefined && UserOKYC.adharcard != undefined) ?UserOKYC.adharcard : "-";
        UserOKYCData.full_name = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_full_name != undefined) ?UserOKYC.userInfo.user_full_name : "-";

        UserOKYCData.verified = (UserOKYC != undefined &&  UserOKYC.verified != undefined) ?UserOKYC.verified : "-";
        UserOKYCData.adharcardfrontimages = (UserOKYC != undefined &&  UserOKYC.adharcardfrontimages != undefined) ?UserOKYC.adharcardfrontimages : "-";
        UserOKYCData.adharcardbackimages = (UserOKYC != undefined &&  UserOKYC.adharcardbackimages != undefined) ?UserOKYC.adharcardbackimages : "-";

        
        UserOKYCData.DOB = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_dob != undefined) ?UserOKYC.userInfo.user_dob : "-";
        UserOKYCData.gender = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_gender != undefined) ?UserOKYC.userInfo.user_gender : "-";
        UserOKYCData.userInfo  =  (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_address != undefined) ?
         ""+UserOKYC.userInfo.user_address.house+","+UserOKYC.userInfo.user_address.street+","+UserOKYC.userInfo.user_address.po+","+UserOKYC.userInfo.user_address.loc+","
         +UserOKYC.userInfo.user_address.vtc+","+UserOKYC.userInfo.user_address.dist+","+UserOKYC.userInfo.user_address.state+","+UserOKYC.userInfo.user_address.country+"" :"Not Available";

         UserOKYCData.pincode =  (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.address_zip != undefined) ? UserOKYC.userInfo.address_zip : "-"

        PanOKYCData = {
            pancardname:"",
            pancard:"",
            verified:"",
            DOB:"",
            full_name:"",
            pancardfrontimages:""
        }   

        PanOKYCData.pancard = (UserOKYC != undefined && UserOKYC.pancard != undefined) ?UserOKYC.pancard : "-";
        PanOKYCData.pancardname = (UserOKYC != undefined && UserOKYC.pancardname != undefined) ?UserOKYC.pancardname : "-";
        PanOKYCData.pancardfrontimages = (UserOKYC != undefined && UserOKYC.pancardfrontimages != undefined) ?UserOKYC.pancardfrontimages : "-";
        PanOKYCData.verified = (UserOKYC != undefined && UserOKYC.pancardverified != undefined) ?UserOKYC.pancardverified : "-";
        PanOKYCData.full_name = (UserOKYC != undefined && UserOKYC.panInfo != undefined && UserOKYC.panInfo.user_full_name != undefined) ?UserOKYC.panInfo.user_full_name : "-";
        PanOKYCData.DOB = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_dob != undefined) ?UserOKYC.userInfo.user_dob : "-";

       
        
        console.log('admin/dahboard.js post dahboard  error => :::::::: UserOKYCData ', UserOKYCData);
        console.log('admin/dahboard.js post dahboard  error => :::::::: PanOKYCData ', PanOKYCData);


        res.json({ userInfo,UserOKYCData,PanOKYCData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/UserData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/BankData', async (req, res) => {
    try {
        console.info('requet => BankData ', req.query);
        //userInfo
        const userBankInfo = await BankDetails.findOne({ userId: new mongoose.Types.ObjectId(req.query.userId) }, { })

        console.log("userBankInfo :::::::::::::::::::",userBankInfo)

        res.json({ userBankInfo });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/AddUser', async (req, res) => {
    try {

        //currently send rendom number and generate 
        console.log("req ::::::::::::",req.body)
        let response = {
            mobileNumber:req.body.mobileNumber,
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            isVIP: 1,
            country:req.body.country
        }

        console.log("response  :::::::::::: response ",response)

        logger.info('Register User Request Body =>', response);
        const { mobileNumber } = response;
    
        let query = { mobileNumber: mobileNumber };
        let result = await Users.findOne(query, {});
        console.log("result ",result)
        if (!result) {
            let defaultData = await getUserDefaultFields(response);
            logger.info('registerUser defaultData : ', defaultData);
    
            let userInsertInfo = await saveGameUser(defaultData);
            logger.info('registerUser userInsertInfo : ', userInsertInfo);
            
            if(userInsertInfo){
                console.log("dfdddddddffff")
                res.json({ restatus: true,msg:'User Register Successfully!'});
            }else{
                res.json({ restatus: false,msg:'User already Register Successfully!'});
            }
        }else{
            console.log("HLELLLL")
            res.json({ restatus: false,msg:'User already Register Successfully!'});
        } 
        
    } catch (error) {
        console.log("errrrrr ",error)
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");
        //res.status(config.INTERNAL_SERVER_ERROR).json(error);

        res.json({ restatus: false,msg:error});
        //res.status(config.INTERNAL_SERVER_ERROR).json(error);

    }
});



/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.delete('/DeleteUser/:id', async (req, res) => {
    try {
        console.log("req ", req.params.id)

        const RecentUser = await Users.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })

        logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/addMoney', async (req, res) => {
    try {
        console.log("Add Money ", req.body)
        //userId
        // 
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})
        if(req.body.userId != undefined && req.body.type != undefined && req.body.money != undefined){

            const UserData = await Users.find({_id:new mongoose.Types.ObjectId(req.body.userId)}, { sckId:1 })
            console.log("UserData ",UserData)
            if(UserData != undefined &&  UserData[0].sckId != undefined){

                
                await walletActions.addWalletAdmin(req.body.userId,Number(req.body.money),3,req.body.type,{},{id:UserData.sckId},-1);
            }

            res.json({ status: "ok" });
        }else{
            console.log("false")
            res.json({ status: false });
        }

        logger.info('admin/dahboard.js post dahboard  error => ');

        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {post} /admin/deductMoney
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/deductMoney', async (req, res) => {
    try {
        console.log("deductMoney ", req.body)
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        if(req.body.userId != undefined && req.body.type != undefined && req.body.money != undefined){

            const UserData = await Users.find({_id:new mongoose.Types.ObjectId(req.body.userId)}, { sckId:1 })
            console.log("UserData ",UserData)
            if(UserData != undefined &&  UserData[0].sckId != undefined){

                
                await walletActions.deductWalletAdmin(req.body.userId,-Number(req.body.money),4,req.body.type,{},{id:UserData.sckId},-1);
            }

            res.json({ status: "ok" });
        }else{
            console.log("false")
            res.json({ status: false });
        }

        logger.info('admin/dahboard.js post dahboard  error => ');

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/K
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/kycInfoList', async (req, res) => {
    try {
        console.log("kycInfo ", req.query)
        let wh = {} 

        if(req.query != undefined && req.query.status != undefined && req.query.status == "Pendding"){
            wh = {$or:[{verified:false},{pancardverified:false}],adharcard:"",Pancard:""}
        }else if(req.query != undefined && req.query.status != undefined && req.query.status == "Approved"){
            wh = {verified:true,pancardverified:true}
        }else{
            wh = {$or:[{verified:false,adharcard:{$ne:""}},{pancardverified:false,Pancard:{$ne:""}}]}
        }    

        console.log("wh ::::::::",wh)
        let kycInfoList = await otpAdharkyc.find(wh,{})

     
        console.log("kycInfoList ",kycInfoList)
        logger.info('admin/dahboard.js post dahboard  error => ',kycInfoList);

        res.json({ kycInfoList });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {post} /admin/KycUpdate
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/KycUpdate', async (req, res) => {
    try {

        console.log("req ", req.body)
        //currently send rendom number and generate 
        let response = {
            $set: {
                adminremark: req.body.adminremark,
                adminremarkcd:new Date()
            }
        }

        console.log("response ", response)

        console.log("response ", req.body)


        const userInfo = await otpAdharkyc.findOneAndUpdate({ userId: new mongoose.Types.ObjectId(req.body.userId) }, response, { new: true });

        logger.info('admin/KycUpdate.js post KycUpdate  error => ', userInfo);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/KycUpdate.js postKycUpdate error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

async function createPhoneNumber() {
    const countryCode = "91";

    // Generate a random 9-digit mobile number
    const randomMobileNumber = Math.floor(Math.random() * 9000000000) + 1000000000;

    // Concatenate the country code and the random mobile number
    const indianMobileNumber = countryCode + randomMobileNumber;

    return indianMobileNumber;
}

module.exports = router;