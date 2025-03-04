exports.login = async (req, res, next) => {
    try {
        // existing login logic...
        
        // Example of logging the user input for debugging
        console.log('Login attempt with:', req.body);

        // existing login logic...
    } catch (error) {
        console.error('Login error:', error); // Log the error for debugging
        return next(new AppError('We encountered an issue while logging you in. Please try again later.', 500));
    }
}; 