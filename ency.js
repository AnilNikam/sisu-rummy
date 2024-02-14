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
    "CallbackURL": "http://rummylegit.com:3000/admin/responce",
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


data = "7BTY6h+xdqHM4dxiV6kDpjGVGHQynhQetNQ/oH0XVnnu5Ln5Tj80z+37YMgVuefMom4PCn5yfp+pffgoB6uIIrqwcYa8OPp4fntT3y18uDPyjYCRSBQRQhUhbUj+jETewhcH33ZB4cKRcfFIv2yMnuCD+ZX1NICKq+iA0s9Tau0PvM9Eh6Vdie4Le2qE+yeygw9tbbP48GcQL78pE8FM3z3JLAX3uWJBnthpkv2P/AUr4qWOhZmouSnVPEXRFZd5VZho91SUUzUrai0czkuytHFadZgrmqEXKSdtSyOLGLq8uyzZloeGezQK1Vqu5YLz7yvoJ2ZMfKnLWQPOJatAUCnN5g/BRyWrGpQ9fMCJKR2bpFXH9myMLZqI/G2v42NXs3it0hXRF+uTat2Ai2edGD+O9VJgLm2I5QSQyNCaoN8L4jM1Rh+OfLU35NT8hvf3Up9zqX3lXhjU2XUFfp6+NHz08/224Ka9EXXfKOFNvqyKHGvLmPokd6wSfhdprPyutD7TCkIDUdXKG84CiPEidiAF4QRFEuDahYAUK2xV1D2f7Bo4NRztBQymqNzCmBQTDMrHnpghaJc6SA6PVoAenns9oiDpb5o3ElNSfCwNLRCn0vzQsv4odeWyS0XwirM0"
//AES decryption
const decrypted = decrypt(Buffer.from(data, "base64"), securitykey, "utf8", iv)
console.log("Decrypted string:", decrypted);


//AES decryption
function decrypt(cipherText, securitykey, outputEncoding, iv) {
    const cipher = crypto.
        createDecipheriv("aes-256-cbc", securitykey, iv);
        
    return Buffer.
        concat([cipher.update(cipherText), cipher.final()]).
        toString(outputEncoding);
}