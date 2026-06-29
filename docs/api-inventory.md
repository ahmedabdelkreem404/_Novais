# NOVAIS API Inventory

This document details all API contracts exposed by the Laravel backend and consumed by the React website and Flutter mobile app.

---

## 1. Authentication Endpoints

### Login
- **Endpoint**: `POST /api/auth/login`
- **Auth Status**: Guest (Public)
- **Parameters**:
  - `email` (string, required)
  - `password` (string, required)
  - `device_id` (string, optional)
- **Response (200 OK)**:
  ```json
  {
    "token": "JWT_TOKEN_HERE",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```

### Registration
- **Endpoint**: `POST /api/auth/register`
- **Auth Status**: Guest (Public)
- **Parameters**:
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required)
  - `device_id` (string, optional)
- **Response (200 OK)**: JSON representation of created user or verification status payload.

### User Profile
- **Endpoint**: `GET /api/auth/user-profile`
- **Auth Status**: Authenticated (Bearer Token required)
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "dark_mode": true,
      "sub_status": "free",
      "isPro": false
    }
  }
  ```

---

## 2. Platform Configuration Settings

### Public Settings Configuration
- **Endpoint**: `GET /api/platform-config`
- **Auth Status**: Guest (Public)
- **Caching**: Cached using Laravel Cache facade with automatic invalidation on updates.
- **Response (200 OK)**:
  ```json
  {
    "course_creation_enabled": true,
    "all_languages_free": false,
    "video_courses_enabled": true,
    "video_courses_free": false,
    "enabled_languages": ["English", "Arabic"],
    "free_languages": ["English"],
    "system_theme_mode": "user_choice",
    "theme_default_mode": "dark",
    "payment_methods_visible": true,
    "offline_payment_instructions_en": "Send price to account XXXX.",
    "offline_payment_instructions_ar": "أرسل قيمة الاشتراك للحساب البنكي XXXX."
  }
  ```
  *(Note: Sensitive keys such as `secret_private_key` are filtered out of public responses).*

### Admin View Configuration
- **Endpoint**: `GET /api/admin/platform-config`
- **Auth Status**: Authenticated Admin
- **Response (200 OK)**: Full key-value dictionary (includes admin/secrets parameters).

### Update Configuration Settings
- **Endpoint**: `PUT /api/admin/platform-config`
- **Auth Status**: Authenticated Admin
- **Parameters**: Key-value pairs to merge/update.
- **Response (200 OK)**: Full updated configuration JSON.

---

## 3. Course Creation & Curriculum Generation

### Generate Course Curriculum
- **Endpoint**: `POST /api/generate-course`
- **Auth Status**: Authenticated (Bearer Token required)
- **Headers**: `X-Device-ID` (required for tracking/fingerprinting)
- **Parameters**:
  - `topic` (string, required)
  - `subTopics` (array of strings, optional)
  - `type` (string, required: `'Theory & Image Course'` or `'Video & Theory Course'`)
  - `language` (string, required)
  - `level` (string, required: `'Beginner'`, `'Intermediate'`, etc.)
  - `numModules` (int, required)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "course_id": 42
  }
  ```

### Get Courses List
- **Endpoint**: `GET /api/courses`
- **Auth Status**: Authenticated
- **Response (200 OK)**: Array of course objects.

### Fetch Course Details
- **Endpoint**: `GET /api/courses/{id}`
- **Auth Status**: Authenticated
- **Response (200 OK)**: Course object with modular lessons and chapters structure.

---

## 4. Payments & Subscriptions

### Get Commercial Plans
- **Endpoint**: `GET /api/plans`
- **Auth Status**: Guest (Public)
- **Response (200 OK)**: List of plan definitions containing Arabic/English titles, descriptions, features lists, and prices.

### Offline Payment Request
- **Endpoint**: `POST /api/offline-payments`
- **Auth Status**: Authenticated
- **Parameters**:
  - `plan_id` (int, required)
  - `transaction_reference` (string, optional)
  - `receipt_image` (file, optional)
- **Response (200 OK)**: Reference status payload.
