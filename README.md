# 🌿 Tree Plantation Management API

A comprehensive API for managing tree plantation activities, corporate partnerships, and environmental education initiatives.

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd project-root
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory with the following variables:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 Documentation

Detailed API documentation can be found in the [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) file.

## 🛠️ Features

- **User Management**
  - Authentication & Authorization
  - Role-based access control
  - User activity tracking

- **Plantation Management**
  - Block plantations
  - Individual plantations
  - Tree species categorization

- **Corporate Partnerships**
  - Corporate profile management
  - Plantation goals tracking
  - Corporate activity logging

- **Event Management**
  - Event creation and management
  - Participant registration
  - Event reporting

- **Education Initiatives**
  - Educational content management
  - Resource sharing
  - Progress tracking

## 🔒 Security Features

- JWT Authentication
- Role-based access control
- Rate limiting
- CORS protection
- Input validation
- File upload validation
- Error logging

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Dependencies

- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- And more (see package.json)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.