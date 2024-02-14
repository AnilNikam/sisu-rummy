const crypto = require('crypto');

// JSON data to encrypt
const jsonData = {
    "txn_Amount": 10,
    "PaymentDate": "2018-08-23 19:07:02",
    "customer_name": "gamehome technology private limited",
    "EmailId": "s@s.com",
    "ConatctNo": "8866672045",
    "CustRefNum": "65c5adf605df6b0f2d264140",
    "AuthID": "M00006450",
    "AuthKey": "iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ",
    "CallbackURL": " https://merchant.ecom/merchantResponse.jsp",
    "adf1": "NA",
    "adf2": "NA",
    "adf3": "NA",
    "MOP": "UPI",
    "MOPType": "UPI",
    "MOPDetails": "I",
    "IntegrationType": "nonseamless or seamless"
}

// // Secret key and IV provided
// const secretKey = "iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ"//Buffer.from("iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ", 'utf-8');
// const authKey = "iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ"; // assuming this is a string
// const iv = Buffer.from(authKey.substring(0, 16), 'utf-8'); // take the first 16 characters of authKey

// console.log("iv ",iv)
// // Create cipher
// const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);

// // Update and finalize the encryption
// let encryptedData = cipher.update(jsonData.toString(), 'utf-8', 'base64');
// encryptedData += cipher.final('base64');

// console.log('Encrypted data:', encryptedData);


//AES 256 Encryption Demo Program
// crypto module

// encrypt the message
function encrypt(plainText, securitykey, outputEncoding, iv) {
    const cipher = crypto.
        createCipheriv("aes-256-cbc", securitykey, iv);
    return Buffer.
        concat([cipher.update(plainText), cipher.final()]).
        toString(outputEncoding);
}


// generate 16 bytes of random data
const iv = Buffer.from("iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ".substring(0, 16), 'utf-8');

// secret key generate 32 bytes of random data
const securitykey = Buffer.from("iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ", 'utf-8'); //crypto.randomBytes(32);

// protected data
const secretMessage = JSON.stringify({
    "txn_Amount": 10,
    "PaymentDate": "2018-08-23 19:07:02",
    "customer_name": "gamehome technology private limited",
    "EmailId": "s@s.com",
    "ConatctNo": "8866672045",
    "CustRefNum": "65c5adf605df6b0f2d264140",
    "AuthID": "M00006450",
    "AuthKey": "iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ",
    "CallbackURL": " http://rummylegit.com:3000/",
    "adf1": "NA",
    "adf2": "NA",
    "adf3": "NA",
    "MOP": "UPI,",
    "MOPType": "UPI",
    "MOPDetails": "I",
    "IntegrationType": "nonseamless or seamless"
})

//AES encryption
const encrypted =
    encrypt(secretMessage, securitykey, "base64", iv);
console.log("Encrypted message:", encrypted);



var des
//AES decryption
const decrypted = decrypt(Buffer.from(encrypted, "base64"), securitykey, "utf8", iv)
console.log("Decrypted string:", decrypted);


//AES decryption
function decrypt(cipherText, securitykey, outputEncoding, iv) {
    const cipher = crypto.
        createDecipheriv("aes-256-cbc", securitykey, iv);
    return Buffer.
        concat([cipher.update(cipherText), cipher.final()]).
        toString(outputEncoding);
}