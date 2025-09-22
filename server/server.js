
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apis = require('./src/apis');
const CustomError = require('./src/utilities/errors.js');
const errorHandlingMiddleware = require('./src/middlewares/errorHandlingMiddleware.js');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/', apis);

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

// 404 handler for unmatched routes
app.use((req, res, next) => {
  return next(new CustomError({ name: 'Resource not found', statusCode: 404, message: 'Resource not found' }));
});

// Global error handler
// Note: keep validation middleware responses as-is; only handle non-validation errors here
// Format: { error: "true", message: "<error message>" }
// eslint-disable-next-line no-unused-vars
app.use(errorHandlingMiddleware);

  
  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
