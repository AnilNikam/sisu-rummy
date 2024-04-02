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
    "AuthID": "M00006500",
    "AuthKey": "WW0DN9DY8ji8mE0sx9Zf4Lg1sp9xY9wF",
    "CustRefNum": "129345958962",
    "txn_Amount": "25.00",
    "PaymentDate": "2024-04-01 14:39:09",
    "ContactNo": "8128154143",
    "EmailId": "anil@gmail.com",
    "IntegrationType": "seamless",
    "CallbackURL": "http://rummylegit.com:3000/api/PayinAPI/Payinnotify",
    "adf1": "NA",
    "adf2": "NA",
    "adf3": "NA",
    "MOP": "UPI",
    "MOPType": "UPI",
    "MOPDetails": "I"
};

const yourData = JSON.stringify(value); // Convert object to string
const yourSecretKey = 'WW0DN9DY8ji8mE0sx9Zf4Lg1sp9xY9wF'; // Replace with your secret key
const yourInitializationVector = 'WW0DN9DY8ji8mE0s'; // Replace with your IV

const encryptedData = encrypt(yourData, yourSecretKey, yourInitializationVector);
console.log('Encrypted data:', encryptedData);

// JSON data to be decrypted
const receivedEncryptedData = encryptedData; // Replace with the actual encrypted data you received

const decryptedData = decrypt(receivedEncryptedData, yourSecretKey, yourInitializationVector);
console.log('Decrypted data:', decryptedData);
