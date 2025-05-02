# React Component Architecture Guidelines for 2025

> **How to use this guide**: This document provides a comprehensive approach to React component architecture with a focus on maintainability, performance, accessibility, and user experience. Use the navigation below to find specific topics, or follow the learning paths marked as [Beginner], [Intermediate], or [Advanced] to progressively build your understanding.

## Table of Contents

- [Core Principles](#core-principles)
- [Component Design Patterns](#component-design-patterns)
- [Server Components Architecture](#server-components-architecture)
- [State Management Optimization](#state-management-optimization)
- [Performance Optimization](#performance-optimization)
- [UX-Driven Layout Organization](#ux-driven-layout-organization)
- [Accessibility Implementation](#accessibility-implementation)
- [Code Organization and Project Structure](#code-organization-and-project-structure)
- [Testing Strategies](#testing-strategies)
- [Integration Patterns](#integration-patterns)
- [Learning Paths](#learning-paths)

## Learning Paths

### Beginner Path
1. Start with [Core Principles](#core-principles) to understand fundamental React concepts
2. Learn about [Component Design Patterns](#component-design-patterns) to structure your components effectively
3. Explore [UX-Driven Layout Organization](#ux-driven-layout-organization) to create intuitive layouts
4. Study [Accessibility Implementation](#accessibility-implementation) to ensure your components are usable by everyone
5. Practice [Basic Testing Strategies](#testing-strategies) for reliable components

### Intermediate Path
1. Implement [Custom Hooks for Logic Extraction](#component-design-patterns) to separate concerns
2. Apply [Context + Hooks Pattern](#state-management-optimization) for state management
3. Explore [Performance Optimization](#performance-optimization) techniques
4. Learn [Memoization Strategy](#performance-optimization) for optimizing renders
5. Practice [Test-Driven Development](#testing-strategies) for better code quality

### Advanced Path
1. Master [Server Components Architecture](#server-components-architecture) for modern React applications
2. Implement [Advanced State Management](#state-management-optimization) with normalization
3. Apply [Code Splitting and Virtualization](#performance-optimization) for performance
4. Explore [Advanced Component Patterns](#component-design-patterns) for complex UIs
5. Implement [Comprehensive Testing Strategies](#testing-strategies) across your application

## Core Principles

### 1. Atomic Design Methodology [Beginner]

React components should follow atomic design principles, organizing the UI into atoms, molecules, organisms, templates, and pages. This creates a natural hierarchy that promotes reuse and clarity.

- **Atoms**: Basic building blocks (buttons, inputs, labels)
- **Molecules**: Simple groups of UI elements functioning together
- **Organisms**: Complex UI components composed of molecules and atoms
- **Templates**: Page-level layouts without specific content
- **Pages**: Specific instances of templates with real content

**Why it matters**: This hierarchical approach creates a natural separation of concerns and promotes component reusability. It also makes it easier for new team members to understand where components fit in the overall architecture.

### 2. Component Composition Over Configuration [Intermediate]

Prefer creating small, focused components that can be composed together rather than large, highly configurable components. This reduces the need for complex prop interfaces and conditional rendering logic.

**Instead of this (configuration approach):**
```jsx
<DataTable
  data={data}
  sortable={true}
  filterable={true}
  pagination={{ enabled: true, pageSize: 10 }}
  columns={complexColumnsConfig}
  onRowClick={handleRowClick}
  // many more props...
/>
```

**Prefer this (composition approach):**
```jsx
<DataTable data={data}>
  <TableHeader>
    <SortableColumns columns={columns} />
    <FilterBar />
  </TableHeader>
  <TableBody onRowClick={handleRowClick} />
  <Pagination pageSize={10} />
</DataTable>
```

**Why it matters**: Composition creates more flexible, maintainable components that are easier to customize and extend. It also reduces the cognitive load of understanding complex prop APIs.

### 3. Single Responsibility Principle [Beginner]

Each component should have one reason to change. This naturally limits component size and encourages proper separation of concerns.

**Why it matters**: Components with a single responsibility are easier to test, maintain, and reuse. They're also less likely to contain bugs, as they have a more focused purpose.

### 4. Code Clarity Over Cleverness [Beginner]

Prioritize readable, maintainable code over clever tricks that reduce line count but hurt comprehension. A clean 30-line component is better than a cryptic 15-line one.

**Why it matters**: Code is read far more often than it's written. Clear code reduces onboarding time for new developers and makes maintenance easier for everyone.

## Component Design Patterns

### 1. Container and Presentational Components [Beginner]

Separate logic from presentation:

```jsx
// Container component
const UserProfileContainer = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser().then(data => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

  return <UserProfile user={user} />;
};

// Presentational component
const UserProfile = ({ user }) => (
  <div className="profile">
    <h1>{user.name}</h1>
    <p>{user.bio}</p>
    <ContactInfo email={user.email} phone={user.phone} />
  </div>
);
```

### 2. Custom Hooks for Logic Extraction [Intermediate]

Move complex state logic, calculations, and side effects into custom hooks:

```jsx
// Custom hook for fetching data
const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoint, options);
        if (!response.ok) throw new Error('Network response failed');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, options]);

  return { data, loading, error };
};

// Component using the hook
const UserList = () => {
  const { data, loading, error } = useApi('/api/users');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

### 3. Compound Components Pattern [Advanced]

Create components that share state through React Context:

```jsx
const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }) => (
  <div role="tablist">
    {children}
  </div>
);

Tabs.Tab = ({ id, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      role="tab"
      aria-selected={activeTab === id}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = ({ id, children }) => {
  const { activeTab } = useContext(TabsContext);
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={activeTab !== id}
    >
      {children}
    </div>
  );
};

// Usage
<Tabs defaultTab="profile">
  <Tabs.List>
    <Tabs.Tab id="profile">Profile</Tabs.Tab>
    <Tabs.Tab id="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="profile">Profile content</Tabs.Panel>
  <Tabs.Panel id="settings">Settings content</Tabs.Panel>
</Tabs>
```

### 4. Render Props Pattern [Advanced]

Pass a function as a prop to control rendering:

```jsx
const DataFetcher = ({ url, render }) => {
  const { data, loading, error } = useApi(url);
  return render({ data, loading, error });
};

// Usage
<DataFetcher
  url="/api/users"
  render={({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    return (
      <UserList users={data} />
    );
  }}
/>
```

## Server Components Architecture

### 1. Server vs. Client Components [Advanced]

Divide your application into server and client components:

```jsx
// server-component.jsx - Runs only on the server
import { db } from '../database'; // Server-side only import

export default async function UserStats() {
  // Direct database access (no API calls needed)
  const users = await db.users.findMany({
    where: { active: true }
  });

  // Pre-rendered HTML returned to client
  return (
    <div>
      <h2>User Statistics</h2>
      <p>Total active users: {users.length}</p>
      <UserList users={users} />
    </div>
  );
}

// client-component.jsx - Runs on the client
'use client'; // Mark as client component

import { useState } from 'react';

export default function UserFilter({ users }) {
  const [filter, setFilter] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter users..."
      />
      <ul>
        {filteredUsers.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. Server Component Data Fetching [Advanced]

Take advantage of server components for data fetching:

```jsx
// Products.jsx (Server Component)
export default async function Products() {
  // Fetch directly from database or API without exposing credentials
  const products = await fetchProducts();

  return (
    <div>
      <h1>Products</h1>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 3. Streaming with Suspense [Advanced]

Implement streaming with Suspense for improved user experience:

```jsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Critical UI loads immediately */}
      <UserGreeting />

      {/* Less critical parts stream in with loading states */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

## State Management Optimization

### 1. Local vs. Global State [Beginner]

Be intentional about state location:
- Use **local component state** for UI state that doesn't affect other components
- Use **context** for state that needs to be accessed by multiple components in a subtree
- Use **global state** (Redux, Zustand, Jotai) only for truly application-wide state

### 2. Context + Hooks Pattern [Intermediate]

Create a context-based state management system with custom hooks:

```jsx
// authContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    // Implementation
  };

  const logout = async () => {
    // Implementation
  };

  useEffect(() => {
    // Check stored token
    // Set user and loading state
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Usage in components
const ProfilePage = () => {
  const { user, logout } = useAuth();

  if (!user) return <Redirect to="/login" />;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### 3. State Normalization [Advanced]

For complex data, normalize state to reduce duplication and simplify updates:

```jsx
// Instead of nested arrays of objects:
const [projects, setProjects] = useState([
  { id: 1, name: 'Project A', tasks: [{ id: 101, text: 'Task 1' }] },
  // more projects
]);

// Normalize the data:
const [projects, setProjects] = useState({
  byId: {
    1: { id: 1, name: 'Project A', taskIds: [101, 102] },
    // more projects
  },
  allIds: [1, 2, 3]
});

const [tasks, setTasks] = useState({
  byId: {
    101: { id: 101, text: 'Task 1', projectId: 1 },
    // more tasks
  },
  allIds: [101, 102, 103]
});
```

## Performance Optimization

### 1. Memoization Strategy [Intermediate]

Use memoization strategically to prevent costly recalculations:

```jsx
// Memoize components that receive complex props:
const ExpensiveComponent = React.memo(({ complexData }) => {
  // Rendering logic
});

// Memoize calculation results:
const ProcessedData = ({ rawData }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(rawData);
  }, [rawData]);

  return <DataDisplay data={processedData} />;
};

// Memoize callback functions:
const DataForm = () => {
  const handleSubmit = useCallback((formData) => {
    // Processing logic
  }, [/* dependencies */]);

  return <Form onSubmit={handleSubmit} />;
};
```

### 2. Code Splitting and Lazy Loading [Intermediate]

Implement code splitting for better performance:

```jsx
import { lazy, Suspense } from 'react';

// Instead of importing everything upfront:
// import Dashboard from './Dashboard';
// import Settings from './Settings';
// import Reports from './Reports';

// Use lazy loading:
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Reports = lazy(() => import('./Reports'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  </Suspense>
);
```

### 3. Virtualization for Large Lists [Advanced]

For large datasets, implement virtualization:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedList = ({ items }) => {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].text}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## UX-Driven Layout Organization

### 1. Task-Based Layout Grouping [Beginner]

Components should be organized based on user tasks and mental models rather than technical divisions:

```jsx
// Instead of organizing by component type:
<div className="layout">
  <div className="controls-section">
    <AllControlsHere />
  </div>
  <div className="visualization-section">
    <AllVisualizationsHere />
  </div>
  <div className="information-section">
    <AllInformationHere />
  </div>
</div>

// Organize by user tasks and interaction flow:
<div className="layout">
  <div className="primary-interaction-area">
    <MainVisualization />
    <DirectlyRelatedControls />
  </div>
  <div className="secondary-information">
    <ContextualHelp />
    <AdvancedOptions />
  </div>
</div>
```

### 2. Interaction Proximity Principle [Beginner]

Controls should be placed in close proximity to the elements they affect:

```jsx
// Prefer this placement for tightly coupled controls and visuals
const VisualizationWithControls = () => (
  <div className="visualization-container">
    <Visualization data={data} />
    <div className="controls-directly-below">
      <ControlsAffectingVisualization onChange={updateData} />
    </div>
  </div>
);
```

### 3. Progressive Disclosure Layout Pattern [Intermediate]

Organize layouts to reveal complexity progressively:

```jsx
const SimulationInterface = () => (
  <div className="simulation-layout">
    {/* Primary area: Essential controls and visualization */}
    <div className="primary-interaction-area">
      <EssentialControls />
      <MainVisualization />
    </div>

    {/* Secondary area: Additional information and advanced options */}
    <div className="advanced-options-panel">
      <details>
        <summary>Advanced Options</summary>
        <AdvancedControlsContent />
      </details>
    </div>

    {/* Tertiary area: Educational context and explanations */}
    <div className="educational-resources">
      <TabPanel
        tabs={[
          { label: "Explanation", content: <BasicExplanation /> },
          { label: "Learn More", content: <DetailedTheory /> },
          { label: "Applications", content: <RealWorldExamples /> }
        ]}
      />
    </div>
  </div>
);
```

### 4. Spatial Consistency Pattern [Intermediate]

Establish consistent spatial relationships for interactive elements:

```jsx
// Define consistent layout areas
const ApplicationLayout = ({ children, sidebar }) => (
  <div className="app-layout">
    <main className="interaction-area">
      {children}
    </main>
    <aside className="context-area">
      {sidebar}
    </aside>
  </div>
);

// Usage maintains consistent spatial relationships
<ApplicationLayout
  sidebar={<ContextualInformation />}
>
  <SimulationControls />
  <Visualization />
</ApplicationLayout>
```

### 5. Visual Hierarchy Alignment [Beginner]

Ensure visual hierarchy matches interaction importance:

```jsx
const VisualHierarchyComponent = () => (
  <div className="with-visual-hierarchy">
    {/* Primary focus - largest, most prominent */}
    <div className="primary-focus">
      <h2>Main Visualization</h2>
      <MainVisualization />
    </div>

    {/* Secondary focus - still prominent but less so */}
    <div className="secondary-focus">
      <h3>Essential Controls</h3>
      <PrimaryControls />
    </div>

    {/* Tertiary focus - visually subdued */}
    <div className="tertiary-focus">
      <h4>Additional Information</h4>
      <SupportingInformation />
    </div>
  </div>
);
```

### 6. Responsive Layout Strategy [Intermediate]

Design layouts that adapt meaningfully to different screen sizes:

```jsx
const ResponsiveSimulation = () => (
  <div className="simulation-container">
    {/* On mobile: stacks vertically in order of importance */}
    {/* On desktop: displays in a more spatial arrangement */}
    <div className="visualization-with-controls lg:grid lg:grid-cols-[2fr_1fr] gap-4">
      <div className="visualization-container">
        <Visualization />
      </div>

      <div className="controls-container">
        <SimulationControls />
      </div>
    </div>

    {/* Educational content moves to different positions based on screen size */}
    <div className="educational-content mt-6 lg:grid lg:grid-cols-3 gap-4">
      <ConceptExplanation />
      <ApplicationExamples />
      <FurtherResources />
    </div>
  </div>
);
```

## Accessibility Implementation

### 1. ARIA Roles and States [Beginner]

Implement proper ARIA roles and states for custom components:

```jsx
const Accordion = ({ items }) => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <div key={index} className="accordion-item">
          <h3>
            <button
              className="accordion-trigger"
              onClick={() => setExpandedIndex(index)}
              aria-expanded={expandedIndex === index}
              aria-controls={`panel-${index}`}
              id={`accordion-${index}`}
            >
              {item.title}
              <span className="accordion-icon" aria-hidden="true">
                {expandedIndex === index ? '−' : '+'}
              </span>
            </button>
          </h3>
          <div
            id={`panel-${index}`}
            role="region"
            aria-labelledby={`accordion-${index}`}
            hidden={expandedIndex !== index}
            className="accordion-panel"
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 2. Keyboard Navigation [Beginner]

Implement proper keyboard navigation for interactive components:

```jsx
const Tabs = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef([]);

  const handleKeyDown = (event, index) => {
    let newIndex;

    switch (event.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % items.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setActiveIndex(newIndex);
    tabRefs.current[newIndex].focus();
  };

  return (
    <div className="tabs">
      <div role="tablist" aria-orientation="horizontal">
        {items.map((item, index) => (
          <button
            key={index}
            role="tab"
            id={`tab-${index}`}
            aria-selected={activeIndex === index}
            aria-controls={`panel-${index}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => (tabRefs.current[index] = el)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`panel-${index}`}
          aria-labelledby={`tab-${index}`}
          hidden={activeIndex !== index}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};
```

### 3. Focus Management [Intermediate]

Properly manage focus, especially for modal dialogs:

```jsx
const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      modalRef.current?.focus();
    } else if (previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="close-button"
          >
            ×
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### 4. Semantic HTML [Beginner]

Use proper HTML elements for their intended purpose:

```jsx
// Instead of:
<div className="button" onClick={handleClick}>
  Click Me
</div>

// Use the semantic element:
<button
  className="button"
  onClick={handleClick}
  aria-pressed={isPressed}
>
  Click Me
</button>
```

### 5. Color and Contrast [Beginner]

Ensure sufficient color contrast and don't rely solely on color to convey information:

```jsx
// Instead of indicating status with just color:
<div className={`status ${isActive ? 'green' : 'red'}`}>
  Status
</div>

// Add text or icons to supplement color:
<div
  className={`status ${isActive ? 'active' : 'inactive'}`}
  aria-label={`Status: ${isActive ? 'Active' : 'Inactive'}`}
>
  <span className="status-icon">{isActive ? '✓' : '✗'}</span>
  <span className="status-text">{isActive ? 'Active' : 'Inactive'}</span>
</div>
```

## Code Organization and Project Structure

### 1. Feature-Based Organization [Intermediate]

Organize files by feature rather than by type:

```
src/
├── features/
│   ├── authentication/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   └── products/
│       ├── ...
├── common/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── lib/
│   ├── api.ts
│   └── constants.ts
└── App.tsx
```

### 2. Module Exports Pattern [Beginner]

Use barrel exports for cleaner imports:

```jsx
// features/users/components/index.ts
export * from './UserList';
export * from './UserDetails';
export * from './UserForm';

// Usage in other files
import { UserList, UserDetails, UserForm } from '../features/users/components';
```

### 3. Component Co-location [Beginner]

Keep related files close together:

```
src/features/products/components/ProductCard/
├── ProductCard.jsx
├── ProductCard.test.jsx
├── ProductCard.module.css
├── ProductCardSkeleton.jsx
└── index.js
```

## Testing Strategies

### 1. Component Testing Approach [Beginner]

Focus on testing behavior, not implementation:

```jsx
// Using React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

test('increments counter when button is clicked', async () => {
  // Arrange
  render(<Counter initialCount={0} />);
  const user = userEvent.setup();

  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }));

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. Testing Server Components [Advanced]

Test server components on the server:

```jsx
// Using Jest and React's test renderer
import { renderToString } from 'react-dom/server';
import ProductsList from './ProductsList';

// Mock data fetching
jest.mock('../data/products', () => ({
  getProducts: jest.fn(() => Promise.resolve([
    { id: 1, name: 'Test Product' }
  ]))
}));

test('renders products list server component', async () => {
  // Arrange & Act
  const component = await ProductsList();
  const html = renderToString(component);

  // Assert
  expect(html).toContain('Test Product');
});
```

### 3. End-to-End Testing [Advanced]

Implement E2E tests for critical user flows:

```jsx
// Using Playwright
test('user can log in and access dashboard', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/login');

  // Fill in login form
  await page.fill('[aria-label="Email"]', 'test@example.com');
  await page.fill('[aria-label="Password"]', 'password');
  await page.click('button[type="submit"]');

  // Verify successful login
  await page.waitForURL('/dashboard');
  expect(await page.textContent('h1')).toContain('Dashboard');
});
```

## Integration Patterns

### 1. API Integration [Intermediate]

Use a centralized API client:

```jsx
// lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Hooks for API calls
export const useApiGet = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoint, options);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};
```

### 2. Third-Party Component Integration [Intermediate]

Create wrapper components for third-party libraries:

```jsx
// components/ui/DatePicker.jsx
import { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const DatePicker = ({ value, onChange, label, id, required }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="date-picker-container">
      <label htmlFor={id}>{label}{required && ' *'}</label>
      <input
        id={id}
        type="text"
        value={value ? format(value, 'PPP') : ''}
        onClick={() => setOpen(true)}
        readOnly
        aria-required={required}
        aria-label={label}
      />

      {open && (
        <div className="date-picker-dropdown">
          <DayPicker
            selected={value}
            onDayClick={(day) => {
              onChange(day);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;
```

---

This comprehensive guide provides a foundation for building modern React applications in 2025 that are maintainable, scalable, accessible, and user-friendly. By following these guidelines, you'll create applications that are easier to develop, test, and maintain.
