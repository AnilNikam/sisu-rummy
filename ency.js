const crypto = require('crypto');

// Function to encrypt data using AES/CBC/PKCS5PADDING
function encrypt(key, initVector, value) {
    try {
        const iv = Buffer.from(initVector, 'utf-8');
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
        let encrypted = cipher.update(JSON.stringify(value), 'utf-8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (ex) {
        console.error("Encryption error:", ex);
        return null;
    }
}

// Function to decrypt data using AES/CBC/PKCS5PADDING
function decrypt(key, initVector, encryptedValue) {
    try {
        const iv = Buffer.from(initVector, 'utf-8');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), iv);
        let decrypted = decipher.update(encryptedValue, 'base64', 'utf-8');
        decrypted += decipher.final('utf-8');
        return decrypted;
    } catch (ex) {
        console.error("Decryption error:", ex);
        return null;
    }
}

// JSON data to be encrypted
const value = {
    "AuthID": "M00006477",
    "AuthKey": "bT2hi6oE4Tk4SX6pR3xC7QQ4rD3ci7XC",
    "CustRefNum": "2308201815464535031467206781",
    "txn_Amount": "15.00",
    "PaymentDate": "2024-03-26 14:59:02",
    "ContactNo": "8653826902",
    "EmailId": "test@test.com",
    "IntegrationType": "seamless",
    "CallbackURL": "http://rummylegit.com:3000/api/PayinAPI/Payinnotify",
    "adf1": "NA",
    "adf2": "NA",
    "adf3": "NA",
    "MOP": "UPI",
    "MOPType": "UPI",
    "MOPDetails": "I"
};

// Secret key and IV (first 16 characters of AuthKey)
const key = 'bT2hi6oE4Tk4SX6pR3xC7QQ4rD3ci7XC';
const initVector = Buffer.from(value.AuthKey.slice(0, 16), 'utf-8');

// Encrypt the JSON data
const encryptedValue = encrypt(key, initVector, value);
console.log("Encrypted string: =>", encryptedValue);

// Decrypt the encrypted data
const decryptedValue = decrypt(key, initVector, encryptedValue);
console.log("\n Decrypted string: =>", decryptedValue);
