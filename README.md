# NEXUS Backend API

A Node.js backend API built with Fastify framework, providing endpoints for blogs/articles and form submissions. The project follows industry best practices with proper **separation of concerns** and **modular architecture**.

## 🚀 Features

- **Fast & Lightweight**: Built with Fastify for high performance
- **Modular Architecture**: Organized with proper separation of concerns
- **CORS Enabled**: Ready for frontend integration
- **Input Validation**: Comprehensive validation with sanitization
- **Error Handling**: Centralized error handling with meaningful responses
- **Auto-restart**: Development server with nodemon for seamless development
- **Production Ready**: Structured for scalability and maintainability

## 📁 Project Structure

```
DummyBackend/
├── nexus-core.js                    # 🎯 Server configuration & startup
├── package.json                 # 📦 Dependencies and scripts
├── README.md                    # 📖 Project documentation
├── synapses/
│   └── server.js               # ⚙️ Environment & server configuration
├── processors/
│   ├── blogController.js       # 📝 Blog business logic
│   └── formController.js       # 📋 Form submission logic
├── memory-banks/
│   └── blogsData.js           # 💾 Data models & sample data
├── pathways/
│   ├── index.js               # 🛣️ Main route registry
│   ├── blogRoutes.js          # 🛣️ Blog-related endpoints
│   └── formRoutes.js          # 🛣️ Form-related endpoints
├── toolkit/
│   └── validation.js          # 🔧 Validation utilities
└── interceptors/              # 🔒 Custom middleware (ready for expansion)
```

## 📋 API Endpoints

### Blogs/Articles

#### Get All Blogs
```http
GET /api/blogs
```

**Query Parameters:**
- `author` (optional): Filter by author name
- `tag` (optional): Filter by tag
- `limit` (optional): Limit number of results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Node.js",
      "content": "Node.js is a powerful JavaScript runtime...",
      "author": "John Doe",
      "publishedDate": "2024-01-15",
      "tags": ["nodejs", "backend", "javascript"]
    }
  ],
  "total": 3
}
```

#### Get Single Blog
```http
GET /api/blogs/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Getting Started with Node.js",
    "content": "Node.js is a powerful JavaScript runtime...",
    "author": "John Doe",
    "publishedDate": "2024-01-15",
    "tags": ["nodejs", "backend", "javascript"]
  }
}
```

### Form Submissions

#### Submit Form
```http
POST /api/forms
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, this is a test message",
  "formType": "contact"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "submissionId": 1699123456789,
    "status": "received"
  }
}
```

### Utility Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "DummyBackend API"
}
```

#### Root Endpoint
```http
GET /
```

**Response:**
```json
{
  "message": "Welcome to DummyBackend API",
  "version": "1.0.0",
  "endpoints": {
    "blogs": "GET /api/blogs",
    "singleBlog": "GET /api/blogs/:id",
    "forms": "POST /api/forms",
    "health": "GET /health"
  }
}
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v14 or higher, v18+ recommended)
- npm

### Installation Steps

1. **Clone/Navigate to the project directory**
   ```bash
   cd DummyBackend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   
   **For production:**
   ```bash
   npm start
   ```

   **For development (with auto-restart):**
   ```bash
   npm run dev
   ```

4. **Server will be running on:**
   ```
   http://localhost:3000
   ```

## 🔧 Environment Variables

You can configure the following environment variables:

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (development/production)
- `LOG_LEVEL`: Logging level (default: info)
- `ALLOWED_ORIGINS`: Comma-separated allowed origins for production CORS

**Example:**
```bash
PORT=8080 NODE_ENV=production npm start
```

## 🏗️ Architecture & Design Patterns

### Separation of Concerns
- **`server.js`**: Only handles server configuration and startup
- **`config/`**: Centralized configuration management
- **`controllers/`**: Business logic separated from routes
- **`routes/`**: Clean endpoint definitions and route handling
- **`models/`**: Data structures and models
- **`utils/`**: Reusable utility functions
- **`middleware/`**: Custom middleware (ready for expansion)

### Key Benefits
- ✅ **Maintainability**: Easy to locate and modify specific functionality
- ✅ **Scalability**: Simple to add new features without code conflicts
- ✅ **Testability**: Each component can be unit tested independently
- ✅ **Team Collaboration**: Multiple developers can work on different modules
- ✅ **Industry Standard**: Follows Node.js and Express.js best practices

## 🧪 Testing the API

### Using curl

**Get all blogs:**
```bash
curl http://localhost:3000/api/blogs
```

**Get filtered blogs:**
```bash
curl "http://localhost:3000/api/blogs?author=John&limit=2"
```

**Get single blog:**
```bash
curl http://localhost:3000/api/blogs/1
```

**Submit a form:**
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=John Doe&email=john@example.com&message=Hello World"
```

**Health check:**
```bash
curl http://localhost:3000/health
```

### Using a REST client (Postman, Insomnia, etc.)

1. **GET** `http://localhost:3000/api/blogs`
2. **GET** `http://localhost:3000/api/blogs/1`
3. **POST** `http://localhost:3000/api/forms` with form data:
   - Content-Type: `application/x-www-form-urlencoded`
   - Body: `name=John&email=john@example.com&message=Test message`

## 🔍 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP status codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## 🛡️ Input Validation & Security

- **Email validation**: RFC-compliant email format checking
- **Required field validation**: Ensures all mandatory fields are present
- **Input sanitization**: Removes potentially harmful script tags
- **Data type validation**: Ensures data integrity
- **CORS protection**: Configurable cross-origin resource sharing

## 🚀 Development Workflow

### With Nodemon (Auto-restart)
```bash
npm run dev
# Make changes to any file
# Server automatically restarts!
```

### Manual Testing
```bash
# Start server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3000/
curl http://localhost:3000/api/blogs
curl -X POST http://localhost:3000/api/forms -d "name=Test&email=test@example.com&message=Hello"
```

## 🔄 Next Steps & Roadmap

### Database Integration
- [ ] Add MongoDB/PostgreSQL support
- [ ] Implement data persistence layer
- [ ] Add migration scripts

### Authentication & Security
- [ ] JWT-based authentication
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Request validation schemas

### Testing
- [ ] Unit tests for controllers
- [ ] Integration tests for routes
- [ ] API endpoint testing
- [ ] Performance testing

### Monitoring & Logging
- [ ] Structured logging
- [ ] Health monitoring
- [ ] Performance metrics
- [ ] Error tracking

### Additional Features
- [ ] File upload capabilities
- [ ] Real-time features (WebSocket)
- [ ] Caching layer
- [ ] API documentation (Swagger)

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-restart
npm test           # Run tests (placeholder)
```

## 📄 License

ISC 
