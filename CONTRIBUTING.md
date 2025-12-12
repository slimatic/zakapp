# Contributing to ZakApp

Thank you for your interest in contributing to ZakApp! We welcome contributions from the community to help make Zakat calculation easier and more accessible.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally.
3.  **Install dependencies**:
    ```bash
    npm run install:all
    ```
4.  **Run the development environment**:
    ```bash
    docker-compose up
    ```

## Development Workflow

We follow a strict **Spec-Driven Development** process as outlined in our [Constitution](.specify/memory/constitution.md).

1.  **Find or Create an Issue**: Discuss the feature or bug fix first.
2.  **Create a Specification**: For new features, a `spec.md` is required.
3.  **Implement**: Write code that meets the spec and passes all tests.
4.  **Test**: Ensure >90% test coverage for calculation logic.
5.  **Submit a Pull Request**: Link to the issue and spec.

## Code Style

-   **TypeScript**: Strict mode enabled. No `any`.
-   **Formatting**: Prettier and ESLint are enforced.
-   **Commits**: Follow Conventional Commits (e.g., `feat: add new calculation method`).

## Islamic Compliance

All changes affecting Zakat calculations must be validated against the [Simple Zakat Guide](https://simplezakatguide.com) methodologies.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
