# Har Ghar Munga - API Endpoints Documentation
## Authentication Endpoints

### 1. User Login
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticate user and get access token
- **Request Body:**
 
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": "string",
      "username": "string",
      "role": "admin|anganwadi|family",
      "name": "string",
      "centerCode": "string",
      "centerName": "string",
      "district": "string",
      "block": "string"
    },
    "token": "string"
  }
  ```

### 2. User Logout
- **Endpoint:** `POST /auth/logout`
- **Description:** Logout user and invalidate token
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

## Family Management Endpoints

### 3. Register New Family
- **Endpoint:** `POST /families/register`
- **Description:** Register a new family with child and plant information
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "childName": "string",
    "gender": "लड़का|लड़की",
    "dateOfBirth": "string",
    "age": "string",
    "weight": "string",
    "height": "string",
    "motherName": "string",
    "fatherName": "string",
    "mobileNumber": "string",
    "village": "string",
    "ward": "string",
    "panchayat": "string",
    "district": "string",
    "distributionDate": "string",
    "anganwadiCenterName": "string",
    "anganwadiCode": "string",
    "workerName": "string",
    "workerCode": "string",
    "block": "string",
    "registrationDate": "string",
    "plantPhoto": "string|null",
    "pledgePhoto": "string|null"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Family registered successfully",
    "familyId": "string"
  }
  ```

### 4. Get All Families
- **Endpoint:** `GET /families`
- **Description:** Get list of all families (with optional center filter)
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `centerCode` (optional): Filter by center code
- **Response:**
  ```json
  [
    {
      "id": "string",
      "childName": "string",
      "parentName": "string",
      "mobileNumber": "string",
      "village": "string",
      "registrationDate": "string",
      "plantDistributed": true,
      "centerCode": "string",
      "centerName": "string",
      "workerName": "string",
      "status": "active|inactive"
    }
  ]
  ```

### 5. Search Families
- **Endpoint:** `GET /families/search`
- **Description:** Search families by name, mobile, or village
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `q`: Search query
  - `centerCode` (optional): Filter by center code
- **Response:** Same as Get All Families

### 6. Get Family Details
- **Endpoint:** `GET /families/{familyId}`
- **Description:** Get detailed information of a specific family
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Complete family data object

### 7. Update Family
- **Endpoint:** `PUT /families/{familyId}`
- **Description:** Update family information
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Partial family data
- **Response:**
  ```json
  {
    "success": true,
    "message": "Family updated successfully"
  }
  ```

## Photo Management Endpoints

### 8. Upload Photo
- **Endpoint:** `POST /photos/upload`
- **Description:** Upload plant progress photo
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "familyId": "string",
    "plantStage": "string",
    "description": "string",
    "photoUri": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Photo uploaded successfully",
    "photoId": "string"
  }
  ```

### 9. Get Family Photos
- **Endpoint:** `GET /photos/family/{familyId}`
- **Description:** Get all photos for a specific family
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  [
    {
      "id": "string",
      "photoUri": "string",
      "plantStage": "string",
      "description": "string",
      "uploadDate": "string"
    }
  ]
  ```

### 10. File Upload
- **Endpoint:** `POST /upload/file`
- **Description:** Upload any file (photos, documents)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** FormData with file and type
- **Response:**
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "fileUrl": "string"
  }
  ```

## Progress Report Endpoints

### 11. Get Progress Report
- **Endpoint:** `GET /reports/progress`
- **Description:** Get progress report for specific period
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `period`: week|month|year
  - `centerCode` (optional): Filter by center code
- **Response:**
  ```json
  {
    "period": "week|month|year",
    "totalFamilies": 156,
    "distributedPlants": 128,
    "successRate": 98,
    "newAdded": 45,
    "activities": [
      {
        "date": "string",
        "activity": "string",
        "type": "registration|distribution|photo_upload|progress_update"
      }
    ]
  }
  ```

### 12. Export Report
- **Endpoint:** `GET /reports/export`
- **Description:** Export progress report as Excel/PDF
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `period`: week|month|year
  - `centerCode` (optional): Filter by center code
- **Response:**
  ```json
  {
    "success": true,
    "message": "Report exported successfully",
    "downloadUrl": "string"
  }
  ```

## Dashboard Statistics Endpoints

### 13. Get Dashboard Stats
- **Endpoint:** `GET /dashboard/stats`
- **Description:** Get dashboard statistics and recent activities
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `centerCode` (optional): Filter by center code
- **Response:**
  ```json
  {
    "totalFamilies": 156,
    "distributedPlants": 128,
    "activeFamilies": 142,
    "successRate": 98,
    "recentActivities": [
      {
        "date": "string",
        "activity": "string",
        "type": "string"
      }
    ]
  }
  ```

## Plant Management Endpoints

### 14. Get Plant Options
- **Endpoint:** `GET /plants/options`
- **Description:** Get available plant varieties
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  [
    {
      "id": 1,
      "name": "Munga 1",
      "hindiName": "मुंगा 1",
      "emoji": "🌱",
      "description": "मुंगा किस्म 1"
    }
  ]
  ```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["field_name": "error message"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Login endpoints:** 5 requests per minute
- **Data endpoints:** 100 requests per minute
- **File upload:** 10 requests per minute

## File Upload Limits

- **Photo files:** Max 5MB, formats: JPG, PNG, JPEG
- **Document files:** Max 10MB, formats: PDF, DOC, DOCX

## Database Schema Requirements

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'anganwadi', 'family') NOT NULL,
  name VARCHAR(100) NOT NULL,
  center_code VARCHAR(20),
  center_name VARCHAR(100),
  district VARCHAR(50),
  block VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Families Table
```sql
CREATE TABLE families (
  id VARCHAR(36) PRIMARY KEY,
  child_name VARCHAR(100) NOT NULL,
  gender ENUM('लड़का', 'लड़की') NOT NULL,
  date_of_birth DATE,
  age VARCHAR(10),
  weight VARCHAR(10),
  height VARCHAR(10),
  mother_name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100) NOT NULL,
  mobile_number VARCHAR(15) NOT NULL,
  village VARCHAR(100) NOT NULL,
  ward VARCHAR(50),
  panchayat VARCHAR(100),
  district VARCHAR(50) NOT NULL,
  distribution_date DATE,
  anganwadi_center_name VARCHAR(100) NOT NULL,
  anganwadi_code VARCHAR(20) NOT NULL,
  worker_name VARCHAR(100) NOT NULL,
  worker_code VARCHAR(20) NOT NULL,
  block VARCHAR(50) NOT NULL,
  registration_date DATE NOT NULL,
  plant_photo_url TEXT,
  pledge_photo_url TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Photos Table
```sql
CREATE TABLE photos (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) NOT NULL,
  photo_url TEXT NOT NULL,
  plant_stage VARCHAR(50) NOT NULL,
  description TEXT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
```

### Activities Table
```sql
CREATE TABLE activities (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36),
  user_id VARCHAR(36),
  activity_type ENUM('registration', 'distribution', 'photo_upload', 'progress_update') NOT NULL,
  description TEXT NOT NULL,
  activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
``` 