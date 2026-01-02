# Contributing to VestaVNC

Thank you for your interest in contributing to VestaVNC! We welcome contributions from the community.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:
1. Check if the issue already exists in the [Issues](../../issues) section
2. If not, create a new issue with a clear title and description
3. Include steps to reproduce (for bugs) or use cases (for features)

### Submitting Changes

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/VestaVNC.git
   cd VestaVNC
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Test your changes thoroughly
   - Update documentation if needed

4. **Build and Test**
   ```bash
   cd vesta/vesta-ui
   npm install
   npm run build
   cd ../..
   docker build -t vestavnc:latest .
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   ```

6. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub with a clear description of your changes.

## Development Guidelines

### Code Style
- **Frontend**: Follow React/TypeScript best practices
- **Backend**: Keep Python code clean and documented
- **Shell Scripts**: Use clear variable names and comments

### Testing
- Test your changes in a Docker environment
- Verify VNC connectivity works
- Check audio/clipboard functionality if applicable

### Commit Messages
Use clear, descriptive commit messages:
- `Add: New feature description`
- `Fix: Bug description`
- `Update: Component/file description`
- `Refactor: What was refactored`

## Questions?

Feel free to reach out:
- **Email**: info@netvesta.com
- **Website**: [www.netvesta.com](https://www.netvesta.com)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
