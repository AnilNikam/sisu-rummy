const crypto = require('crypto');

// Function to encrypt data using AES/CBC/PKCS5PADDING
function encrypt(data, key, iv) {
    try {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(data, 'utf8', 'base64'); // Update with base64 encoding
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw error; // Re-throw for handling in caller
    }
}

// Function to decrypt data using AES/CBC/PKCS5PADDING
function decrypt(encryptedData, key, iv) {
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw error; // Re-throw for handling in caller
    }
}



// JSON data to be encrypted
const value = {
    "AuthID": "M00006477",
    "AuthKey": "bT2hi6oE4Tk4SX6pR3xC7QQ4rD3ci7XC",
    "CustRefNum": "379638433345596826",
    "txn_Amount": "25.00",
    "PaymentDate": "2024-03-26 14:59:02",
    "ContactNo": "8128154143",
    "EmailId": "anil@gmail.com",
    "IntegrationType": "seamless",
    "CallbackURL": "http://localhost:3000/api/PayinAPI/Payinnotify",
    "adf1": "NA",
    "adf2": "NA",
    "adf3": "NA",
    "MOP": "UPI",
    "MOPType": "UPI",
    "MOPDetails": "I"
};

const yourData = JSON.stringify(value); // Convert object to string
const yourSecretKey = 'bT2hi6oE4Tk4SX6pR3xC7QQ4rD3ci7XC'; // Replace with your secret key
const yourInitializationVector = 'bT2hi6oE4Tk4SX6p'; // Replace with your IV

const encryptedData = encrypt(yourData, yourSecretKey, yourInitializationVector);
console.log('Encrypted data:', encryptedData);

// JSON data to be decrypted
const receivedEncryptedData = encryptedData; // Replace with the actual encrypted data you received

const decryptedData = decrypt(receivedEncryptedData, yourSecretKey, yourInitializationVector);
console.log('Decrypted data:', decryptedData);
