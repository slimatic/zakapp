# zakapp

A user-friendly, self-hosted Zakat application with modern UI for personal asset management and accurate Zakat calculations.

## 🎯 Project Overview

zakapp is a secure, privacy-focused application that helps Muslims calculate their annual Zakat obligations. Built with modern web technologies and designed for self-hosting, it provides full control over your financial data while offering an intuitive user experience.

## ✨ Key Features

- **🔐 Secure Authentication**: Robust user login with encrypted data storage
- **📊 Asset Management**: Interactive questionnaire and manual asset entry
- **🧮 Zakat Calculation**: Support for lunar/solar calendars and multiple methodologies
- **📈 Year-to-Year Tracking**: Historical data and payment tracking
- **🔒 Privacy-First**: Self-hosted with encrypted JSON storage
- **📱 Modern UI**: Responsive design with "lovable" user experience
- **🐳 Docker Ready**: Easy deployment with containerization

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Storage**: Encrypted JSON files (no database required)
- **Security**: JWT authentication + client-side encryption
- **Deployment**: Docker + Docker Compose

## 📚 Documentation

- [Development Plan](development-plan.md) - Comprehensive development roadmap
- [Project Structure](project-structure.md) - Detailed project organization
- [API Specification](api-specification.md) - Backend API documentation
- [User Stories](user-stories.md) - Feature requirements and user flows
- [Problem Statement](problem.md) - Project motivation and challenges
- [Solution Overview](solution.md) - Technical approach and features
- [Project Principles](principles.md) - Development guidelines
- [Security Considerations](security.md) - Security measures and best practices

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/slimatic/zakapp.git
   cd zakapp
   ```

2. **Start development environment**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd ../backend && npm install
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Production Deployment

1. **Build the application**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🛠️ Development

### Project Structure

```
zakapp/
├── docs/                   # Documentation and specifications
├── frontend/              # React TypeScript frontend
├── backend/               # Node.js TypeScript backend
├── shared/                # Shared types and utilities
├── docker/               # Docker configuration
├── scripts/              # Development scripts
└── tests/                # Test files
```

### Development Commands

```bash
# Backend development
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint

# Frontend development
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🔒 Security

- **Data Encryption**: All user data is encrypted at rest and in transit
- **Authentication**: JWT-based authentication with secure session management
- **Self-Hosted**: Full control over your data and deployment environment
- **No Database**: Encrypted JSON files eliminate database security concerns
- **Regular Updates**: Automated security dependency updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by SimpleZakatGuide.com for clear Zakat guidance
- Built with modern web technologies and best practices
- Designed with privacy and user control as core principles

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Follow the development plan in [development-plan.md](development-plan.md)
- Review the user stories in [user-stories.md](user-stories.md)

---

**Note**: This application is currently in development. Follow the [development plan](development-plan.md) for implementation progress and roadmap.
