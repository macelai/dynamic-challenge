# Dynamic Challenge

API platform (with a basic UI) to generate custodial wallets on the backend with support for basic actions.

## Live Demo

Visit the live demo at [https://frontend-production-3ec2.up.railway.app](https://frontend-production-3ec2.up.railway.app)


## Tech Stack

### Backend
- Fastify server
- BullMQ for job queue processing
- Prisma with PostgreSQL
- Redis for queue management
- Vitest for testing
- Dynamic Labs passport plugin for authentication

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for data fetching
- Tailwind CSS with Shadcn UI components
- Dynamic Labs SDK for authentication
- Viem for Ethereum interactions


## Prerequisites

- Node.js (LTS version)
- Bun runtime
- Docker and Docker Compose
- PostgreSQL
- Redis

## Installation

1. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   bun install

   # Install backend dependencies
   cd ../api
   bun install
   ```

2. Configure environment variables:
   ```bash
   # Frontend (.env)
   VITE_API_BASE_URL=http://localhost:8080
   VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

   # Backend (.env)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/api"
   REDIS_URL="redis://localhost:6379"
   RPC_URL="your_ethereum_rpc_url"
   ```

3. Start infrastructure services:
   ```bash
   cd api
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   cd api
   bunx prisma migrate deploy
   ```

## Development

1. Start the backend server:
   ```bash
   cd api
   bun dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   bun dev
   ```

## Testing

I use Vitest as our testing framework. The test suite includes integration tests for API endpoints and background workers, utilizing a real PostgreSQL database for test execution. Due to time constraints, the test coverage is currently limited. The test architecture could be improved, particularly by implementing dependency injection patterns which would make the tests more maintainable and easier to write.

### Backend Tests

1. Run migrations for test database:
   ```bash
   cd api
   bun run test:db:migrate
   ```

2. Run tests:
   ```bash
   cd api
   bun run test
   ```


## Security Considerations

### Encryption and Key Management

The application currently uses environment variables for encryption key storage. While functional, this approach has limitations in terms of security and key lifecycle management.

#### Current Implementation
- Basic encryption key stored in environment variables
- Limited key rotation capabilities
- Manual key management required

#### Recommended Improvements

Migrate to a cloud key management service like AWS KMS, Google Cloud KMS, or Azure Key Vault:

Benefits:
- Automatic key rotation
- Access control and audit logging
- Hardware Security Module (HSM) backing

### Implement key splitting/sharing

Consider implementing key splitting using either Shamir's Secret Sharing scheme or Multi-Party Computation (MPC). With Shamir's scheme, the encryption key is divided into multiple shares distributed among different parties, requiring a predefined threshold of shares (e.g., 3 out of 5) to reconstruct the original key. Alternatively, MPC allows multiple parties to jointly compute operations on the key material without any single party having access to the complete key. Both approaches add significant security by preventing unauthorized access even if one or more parties are compromised. They also enable secure key recovery procedures through organizational consensus while maintaining operational flexibility. MPC has the additional benefit of allowing secure computation and signing operations without key reconstruction.


### Run in a secure environment

Consider deploying the application in secure hardware-backed environments that provide memory encryption and isolation. Technologies like Intel SGX (Software Guard Extensions) or similar solutions offer hardware-level protection for sensitive code and data. These environments create encrypted memory regions that are inaccessible to the host system and other processes, maintaining security even if the host is compromised. Running in secure enclaves can protect encryption keys, sensitive business logic, and user data by executing them in an isolated and encrypted environment, significantly reducing the attack surface while providing strong hardware-backed security guarantees.

## Architecture

### Queue-Based Processing System

The application utilizes BullMQ with Redis to handle asynchronous wallet operations. This architecture is crucial for managing resource-intensive cryptographic operations and ensuring transaction reliability. Considering the security considerations discussed above, using queues for job processing is especially beneficial as it allows operations to span multiple services without blocking the API server. Right now the workers are running on the same machine as the API server, but in a production environment, they should be running on separate machines.

#### Key Components

1. **Mnemonic Generation Queue**
   - Handles wallet creation
   - Manages encryption and storage of sensitive key material

2. **Account Generation Queue**
   - Processes new account derivation
   - Manages address generation and storage

#### Advantages

1. **Reliability & Security**
   - Automatic retry mechanisms
   - Isolated processing of sensitive operations

2. **Scalability**
   - Horizontal scaling capabilities
   - Independent worker scaling

3. **Observability**
   - Job progress tracking
   - Failed operation monitoring
   - Queue health metrics
