const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
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
const UserReferTracks = mongoose.model('userReferTracks');
const walletActions = require('../../helper/common-function/walletTrackTransaction');

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

        const userList = await Users.find({ isBot: false }, {
            username: 1, avatar: 1, profileUrl: 1, winningChips: 1, bonusChips: 1, id: 1, email: 1, uniqueId: 1, name: 1,
            "blackandwhite.totalMatch": 1, "aviator.totalMatch": 1, mobileNumber: 1, "counters.totalMatch": 1, isVIP: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1
        }).sort({ createdAt: -1 })
        logger.info('UserList=> ', userList);

        res.json({ userList });
    } catch (error) {
        logger.error('admin/UserList error => ', error);
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
        logger.info('requet => ', req.query);
        //userInfo
        const userInfo = await Users.findOne({ _id: new mongoose.Types.ObjectId(req.query.userId) }, { name: 1, winningChips: 1, bonusChips: 1, username: 1, id: 1, loginType: 1, profileUrl: 1, mobileNumber: 1, email: 1, uniqueId: 1, "counters.totalMatch": 1, deviceType: 1, location: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1, avatar: 1, isBlock: 1 })

        console.log("userInfo :::::::::::::::::::", userInfo)

        userInfo.winningChips = userInfo.winningChips != undefined ? userInfo.winningChips.toFixed(2) : 0
        userInfo.bonusChips = userInfo.bonusChips != undefined ? userInfo.bonusChips.toFixed(2) : 0
        userInfo.chips = userInfo.chips != undefined ? userInfo.chips.toFixed(2) : 0


        let UserOKYC = await otpAdharkyc.findOne({ userId: new mongoose.Types.ObjectId(req.query.userId) },
            {
                adharcard: 1, verified: 1,
                adharcardHypervergemark: 1, adharcardadminverified: 1,
                "userInfo": 1, "DOB": 1, adharcardfrontimages: 1, adharcardbackimages: 1,
                pancardname: 1, pancardfrontimages: 1, pancard: 1, "panInfo": 1, pancardverified: 1, panHypervergemark: 1, pancardadminverified: 1, adminremark: 1, adminname: 1
            })
        console.log("UserOKYC", UserOKYC)

        let UserOKYCData = {
            adharcard: " - ",
            full_name: "",
            verified: "",
            userInfo: "",
            DOB: "",
            gender: "",
            pincode: "",
            adharcardfrontimages: "",
            adharcardbackimages: "",
            adharcardHypervergemark: "",
            adharcardadminverified: "",
            adminremark: "",
            adminname: ""
        }
        UserOKYCData.adharcard = (UserOKYC != undefined && UserOKYC.adharcard != undefined) ? UserOKYC.adharcard : "-";
        UserOKYCData.full_name = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_full_name != undefined) ? UserOKYC.userInfo.user_full_name : "-";

        UserOKYCData.verified = (UserOKYC != undefined && UserOKYC.verified != undefined) ? UserOKYC.verified : "-";
        UserOKYCData.adharcardfrontimages = (UserOKYC != undefined && UserOKYC.adharcardfrontimages != undefined) ? UserOKYC.adharcardfrontimages : "-";
        UserOKYCData.adharcardbackimages = (UserOKYC != undefined && UserOKYC.adharcardbackimages != undefined) ? UserOKYC.adharcardbackimages : "-";


        UserOKYCData.DOB = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_dob != undefined) ? UserOKYC.userInfo.user_dob : "-";
        UserOKYCData.gender = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_gender != undefined) ? UserOKYC.userInfo.user_gender : "-";
        UserOKYCData.userInfo = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_address != undefined) ?
            "" + UserOKYC.userInfo.user_address.house + "," + UserOKYC.userInfo.user_address.street + "," + UserOKYC.userInfo.user_address.po + "," + UserOKYC.userInfo.user_address.loc + ","
            + UserOKYC.userInfo.user_address.vtc + "," + UserOKYC.userInfo.user_address.dist + "," + UserOKYC.userInfo.user_address.state + "," + UserOKYC.userInfo.user_address.country + "" : "Not Available";

        UserOKYCData.pincode = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.address_zip != undefined) ? UserOKYC.userInfo.address_zip : "-"


        UserOKYCData.adharcardHypervergemark = (UserOKYC != undefined && UserOKYC.adharcardHypervergemark != undefined && UserOKYC.adharcardHypervergemark != undefined) ? UserOKYC.adharcardHypervergemark : "-";
        UserOKYCData.adharcardadminverified = (UserOKYC != undefined && UserOKYC.adharcardadminverified != undefined && UserOKYC.adharcardadminverified != undefined) ? UserOKYC.adharcardadminverified : "-";
        UserOKYCData.adminremark = (UserOKYC != undefined && UserOKYC.adminremark != undefined && UserOKYC.adminremark != undefined) ? UserOKYC.adminremark : "-";
        UserOKYCData.adminname = (UserOKYC != undefined && UserOKYC.adminname != undefined && UserOKYC.adminname != undefined) ? UserOKYC.adminname : "-";



        PanOKYCData = {
            pancardname: "",
            pancard: "",
            verified: "",
            DOB: "",
            full_name: "",
            pancardfrontimages: "",
            pancardverified: "",
            panHypervergemark: "",
            pancardadminverified: "",
            adminremark: "",
            adminname: ""
        }

        PanOKYCData.pancard = (UserOKYC != undefined && UserOKYC.pancard != undefined) ? UserOKYC.pancard : "-";
        PanOKYCData.pancardname = (UserOKYC != undefined && UserOKYC.pancardname != undefined) ? UserOKYC.pancardname : "-";
        PanOKYCData.pancardfrontimages = (UserOKYC != undefined && UserOKYC.pancardfrontimages != undefined) ? UserOKYC.pancardfrontimages : "-";
        PanOKYCData.verified = (UserOKYC != undefined && UserOKYC.pancardverified != undefined) ? UserOKYC.pancardverified : "-";
        PanOKYCData.full_name = (UserOKYC != undefined && UserOKYC.panInfo != undefined && UserOKYC.panInfo.user_full_name != undefined) ? UserOKYC.panInfo.user_full_name : "-";
        PanOKYCData.DOB = (UserOKYC != undefined && UserOKYC.userInfo != undefined && UserOKYC.userInfo.user_dob != undefined) ? UserOKYC.userInfo.user_dob : "-";
        PanOKYCData.pancardverified = (UserOKYC != undefined && UserOKYC.pancardverified != undefined && UserOKYC.pancardverified != undefined) ? UserOKYC.pancardverified : "-";
        PanOKYCData.panHypervergemark = (UserOKYC != undefined && UserOKYC.panHypervergemark != undefined && UserOKYC.panHypervergemark != undefined) ? UserOKYC.panHypervergemark : "-";
        PanOKYCData.pancardadminverified = (UserOKYC != undefined && UserOKYC.pancardadminverified != undefined && UserOKYC.pancardadminverified != undefined) ? UserOKYC.pancardadminverified : "-";
        PanOKYCData.adminremark = (UserOKYC != undefined && UserOKYC.adminremark != undefined && UserOKYC.adminremark != undefined) ? UserOKYC.adminremark : "-";
        PanOKYCData.adminname = (UserOKYC != undefined && UserOKYC.adminname != undefined && UserOKYC.adminname != undefined) ? UserOKYC.adminname : "-";


        logger.info(':::::::: UserOKYCData ', UserOKYCData);
        logger.info('PanOKYCData  => :::::::: PanOKYCData ', PanOKYCData);

        res.json({ userInfo, UserOKYCData, PanOKYCData });
    } catch (error) {
        logger.error('admin/UserData error => ', error);
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
        //userInfo
        const userBankInfo = await BankDetails.findOne({ userId: new mongoose.Types.ObjectId(req.query.userId) }, {})
        logger.info("userBankInfo :::::::::::::::::::", userBankInfo)

        res.json({ userBankInfo });
    } catch (error) {
        logger.error('admin/BankData error => ', error);
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
router.get('/DeviceData', async (req, res) => {
    try {
        console.log("fdffffffffffffffffffffffffffffffffffffffffffffff DeviceData")
        //userInfo
        const userDecviceInfo = await Users.findOne({ _id: new mongoose.Types.ObjectId(req.query.userId) },
         { appVersion:1,systemVersion:1,deviceName:1,deviceModel:1,operatingSystem:1,graphicsMemorySize:1,systemMemorySize:1,
            processorType:1,processorCount:1,batteryLevel:1,genuineCheckAvailable:1,platform:1,deviceType:1 })

        logger.info("userDecviceInfo :::::::::::::::::::", userDecviceInfo)

        res.json({ userDecviceInfo });
    } catch (error) {
        logger.error('admin/DeviceData error => ', error);
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
        // logger.info("req AddUser::::::::::::", req.body)

        let response = {
            mobileNumber: req.body.mobileNumber,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            isVIP: 1,
            country: req.body.country
        }

        logger.info('Register User Request Body =>', response);
        const { mobileNumber } = response;

        let query = { mobileNumber: mobileNumber };
        let result = await Users.findOne(query, {});
        if (!result) {
            let defaultData = await getUserDefaultFields(response);
            logger.info('registerUser defaultData : ', defaultData);

            let userInsertInfo = await saveGameUser(defaultData);
            logger.info('registerUser userInsertInfo : ', userInsertInfo);

            if (userInsertInfo) {
                res.json({ restatus: true, msg: 'User Register Successfully!' });
            } else {
                res.json({ restatus: false, msg: 'User already Register Successfully!' });
            }
        } else {
            res.json({ restatus: false, msg: 'User already Register Successfully!' });
        }

    } catch (error) {
        logger.error('admin/AddUser error => ', error);
        res.json({ restatus: false, msg: error });
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
        const RecentUser = await Users.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
        logger.info('admin/DeleteUser/:id RecentUser => ', RecentUser);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/DeleteUser/:id error => ', error);
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

{
  money: '1',
  txnmode: 'ReFund',
  typeofAddto: 'Main Wallet',
  type: 'Deposit',
  userId: '6623651584675d505e31963d'
}

*/
router.put('/addMoney', async (req, res) => {
    try {
        console.log("Add Money =>", req.body)

        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})
        if (req.body.userId != undefined
            && req.body.type != undefined
            && req.body.money != undefined && req.body.typeofAddto != undefined && req.body.txnmode != undefined) {

            if (req.body.typeofAddto == "Main Wallet") {
                await walletActions.addWalletPayin(req.body.userId, Number(req.body.money), 'Credit', req.body.txnmode);
            } else if (req.body.typeofAddto == "Bonus Wallet") {
                await walletActions.addWalletBonusDeposit(req.body.userId, Number(req.body.money), 'Debit', req.body.txnmode);
            } else if (req.body.typeofAddto == "Win Wallte") {
                await walletActions.addWalletWinngChpis(req.body.userId, Number(req.body.money), 'Credit', req.body.txnmode);
            }

            // const UserData = await Users.find({ _id: new mongoose.Types.ObjectId(req.body.userId) }, { sckId: 1 })
            // if (UserData != undefined && UserData[0].sckId != undefined) {
            //     await walletActions.addWalletPayin(req.body.userId, Number(req.body.money), 'Credit', 'Admin_PayIn');
            // }

            res.json({ status: "ok" });
        } else {
            console.log("false")
            res.json({ status: false });
        }

    } catch (error) {
        logger.error('admin/addMoney => ', error);
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

{
  money: '1',
  txnmode: 'ReFund',
  typeofDudctfrom: 'Main Wallet',
  type: 'Deposit',
  userId: '6623651584675d505e31963d'
}

*/
router.put('/deductMoney', async (req, res) => {
    try {
        logger.info("deductMoney ", req.body)
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        if (req.body.userId != undefined && req.body.type != undefined && req.body.money != undefined

            && req.body.typeofDudctfrom != undefined && req.body.txnmode != undefined) {

            const UserData = await Users.find({ _id: new mongoose.Types.ObjectId(req.body.userId) }, { sckId: 1, winningChips: 1, chips: 1, bonusChips: 1 })


            if (req.body.typeofDudctfrom == "Main Wallet") {
                if (UserData != undefined && UserData[0].chips != undefined && UserData[0].chips < Number(req.body.money)) {
                    res.json({ status: false });
                    return false
                }

                await walletActions.addWalletPayin(req.body.userId, - Number(req.body.money), 'Debit', req.body.txnmode);

            } else if (req.body.typeofDudctfrom == "Bonus Wallet") {

                if (UserData != undefined && UserData[0].bonusChips != undefined && UserData[0].bonusChips < Number(req.body.money)) {
                    res.json({ status: false });
                    return false
                }

                await walletActions.addWalletBonusDeposit(req.body.userId, - Number(req.body.money), 'Debit', req.body.txnmode);
            } else if (req.body.typeofDudctfrom == "Win Wallte") {

                if (UserData != undefined && UserData[0].winningChips != undefined && UserData[0].winningChips < Number(req.body.money)) {
                    res.json({ status: false });
                    return false
                }

                await walletActions.deductWalletPayOut(req.body.userId, -Number(req.body.money), 'Debit', req.body.txnmode);
            }





            // if (UserData != undefined && UserData[0].sckId != undefined) {
            //     //await walletActions.deductWalletAdmin(req.body.userId, -Number(req.body.money), 4, req.body.type, {}, { id: UserData.sckId }, -1);
            //     await walletActions.deductWalletPayOut(req.body.userId, -Number(req.body.money), 'Debit', 'Admin_PayOut');
            // }

            res.json({ status: "ok" });
        } else {
            res.json({ status: false });
        }

    } catch (error) {
        logger.error('admin/deductMoney error => ', error);
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
router.put('/blockandunblock', async (req, res) => {
    try {
        console.log("blockandunblock ", req.body)
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        if (req.body.userId != undefined && req.body.isblock != undefined) {

            await Users.updateOne({ _id: new mongoose.Types.ObjectId(req.body.userId) }, { $set: { isBlock: req.body.isblock } })

            res.json({ status: "ok" });
        } else {
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
        logger.info("kycInfo =>", req.query)
        let wh = {}

        if (req.query != undefined && req.query.status != undefined && req.query.status == "Pendding") {

            wh = { $or: [{ verified: false }, { pancardverified: false }], adharcard: "", pancard: "" }

        } else if (req.query != undefined && req.query.status != undefined && req.query.status == "Approved") {

            wh = { $or: [{ verified: true, pancardverified: true }, { adharcardadminverified: true, pancardadminverified: true }] }

        } else {

            wh = {
                $or: [{ verified: false, adharcard: { $ne: "" }, adharcardadminverified: false },
                { pancardverified: false, pancard: { $ne: "" }, pancardadminverified: false }

                ]
            }
        }

        let kycInfoList = await otpAdharkyc.find(wh, {}).sort({ createdAt: -1 })
        logger.info('kycInfoList => ', kycInfoList);

        res.json({ kycInfoList });
    } catch (error) {
        logger.error('admin/kycInfoList error => ', error);
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
                adminremarkcd: new Date(),
                verified: req.body.verified == "false" ? false : true,
                pancardverified: req.body.Pancardverified == "false" ? false : true,
                adminname: req.body.adminname
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

/**
* @api {post} /admin/KycUpdate
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/KYCUpdateprofile', async (req, res) => {
    try {

        console.log("req ", req.body)

        if (req.body.name == undefined || req.body.name == null || req.body.name == "" ||
            req.body.adharcard == undefined || req.body.adharcard == null || req.body.adharcard == "" ||
            req.body.pancardname == undefined || req.body.pancardname == null || req.body.pancardname == "" ||
            req.body.email == undefined || req.body.email == null || req.body.email == ""
        ) {
            res.json({ status: false });
            return false
        }

        //currently send rendom number and generate 
        let response = {
            $set: {
                userName: req.body.name,
                adharcard: req.body.adharcard,
                pancard: req.body.pancardname,
                adminremark: req.body.adminremark,
                adminremarkcd: new Date(),
                verified: req.body.verified == "false" ? false : true,
                pancardverified: req.body.Pancardverified == "false" ? false : true,
                adminname: req.body.adminname
            }
        }

        console.log("response ", response)

        console.log("response ", req.body)


        const userInfo = await otpAdharkyc.findOneAndUpdate({ userId: new mongoose.Types.ObjectId(req.body.userId) }, response, { new: true });

        await Users.findOneAndUpdate({ userId: new mongoose.Types.ObjectId(req.body.userId) }, { $set: { name: req.body.name, email: req.body.email } }, { new: true });


        logger.info('admin/KycUpdate.js post KycUpdate  error => ', userInfo);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/KycUpdate.js postKycUpdate error => ', error);
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
router.get('/ReferralList', async (req, res) => {
    try {
        console.info('requet => ', req);

        // const ReferralList = await UserReferTracks.find({isBot:false}, { username: 1,avatar:1,profileUrl:1,winningChips:1,bonusChips:1, id: 1,email:1,uniqueId:1,name:1,
        //     "blackandwhite.totalMatch":1,"aviator.totalMatch":1, mobileNumber: 1, "counters.totalMatch": 1, isVIP: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })


        let ReferralList = await UserReferTracks.aggregate([
            {
                $group: {

                    _id: '$userId',
                    total: {
                        $sum: 1
                    },
                    isFrist_deposit: { $push: "$isFrist_deposit" },
                    reffralStatus: { $push: "$reffralStatus" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'results'
                }
            },
            {
                $project: {
                    'total': 1,
                    'results.name': 1,
                    'isFrist_deposit': 1,
                    'reffralStatus': 1
                }
            }
        ]);


        for (var i = 0; i < ReferralList.length; i++) {
            console.log("ReferralList ::::::::::::::::", ReferralList[i])

            ReferralList[i].userName = (ReferralList[i].results.length > 0 && ReferralList[i].results[0].name != undefined) ? ReferralList[i].results[0].name : ""
            ReferralList[i].totalbonus = (ReferralList[i].results.length > 0 && ReferralList[i].results[0].reffralStatus != undefined) ?

                ReferralList[i].results[0].reffralStatus.filter(function (num) { return num == true }).length * GAMELOGICCONFIG.referralgamebonusamount

                : 0


            delete ReferralList[i].results

        }
        console.log("ReferralList ", ReferralList)

        res.json({ ReferralList });

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

router.get('/ReferralListUserWise', async (req, res) => {
    try {

        let queryid = req.query.userId

        let ReferralListData = await UserReferTracks.aggregate([
            {
                $match: {
                    userId: MongoID(queryid)
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "referalUserId",
                    foreignField: "_id",
                    as: "results"
                }
            },
            {
                $project: {
                    "reffralStatus": 1,
                    'results.name': 1,
                    'results._id': 1,

                }
            }
        ]);

        console.log("ReferralListDAta ", ReferralListData)

        for (var i = 0; i < ReferralListData.length; i++) {
            console.log("ReferralListData ::::::::::::::::", ReferralListData[i].results)

            ReferralListData[i].name = (ReferralListData[i].results.length > 0 && ReferralListData[i].results[0].name != undefined) ? ReferralListData[i].results[0].name : ""
            ReferralListData[i]._id = (ReferralListData[i].results.length > 0 && ReferralListData[i].results[0]._id != undefined) ? ReferralListData[i].results[0]._id : ""

            ReferralListData[i].bonus = (ReferralListData[i].reffralStatus != undefined && ReferralListData[i].reffralStatus) ? GAMELOGICCONFIG.referralgamebonusamount : 0

            delete ReferralListData[i].results

        }

        console.log("ReferralListDAta ", ReferralListData)


        res.json({ ReferralListData });

    } catch (error) {
        logger.error('admin/dahboard.js ReferralListData error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }

})
async function createPhoneNumber() {
    const countryCode = "91";

    // Generate a random 9-digit mobile number
    const randomMobileNumber = Math.floor(Math.random() * 9000000000) + 1000000000;

    // Concatenate the country code and the random mobile number
    const indianMobileNumber = countryCode + randomMobileNumber;

    return indianMobileNumber;
}

module.exports = router;