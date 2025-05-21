# Contributing to QC Standards App

Thank you for your interest in contributing to the QC Standards application! This document provides guidelines and instructions for contributing to the project.

## Development Workflow

We follow a Git Flow-based workflow:

- `main` branch contains production-ready code
- `develop` branch is the integration branch for new features
- Feature branches are created from `develop` and merged back into `develop`
- Release branches are created from `develop` and merged into both `develop` and `main`

### Getting Started

1. Fork the repository (if you're an external contributor)
2. Clone the repository:
   ```bash
   git clone https://github.com/your-username/qc-standards-app.git
   cd qc-standards-app
   ```

3. Set up the development environment:
   ```bash
   cp .env.example .env
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

5. Make your changes, following the code style guidelines

6. Push your branch and create a pull request to `develop`

### Pull Request Process

1. Ensure your code passes all tests and linters
2. Update the README.md with details of changes to the interface, if applicable
3. Update the documentation if needed
4. The PR must be approved by at least one reviewer
5. The PR will be merged once approved

## Code Style Guidelines

### Backend (Python)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) coding style
- Use type hints for all function parameters and return values
- Write docstrings for all functions and classes
- Format code using `black` and `isort`
- Validate with `flake8`

Example:
```python
def calculate_fpy(ok_count: int, total_count: int) -> float:
    """
    Calculate First Pass Yield percentage.
    
    Args:
        ok_count: Number of OK results
        total_count: Total number of results
        
    Returns:
        Percentage as a float between 0 and 100
    """
    if total_count == 0:
        return 0.0
    
    return (ok_count / total_count) * 100.0
```

### Frontend (TypeScript/React)

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for type safety
- Use functional components with hooks
- Use React context for global state
- Format code using Prettier
- Validate with ESLint

Example:
```tsx
import React, { useState } from 'react';

interface ItemProps {
  name: string;
  count: number;
}

const Item: React.FC<ItemProps> = ({ name, count }) => {
  const [isActive, setIsActive] = useState(false);
  
  const handleClick = () => {
    setIsActive(!isActive);
  };
  
  return (
    <div className={`item ${isActive ? 'active' : ''}`} onClick={handleClick}>
      <h3>{name}</h3>
      <span>{count}</span>
    </div>
  );
};

export default Item;
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(templates): add photo upload functionality to steps

- Add file input component for photo capture
- Implement preview functionality
- Add API endpoint for photo uploads

Closes #123
```

## Testing Guidelines

### Backend Tests

- Use pytest for testing
- Write unit tests for all functions and methods
- Write integration tests for API endpoints
- Aim for at least 80% code coverage

Example:
```python
def test_calculate_fpy():
    # Test with normal values
    assert calculate_fpy(80, 100) == 80.0
    
    # Test with zero count
    assert calculate_fpy(0, 100) == 0.0
    
    # Test with zero total
    assert calculate_fpy(0, 0) == 0.0
```

### Frontend Tests

- Use Vitest for unit tests
- Use React Testing Library for component tests
- Test user interactions and state changes

Example:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Item from './Item';

describe('Item component', () => {
  it('renders the name and count', () => {
    render(<Item name="Test Item" count={5} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
  
  it('toggles active class on click', () => {
    render(<Item name="Test Item" count={5} />);
    
    const item = screen.getByText('Test Item').closest('div');
    expect(item).not.toHaveClass('active');
    
    fireEvent.click(item);
    expect(item).toHaveClass('active');
    
    fireEvent.click(item);
    expect(item).not.toHaveClass('active');
  });
});
```

## Adding New Features

When adding new features, consider the following:

1. **Alignment with requirements**: Ensure the feature aligns with the project's goals and requirements
2. **Backwards compatibility**: Avoid breaking changes when possible
3. **Performance**: Consider performance implications, especially for offline mode
4. **Accessibility**: Ensure UI components are accessible
5. **Internationalization**: Support Polish and English languages
6. **Mobile support**: Ensure features work on mobile devices
7. **Offline support**: Consider how the feature works offline

## Feature Implementation Checklist

- [ ] Define requirements and acceptance criteria
- [ ] Create database models (if needed)
- [ ] Implement API endpoints (if needed)
- [ ] Create or update UI components
- [ ] Write tests for backend and frontend
- [ ] Update documentation
- [ ] Review code yourself before submitting PR
- [ ] Address review feedback

## License and Copyright

This project is proprietary. By contributing to this project, you agree to assign copyright of your contributions to the project owner.

## Questions and Support

If you have questions about the contribution process or need help, please contact the project maintainers at [your-team@example.com](mailto:your-team@example.com).
