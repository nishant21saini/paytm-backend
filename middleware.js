// const { JWT_SECRET } = require("./config");
// const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(403).json({});
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);
//         if(decoded.userId){
//         req.userId = decoded.userId;

//         next();}
//         else{
//             return res.status(403).json({});
//         }
//     } catch (err) {
//         return res.status(403).json({});
//     }
// };

// module.exports = {
//     authMiddleware
// }


const Config  = require("./config");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }


    const token = authHeader.split(' ')[1];


    try {
        const decoded = jwt.verify(token, Config.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token payload' });
        }
        req.userId = decoded.userId;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        console.log(err);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = {
    authMiddleware
};
