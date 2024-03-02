const mongoose = require('mongoose');
const PlayingTable = mongoose.model('playingTable');
const Users = mongoose.model('users');

const express = require('express');
const router = express.Router();
const config = require('../../config');
const logger = require('../../logger');

/**
* @api {get} /admin/delete/DeletePlaying
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/DeletePlaying', async (req, res) => {
    try {
        // let dummy = [{
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'KARAN_CHAKRABORTY',
        //     name: 'Karan Chakraborty',
        //     mobileNumber: '85641331359',
        //     uniqueId: 'USER_93534244145',
        //     avatar: '6',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'VIRAT_SRINIVASAN',
        //     name: 'Virat Srinivasan',
        //     mobileNumber: '85255981227',
        //     uniqueId: 'USER_13053488110',
        //     avatar: '5',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'DHRUV_MENON',
        //     name: 'Dhruv Menon',
        //     mobileNumber: '85887415595',
        //     uniqueId: 'USER_34564664421',
        //     avatar: '2',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'RADHA_SINGH',
        //     name: 'Radha Singh',
        //     mobileNumber: '85330379674',
        //     uniqueId: 'USER_33768670172',
        //     avatar: '6',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'SONALI_NAIDU',
        //     name: 'Sonali Naidu',
        //     mobileNumber: '85522458712',
        //     uniqueId: 'USER_91290662232',
        //     avatar: '4',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'KOMAL_RANGANATHAN',
        //     name: 'Komal Ranganathan',
        //     mobileNumber: '85539021493',
        //     uniqueId: 'USER_42035248222',
        //     avatar: '6',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'LEELA_KHANNA',
        //     name: 'Leela Khanna',
        //     mobileNumber: '85950826204',
        //     uniqueId: 'USER_62965855799',
        //     avatar: '8',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // },
        // {
        //     flags: { isOnline: 0 },
        //     email: '',
        //     panNo: '',
        //     location: '',
        //     password: '',
        //     deviceType: 'Android',
        //     loginType: 'Mobile',
        //     tableId: '',
        //     status: '',
        //     deviceId: 'ROBOT',
        //     username: 'ANUSHA_KRISHNAN',
        //     name: 'Anusha Krishnan',
        //     mobileNumber: '85680811845',
        //     uniqueId: 'USER_28408279663',
        //     avatar: '5',
        //     chips: 20000,
        //     winningChips: 0,
        //     isBot: true,
        //     isFree: true,
        //     referralCode: '',
        //     sckId: ''
        // }]



        // const result = await Users.insertMany(dummy);
        // logger.info(`${result.insertedCount} documents inserted successfully`);

        await Users.updateMany(
            { "isfree": false }, // Filter to match documents where isfree is false
            { $set: { "isfree": true } } // Update to set isfree to true
        );

        await PlayingTable.deleteMany({})

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/DeletePlaying.js  error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

function genratename() {
    // Original names array
    const names = [
        "Arjun Patel", "Priya Sharma", "Rohan Gupta", "Neha Singh", "Aarav Kumar",
        "Aisha Mehta", "Vikram Shah", "Pooja Mishra", "Kabir Reddy", "Nisha Verma",
        "Yuvraj Desai", "Anjali Choudhury", "Aditya Banerjee", "Ritu Rao", "Dhruv Menon",
        "Kavita Joshi", "Siddharth Patel", "Sunita Singhania", "Aryan Iyer", "Divya Mehra",
        "Vedant Malhotra", "Meera Pillai", "Ravi Nair", "Jyoti Venkatraman", "Krish Acharya",
        "Sonali Naidu", "Virat Srinivasan", "Simran Chawla", "Kartik Kapoor", "Leela Khanna",
        "Dev Bhatia", "Kirti Ranganathan", "Arnav Mukherjee", "Geeta Krishnamurthy", "Ansh Chatterjee",
        "Maya Rao", "Aadi Dhawan", "Ananya Iyengar", "Samar Natarajan", "Kajal Vaidya", "Rohit Shah",
        "Sapna Choudhury", "Raj Khatri", "Deepika Balasubramanian", "Shaan Mahajan", "Tanvi Hegde",
        "Karan Chakraborty", "Bhavna Jain", "Avi Gupta", "Rani Dube", "Armaan Sharma", "Tara Deshpande",
        "Manav Kumar", "Suman Sharma", "Avinash Suresh", "Anita Menon", "Vivaan Mathur", "Madhu Reddy",
        "Aarush Varma", "Sangeeta Mehra", "Pranav Agarwal", "Priyanka Patil", "Neel Iyer", "Shikha Rajan",
        "Akash Singh", "Nehal Malhotra", "Vihaan Kapoor", "Sujata Desai", "Ayaan Sharma", "Vandana Nair",
        "Abhay Gupta", "Jaya Menon", "Ishan Patel", "Shreya Sengupta", "Rohan Mehra", "Poonam Natarajan",
        "Rishi Suri", "Tanuja Venkatesh", "Ankit Singhania", "Asha Kapoor", "Parth Khurana", "Shalini Reddy",
        "Mohit Sharma", "Tara Menon", "Viren Chatterjee", "Anusha Krishnan", "Utkarsh Verma", "Radha Singh",
        "Ved Sharma", "Aarti Gupta", "Aadi Mehra", "Roshni Rao", "Vihaan Joshi", "Priya Iyer", "Sahil Malhotra",
        "Sonia Agarwal", "Rudra Kapoor", "Komal Ranganathan", "Lakshya Patel", "Diya Sharma"
    ];

    // Function to shuffle an array
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Shuffle the original names array to randomize the order
    const shuffledNames = shuffleArray(names);

    // Slice the shuffled array to get the first 200 unique names
    const uniqueNames = shuffledNames.slice(0, 200);

    console.log(uniqueNames);


}

function genrateBot() {
    const names = [
        "Arjun Patel", "Priya Sharma", "Rohan Gupta", "Neha Singh", "Aarav Kumar",
        "Aisha Mehta", "Vikram Shah", "Pooja Mishra", "Kabir Reddy", "Nisha Verma",
        "Yuvraj Desai", "Anjali Choudhury", "Aditya Banerjee", "Ritu Rao", "Dhruv Menon",
        "Kavita Joshi", "Siddharth Patel", "Sunita Singhania", "Aryan Iyer", "Divya Mehra",
        "Vedant Malhotra", "Meera Pillai", "Ravi Nair", "Jyoti Venkatraman", "Krish Acharya",
        "Sonali Naidu", "Virat Srinivasan", "Simran Chawla", "Kartik Kapoor", "Leela Khanna",
        "Dev Bhatia", "Kirti Ranganathan", "Arnav Mukherjee", "Geeta Krishnamurthy", "Ansh Chatterjee",
        "Maya Rao", "Aadi Dhawan", "Ananya Iyengar", "Samar Natarajan", "Kajal Vaidya", "Rohit Shah",
        "Sapna Choudhury", "Raj Khatri", "Deepika Balasubramanian", "Shaan Mahajan", "Tanvi Hegde",
        "Karan Chakraborty", "Bhavna Jain", "Avi Gupta", "Rani Dube", "Armaan Sharma", "Tara Deshpande",
        "Manav Kumar", "Suman Sharma", "Avinash Suresh", "Anita Menon", "Vivaan Mathur", "Madhu Reddy",
        "Aarush Varma", "Sangeeta Mehra", "Pranav Agarwal", "Priyanka Patil", "Neel Iyer", "Shikha Rajan",
        "Akash Singh", "Nehal Malhotra", "Vihaan Kapoor", "Sujata Desai", "Ayaan Sharma", "Vandana Nair",
        "Abhay Gupta", "Jaya Menon", "Ishan Patel", "Shreya Sengupta", "Rohan Mehra", "Poonam Natarajan",
        "Rishi Suri", "Tanuja Venkatesh", "Ankit Singhania", "Asha Kapoor", "Parth Khurana", "Shalini Reddy",
        "Mohit Sharma", "Tara Menon", "Viren Chatterjee", "Anusha Krishnan", "Utkarsh Verma", "Radha Singh",
        "Ved Sharma", "Aarti Gupta", "Aadi Mehra", "Roshni Rao", "Vihaan Joshi", "Priya Iyer", "Sahil Malhotra",
        "Sonia Agarwal", "Rudra Kapoor", "Komal Ranganathan", "Lakshya Patel", "Diya Sharma"
    ];

    const getRandomMobileNumber = () => {
        const prefix = "85"; // Sample prefix
        const randomDigits = Math.floor(100000000 + Math.random() * 900000000); // Random 9-digit number
        return prefix + randomDigits;
    };

    const getRandomAvatar = () => {
        return Math.floor(Math.random() * 8) + 1; // Random number between 1 and 8
    };

    const generateUserData = (name) => {
        const username = name.replace(/\s+/g, '_').toUpperCase(); // Convert name to uppercase and replace spaces with underscores
        const mobileNumber = getRandomMobileNumber();
        const avatar = getRandomAvatar();

        return {
            flags: {
                isOnline: 0
            },
            email: "",
            panNo: "",
            location: "",
            password: "",
            deviceType: "Android",
            loginType: "Mobile",
            tableId: "",
            status: "",
            deviceId: "ROBOT",
            username: username,
            name: name,
            mobileNumber: mobileNumber,
            uniqueId: `USER_${Math.floor(10000000000 + Math.random() * 90000000000)}`, // Random 11-digit number
            avatar: avatar.toString(), // Convert to string
            chips: 20000,
            winningChips: 0,
            isBot: true,
            isFree: true,
            referralCode: "",
            sckId: "",

        };
    };

    const userData = names.map(name => generateUserData(name));

    console.log(
        "userData", userData)
    // Now, userData array contains 100 JSON objects with unique names, usernames, mobile numbers, and random avatars

}
module.exports = router;
