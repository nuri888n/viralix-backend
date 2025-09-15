const { body, validationResult } = require('express-validator');
import { Request, Response, NextFunction } from 'express';

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'validation_failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Project validation rules
export const validateProject = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Account validation rules
export const validateAccount = [
  body('platform')
    .isIn(['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER'])
    .withMessage('Platform must be one of: INSTAGRAM, TIKTOK, YOUTUBE, TWITTER'),
  body('handle')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Handle must be between 1 and 50 characters'),
  handleValidationErrors
];

// Post validation rules
export const validatePost = [
  body('caption')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Caption must be between 1 and 2000 characters'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'SCHEDULED', 'PUBLISHED'])
    .withMessage('Status must be one of: DRAFT, SCHEDULED, PUBLISHED'),
  body('accountIds')
    .isArray({ min: 1 })
    .withMessage('At least one account ID is required')
    .custom((value) => {
      if (!Array.isArray(value) || !value.every((id) => Number.isInteger(id) && id > 0)) {
        throw new Error('Account IDs must be positive integers');
      }
      return true;
    }),
  handleValidationErrors
];