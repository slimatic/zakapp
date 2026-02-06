# ZakApp Backend

Your Secure, Private Wealth & Zakat Vault - Backend API

## Quick Start

```bash
docker run -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e DATABASE_URL=file:/app/data/prod.db \
  slimatic/zakapp-backend:latest
```

## Features

- **REST API**: Full-featured API for ZakApp
- **SQLite Database**: Local-first data storage
- **JWT Authentication**: Secure user authentication
- **CouchDB Integration**: Multi-device sync support
- **Gold/Silver Price API**: Automatic Nisab calculations

## Environment Variables

### Required
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: Refresh token secret
- `ENCRYPTION_KEY`: Data encryption key
- `COUCHDB_PASSWORD`: CouchDB admin password
- `COUCHDB_JWT_SECRET`: CouchDB JWT secret

### Optional
- `DATABASE_URL`: SQLite database path
- `GOLD_API_KEY`: Gold price API key
- `SMTP_*`: Email configuration

## Links

- [GitHub Repository](https://github.com/slimatic/zakapp)
- [Full Documentation](https://github.com/slimatic/zakapp/blob/main/README.md)
- [API Documentation](https://github.com/slimatic/zakapp/blob/main/docs/api-specification.md)

## License

AGPL-3.0