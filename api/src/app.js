require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const { AppError, ApiResponse } = require('./utils');
const authRouter = require('./modules/auth/auth.routes');
const applicationRouter = require('./modules/applications/application.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', (req, res) => {
  ApiResponse.success(res, { status: 'OK' }, 'System is healthy');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/applications', applicationRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
