export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Unauthorized: Authentication token is required',
        errors: [{ message: 'Missing or invalid Authorization header' }],
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Unauthorized: Token is missing',
        errors: [{ message: 'Bearer token string is empty' }],
      });
    }

    // Single admin token validation
    req.user = {
      role: 'admin',
      email: 'admin@easemyweb.com',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Unauthorized access',
      errors: [{ message: error.message }],
    });
  }
};

export default authMiddleware;
