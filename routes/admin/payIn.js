const crypto = require('crypto');
const express = require('express');
const ejs = require('ejs');
const router = express.Router();
const logger = require('../../logger');

const algorithm = "aes-128-cbc";
const authKey = "0jeOYcu3UnfmWyLC";
const authIV = "C28LAmGxXTqmK0QJ";

router.post("/initPgReq", (req, res) => {
    try {
        logger.info("req.body-->", req.body);
        let { customerName, customerEmail, customerPhone, customerAmount } = req.body
        let payerName = customerName;
        let payerEmail = customerEmail;
        let payerMobile = customerPhone;
        let clientTxnId = randomStr(20, "12345abcde");
        let amount = customerAmount;
        let clientCode = "TM001";       // Please use the credentials shared by your Account Manager  If not, please contact your Account Manage
        let transUserName = "spuser_2013";      // Please use the credentials shared by your Account Manager  If not, please contact your Account Manage
        let transUserPassword = "RIADA_SP336";   // Please use the credentials shared by your Account Manager  If not, please contact your Account Manage
        const callbackUrl = "http://192.168.0.105:3001/admin/pay/getPgRes";
        const channelId = "W";
        const spURL = "https://stage-securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1"; // Staging environment
        //let spURL = "https://uatsp.sabpaisa.in/SabPaisa/sabPaisaInit"; // UAT environment
        //  let spDomain = 'https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit'; // production environment

        let mcc = "5666";
        let transData = new Date();

        let stringForRequest =
            "payerName=" +
            payerName +
            "&payerEmail=" +
            payerEmail +
            "&payerMobile=" +
            payerMobile +
            "&clientTxnId=" +
            clientTxnId +
            "&amount=" +
            amount +
            "&clientCode=" +
            clientCode +
            "&transUserName=" +
            transUserName +
            "&transUserPassword=" +
            transUserPassword +
            "&callbackUrl=" +
            callbackUrl +
            "&channelId=" +
            channelId +
            "&mcc=" +
            mcc +
            "&transData=" +
            transData;

        logger.info("stringForRequest :: " + stringForRequest);

        let encryptedStringForRequest = sabPaisaEncrypt(stringForRequest);
        logger.info("encryptedStringForRequest :: " + encryptedStringForRequest);

        const formData = {
            spURL: spURL,
            encData: encryptedStringForRequest,
            clientCode: clientCode,
        };

        res.render('admin/pg-form-request.html', { formData: formData });
        // Render the HTML form as a string
        // ejs.renderFile(path.join(__dirname, '../views/admin/pg-form-request.html'), { formData: formData }, (err, html) => {
        //     if (err) {
        //         logger.error('Error rendering EJS:', err);
        //         return res.status(500).send('Error rendering form');
        //     }

        //     // Send the rendered HTML form as a response
        //     res.send(html);
        // });


    } catch (error) {
        logger.error('Error sabpaisa initiating payment:', error.response ? error.response.data : error.message);

        // commandAcions.sendEvent(socket, CONST.PAY_IN, {}, false, 'Something Went Wrong Please try again');

        throw error; // Throw the error to be caught by the caller
    }
})

router.post('/getPgRes', async (req, res) => {
    try {
        logger.info('\n::::::::::::> Sab paisa Request Request => ', req);
        logger.info('\n::::::::::::> Sab paisa Request Body => ', req.body);

        let body = "";
        req.on("data", function (data) {
            body += data;
            logger.info("sabpaisa response :: " + body);
            let decryptedResponse = sabPaisaDecrypt(
                decodeURIComponent(body.split("&")[1].split("=")[1])
            );
            logger.info("decryptedResponse :: " + decryptedResponse);

            res.render('admin/pg-form-response.html', {
                decryptedResponse: decryptedResponse,
            });
        });

        res.send("ok");
    } catch (error) {
        logger.error("Error processing webhook request: ", error);
        res.status(500).send("Internal Server Error");
    }
});

function sabPaisaEncrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(authKey), authIV);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString("base64");
}

function sabPaisaDecrypt(text) {
    // let iv = Buffer.from(text.iv, 'hex');
    // let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(authKey),
        authIV
    );
    let decrypted = decipher.update(Buffer.from(text, "base64"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function randomStr(len, arr) {
    let ans = "";
    for (let i = len; i > 0; i--) {
        ans += arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
}


module.exports = router