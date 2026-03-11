# Image Upload System Documentation

## Overview
The image upload system is a role-based file upload feature that allows `USER_B` to upload images associated with a `USER_A` owner. The system tracks upload metadata in a PostgreSQL database using Prisma ORM.

## Architecture

### 1. **Frontend Request Flow**
- Client (USER_B) sends a multipart/form-data POST request
- Includes the image file and the owner's ID (`ownerId`)
- Request must include a valid JWT token (cookie or Authorization header)

### 2. **Server-Side Processing**

#### a. **File Interception** (`@UseInterceptors(FileInterceptor('file'))`)
- NestJS `FileInterceptor` from `@nestjs/platform-express` intercepts the incoming file
- Automatically saves the file to disk using Multer
- Stores file metadata in `Express.Multer.File` object:
  - `file.originalname`: Original filename
  - `file.mimetype`: File MIME type (e.g., 'image/jpeg')
  - `file.size`: File size in bytes
  - `file.path`: Disk storage path (local filesystem)

#### b. **Authentication & Authorization**
- `@UseGuards(JwtAuthGuard, RolesGuard)`: Validates JWT and user role
- `@Roles(UserRole.USER_B)`: Ensures only USER_B can upload images

#### c. **Metadata Recording**
```typescript
// uploads.controller.ts
const record = await this.uploadsService.recordUpload({
  ownerId: dto.ownerId,          // UUID of the image owner (USER_A)
  uploaderId: currentUser.userId, // UUID of the uploader (USER_B)
  filename: file.originalname,    // Original filename
  mimetype: file.mimetype,        // Image MIME type
  size: file.size,                // File size in bytes
  storagePath: file.path,         // Disk path where file is stored
});
```

### 3. **Data Storage**

#### Database Schema (Prisma)
```prisma
model ImageUpload {
  id           String   @id @default(uuid())
  filename     String
  mimetype     String
  size         Int
  storagePath  String
  createdAt    DateTime @default(now())

  owner   User   @relation(fields: [ownerId], references: [id])
  ownerId String

  uploader   User   @relation("UploaderImages", fields: [uploaderId], references: [id])
  uploaderId String
}
```

#### Two Relations to User Model
- **owner**: The USER_A who owns/is associated with the image
- **uploader**: The USER_B who performed the upload

### 4. **Upload Endpoints**

#### POST `/uploads` - Upload Image
```
Request:
  Method: POST
  URL: /uploads
  Headers: 
    - Cookie: takehome_auth=<jwt_token>
    - Content-Type: multipart/form-data
  Body:
    - file: <image_file>
    - ownerId: <uuid>
  
Response:
  {
    "id": "uuid",
    "filename": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "storagePath": "/uploads/photo-1234.jpg",
    "ownerId": "uuid",
    "uploaderId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z"
  }

Requirements:
  - User must be authenticated (valid JWT)
  - User role must be USER_B
  - ownerId must be a valid UUID
```

#### GET `/uploads/latest/:ownerId` - Get Latest Upload for Owner
```
Request:
  Method: GET
  URL: /uploads/latest/:ownerId
  Headers:
    - Cookie: takehome_auth=<jwt_token>

Response:
  {
    "id": "uuid",
    "filename": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "storagePath": "/uploads/photo-1234.jpg",
    "ownerId": "uuid",
    "uploaderId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z"
  }

Requirements:
  - User must be authenticated (valid JWT)
  - User role must be USER_B
  - Returns only the most recent image for the specified owner
```

## Key Components

### UploadsService
```typescript
// Record upload metadata in database
async recordUpload(params: {
  ownerId: string;
  uploaderId: string;
  filename: string;
  mimetype: string;
  size: number;
  storagePath: string;
})

// Retrieve latest upload for a user
async findLatestForOwner(ownerId: string)
```

### UploadsController
- Handles multipart file uploads using Multer
- Enforces role-based access control
- Extracts user ID from JWT token
- Delegates data persistence to UploadsService

## Security Features

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only USER_B can upload; only USER_B can query images
3. **Role-Based Access**: Enforced via `RolesGuard` and `@Roles()` decorator
4. **Data Isolation**: Images are associated with specific owners and uploaders
5. **File Validation**: MIME type and file size are recorded for validation

## Storage Details

### File Storage Location
- Files are stored on the server's local filesystem
- Default path set by Multer configuration (typically `./uploads/`)
- `storagePath` in database contains the relative or absolute path for retrieval

### File Access
- Files can be retrieved using the `storagePath` from the database record
- Currently, no public file serving endpoint is implemented
- Add a GET endpoint to serve files if needed: `/uploads/:uploadId/file`

## Future Improvements

1. **Cloud Storage Integration**
   - Replace local filesystem with AWS S3, Google Cloud Storage, or Azure Blob Storage
   - Update `storagePath` to store cloud URLs instead of local paths

2. **File Type Validation**
   - Add MIME type whitelist (e.g., only image files)
   - Validate file extensions

3. **File Size Limits**
   - Configure Multer with `limits.fileSize` option
   - Add client-side validation

4. **Image Processing**
   - Generate thumbnails
   - Compress images before storage
   - Convert formats (e.g., WEBP)

5. **File Serving**
   - Add endpoint to retrieve files: `GET /uploads/:uploadId/file`
   - Implement image caching

6. **Deletion & Management**
   - Add endpoint to delete uploads
   - Add endpoint to list all uploads for a user
   - Implement file cleanup on database record deletion

## Example Usage Flow

1. USER_B registers/logs in → receives JWT token
2. USER_B calls POST `/uploads` with:
   - Image file
   - USER_A's UUID as `ownerId`
3. Server validates JWT and role
4. FileInterceptor captures the file
5. UploadsService creates database record with metadata
6. Response returns upload record with `storagePath`
7. USER_B can later call GET `/uploads/latest/:ownerId` to retrieve metadata
8. File can be served using the `storagePath` if a file-serving endpoint exists
