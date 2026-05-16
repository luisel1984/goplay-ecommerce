import { verifyAccessToken } from '../lib/jwt.js';
export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
        return res.status(401).json({ error: 'unauthorized' });
    try {
        req.user = verifyAccessToken(auth.slice(7));
        next();
    }
    catch {
        res.status(401).json({ error: 'invalid_token' });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'unauthorized' });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: 'forbidden' });
        next();
    };
}
export function optionalAuth(req, _res, next) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
        try {
            req.user = verifyAccessToken(auth.slice(7));
        }
        catch { }
    }
    next();
}
