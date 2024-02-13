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

// Secret key and IV provided
const secretKey = Buffer.from(iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ, 'utf-8');
const authKey = iS5JK0cz6GU9IW2cU6kj1tA6Vv5ZA7sZ; // assuming this is a string
const iv = Buffer.from(authKey.substring(0, 16), 'utf-8'); // take the first 16 characters of authKey

// Create cipher
const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);

// Update and finalize the encryption
let encryptedData = cipher.update(jsonData, 'utf-8', 'base64');
encryptedData += cipher.final('base64');

console.log('Encrypted data:', encryptedData);