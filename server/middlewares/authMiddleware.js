import jwt from 'jsonwebtoken'

const project = async (req, res, next) => {
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({ message: 'Unauthorized'})
    }
    try{
        const decoded = jwt.verified(token, process.env.JWT_Secret)
        req.userId = decoded.userId
        next();
    }catch (error) {
         return res.status(401).json({ message: 'Unauthorized'})
    }
}

export default project;