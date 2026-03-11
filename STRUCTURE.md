# Project Structure Documentation

## New Organized Folder Structure

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts          # Login request DTO
│   │   └── register.dto.ts       # User registration DTO
│   ├── strategies/
│   │   └── jwt.strategy.ts       # Passport JWT strategy
│   ├── auth.controller.ts        # Authentication endpoints
│   ├── auth.module.ts            # Auth module definition
│   ├── auth.service.ts           # Authentication business logic
│   └── jwt-auth.guard.ts         # JWT validation guard
│
├── company-input/
│   ├── dto/
│   │   ├── create-company-input.dto.ts   # Create company data DTO
│   │   └── update-company-input.dto.ts   # Update company data DTO
│   ├── company-input.controller.ts
│   ├── company-input.module.ts
│   └── company-input.service.ts
│
├── uploads/
│   ├── dto/
│   │   └── upload-image.dto.ts   # Image upload request DTO
│   ├── uploads.controller.ts
│   ├── uploads.module.ts
│   └── uploads.service.ts
│
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts    # User creation DTO
│   │   └── update-user.dto.ts    # User update DTO
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
│
├── common/
│   ├── http-exception.filter.ts
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   ├── roles.decorator.ts
│   └── roles.guard.ts
│
├── app.module.ts
└── main.ts
```

## Benefits of the New Structure

1. **DTOs in Dedicated Folders**: All data transfer objects are organized in a `dto/` folder within each module
2. **Strategies Folder**: Authentication strategies (JWT, OAuth, etc.) are isolated in a `strategies/` folder
3. **Scalability**: Easy to add new DTOs (e.g., `update-user.dto.ts`, `query-user.dto.ts`) without cluttering the module root
4. **Maintainability**: Clear separation of concerns - DTOs, business logic, controllers, and strategies are in their own spaces
5. **Convention**: Follows NestJS best practices and industry standards

## Import Examples After Restructuring

### Before
```typescript
// DTOs were inline in controllers
class LoginDto { ... }
class RegisterDto { ... }
```

### After
```typescript
// Clean imports from dedicated DTO files
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtStrategy } from './strategies/jwt.strategy';
```
