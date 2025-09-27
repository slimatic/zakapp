# zakapp

A user-friendly, self-hosted Zakat application with modern UI for personal asset management and Zakat calculation.

## Features

- 🔐 Secure user authentication
- 📅 Flexible asset snapshots (lunar/solar dates)
- 📋 Interactive questionnaire for asset determination
- 💰 Precise net worth and Zakat calculation
- 📊 Year-to-year Zakat tracking
- 🔒 Encrypted JSON data storage
- 🎨 Modern, intuitive UI/UX
- 🐳 Docker deployment ready

## Quick Start

### Development Setup

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```
   This will start both the backend (port 3001) and frontend (port 3000) servers.

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   npm run docker:build
   ```

2. **Run the container:**
   ```bash
   npm run docker:run
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
zakapp/
├── client/          # React frontend application
├── server/          # Node.js/Express backend
├── docker/          # Docker configuration
├── docs/           # Documentation files
└── data/           # Encrypted user data storage (created at runtime)
```

## Security

- All user data is encrypted and stored locally
- Self-hosted architecture gives you full control
- No external data transmission
- Secure authentication with password hashing

## Development Principles

- Spec-driven development approach
- User-centric design with "lovable" UI/UX
- Privacy and security first
- Simplicity and clarity in Zakat calculations

## Inspiration

This project draws methodological inspiration from SimpleZakatGuide.com and follows Islamic Zakat calculation principles.

## License

MIT License - see LICENSE file for details.