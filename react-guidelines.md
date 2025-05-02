# React Component Architecture Guidelines for Tiger Teams

## Team Discussion Transcript

**AA-01 (System Synthesizer/Project Lead):** Let's outline a comprehensive approach to React component architecture that emphasizes code efficiency without sacrificing functionality. The goal is to create guidelines that will help experts maintain high standards while minimizing code bloat.

**FE-01 (Component Craftsman):** I think we should start with core principles for component design. In my experience, the biggest source of line bloat comes from improper component decomposition. We should emphasize atomic design principles.

**DV-01 (Visualization Virtuoso):** Agreed. For data visualization specifically, we need a section on when to abstract visualization logic versus when to create purpose-built components. Chart configurations often get extremely verbose.

**UX-01 (Interface Innovator):** We should integrate shadcn/ui and similar component libraries. They follow a copy-paste approach rather than traditional imports which gives more control over code size and prevents dependency bloat.

**AA-01:** Good point. Let's organize this document to cover core principles first, then specific strategies for line count reduction, followed by architecture patterns and recommended libraries.

**LD-01 (Curious Constructor):** I'd like to see examples of before/after refactoring. It's often easier to learn from concrete examples than abstract principles.

**DO-01 (Automation Architect):** We should also address build optimization. Tree-shaking, code splitting, and proper bundling configurations can dramatically reduce the production code size without sacrificing development experience.

**TE-01 (Education Enthusiast):** Let's ensure we explain the reasoning behind each guideline. Expert teams need to understand the "why" not just the "what" to make appropriate decisions in complex scenarios.

**A11Y-01 (Accessibility Advocate):** While reducing line count is important, we must emphasize that accessibility should never be sacrificed. Sometimes proper accessibility requires additional code, and that's okay.

**II-918 (PhD Specialist):** From a computational perspective, we should discuss algorithmic efficiency alongside code brevity. A mathematically elegant approach often results in more concise code.

**AA-01:** Let's also address state management patterns. Excessive state management code is a major source of verbosity in React applications.

**FE-01:** Component composition over configuration is another principle we should emphasize. It often leads to more readable and maintainable code.

**DV-01:** For complex visualizations, I'd recommend a section on custom hooks that encapsulate data transformation logic. This keeps the component JSX clean while moving complex calculations elsewhere.

**UX-01:** We should recommend specific Tailwind strategies too. Proper use of Tailwind can reduce the need for custom CSS files while maintaining design consistency.

**AA-01:** These are all excellent points. Let's structure this document to be both comprehensive and practical for tiger teams of experts.

**LD-01:** Could we include guidelines for code review specifically focused on identifying opportunities for line count reduction?

**DO-01:** We should address environment-specific code and feature flags. Conditionally including features based on environment can reduce bundle size in production.

**TE-01:** Let's also cover documentation approaches that are concise but effective. JSDoc can be verbose, but there are strategies to make it more efficient.

**A11Y-01:** I'd like to emphasize efficient patterns for keyboard navigation and screen reader support that don't require excessive code.

**II-918:** From a mathematical perspective, we should discuss vectorization and batch processing patterns for data-heavy applications. This can dramatically simplify code.

**AA-01:** Let's compile these insights into a structured document that expert engineers can reference and extend based on their specific project needs.

## Final Guidelines Document

---

# React Component Architecture Guidelines for High-Performance Teams

> **How to use this guide**: This document provides a comprehensive approach to React component architecture with a focus on maintainability, performance, and educational clarity. Use the navigation below to find specific topics, or follow the learning paths marked as [Beginner], [Intermediate], or [Advanced] to progressively build your understanding.

## Table of Contents

- [Core Principles](#core-principles)
- [Strategies for Component Design](#strategies-for-component-design)
- [State Management Optimization](#state-management-optimization)
- [Component Library Integration](#component-library-integration)
- [CSS Optimization with Tailwind](#css-optimization-with-tailwind)
- [Data Visualization Optimization](#data-visualization-optimization)
- [Performance Optimization](#performance-optimization)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Testing Strategies](#testing-strategies)
- [Advanced Patterns for Expert Teams](#advanced-patterns-for-expert-teams)
- [Code Review Guidelines for Line Reduction](#code-review-guidelines-for-line-reduction)
- [Implementation Checklist](#implementation-checklist)

## Learning Paths

### Beginner Path
1. Start with [Core Principles](#core-principles) to understand fundamental React concepts
2. Learn about [Component Decomposition](#1-component-decomposition) to structure your components effectively
3. Explore [Local vs. Global State](#1-local-vs-global-state) to understand state management basics
4. Study [Accessibility Guidelines](#accessibility-guidelines) to ensure your components are usable by everyone
5. Learn [Basic Testing Strategies](#1-component-testing-approach-beginner) for reliable components

### Intermediate Path
1. Implement [Custom Hooks for Logic Extraction](#2-custom-hooks-for-logic-extraction) to separate concerns
2. Apply [Component Composition Over Configuration](#2-component-composition-over-configuration) for more flexible components
3. Explore [CSS Optimization with Tailwind](#css-optimization-with-tailwind) for efficient styling
4. Learn [Memoization Strategy](#1-memoization-strategy) for performance optimization
5. Practice [Test-Driven Development](#2-test-driven-development-intermediate) for better code quality

### Advanced Path
1. Master [Advanced State Management](#state-management-optimization) for complex applications
2. Implement [Virtualization for Long Lists](#2-virtualization-for-long-lists) for handling large datasets
3. Apply [Advanced Component Patterns](#advanced-patterns-for-expert-teams) for sophisticated use cases
4. Explore [Data Visualization Optimization](#data-visualization-optimization) for complex data representation
5. Implement [Advanced Accessibility Features](#2-aria-attributes-intermediate) for inclusive applications

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

### 5. Component Lifecycle Management [Intermediate]

Understand and properly manage component lifecycle, especially with hooks:

```jsx
function DataComponent({ id }) {
  // 1. State initialization
  const [data, setData] = useState(null);

  // 2. Side effects with proper cleanup
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const result = await api.getData(id);
      if (isMounted) setData(result);
    };

    fetchData();

    // Cleanup function prevents state updates after unmount
    return () => { isMounted = false; };
  }, [id]); // Only re-run when id changes

  // 3. Render based on component state
  if (!data) return <Loading />;
  return <DisplayData data={data} />;
}
```

**Why it matters**: Proper lifecycle management prevents memory leaks, unnecessary re-renders, and race conditions in asynchronous operations.

## Strategies for Component Design

### 1. Component Decomposition [Beginner]

Break large components into smaller, focused sub-components. This not only improves readability but also enables better reuse and testing.

**Before decomposition (80+ lines):**
```jsx
const UserDashboard = () => {
  // State declarations, effects, handlers
  // ...50+ lines of logic...

  return (
    <div className="dashboard">
      {/* 30+ lines of JSX */}
    </div>
  );
};
```

**After decomposition (20+ lines):**
```jsx
const UserDashboard = () => {
  // Core dashboard state and logic
  // ...10+ lines of logic...

  return (
    <div className="dashboard">
      <UserStats stats={userStats} />
      <RecentActivity activities={activities} />
      <UserActions onAction={handleAction} />
    </div>
  );
};
```

**Why it matters**: Smaller components are easier to understand, test, and maintain. They also promote reuse across your application, reducing duplication.

### 2. Custom Hooks for Logic Extraction [Intermediate]

Move complex state logic, calculations, and side effects into custom hooks. This keeps components focused on rendering and interaction.

**Before: Logic embedded in component**
```jsx
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Network response failed');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Render logic with loading/error states
};
```

**After: Logic extracted to custom hook**
```jsx
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Network response failed');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
};

const ProductList = () => {
  const { products, loading, error } = useProducts();
  // Clean render logic with loading/error states
};
```

**Why it matters**: Custom hooks create reusable logic that can be shared across components. They also make components more focused on their primary responsibility: rendering UI.

### 3. Conditional Rendering Patterns [Beginner]

Use efficient patterns for conditional rendering to reduce verbosity and improve readability.

**Instead of nested ternaries:**
```jsx
{isLoading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage message={error} />
) : data.length === 0 ? (
  <EmptyState />
) : (
  <DataDisplay data={data} />
)}
```

**Prefer early returns:**
```jsx
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (data.length === 0) return <EmptyState />;
return <DataDisplay data={data} />;
```

**Or use a mapping approach for complex conditions:**
```jsx
const componentMap = {
  loading: <LoadingSpinner />,
  error: <ErrorMessage message={error} />,
  empty: <EmptyState />,
  data: <DataDisplay data={data} />
};

const state = isLoading ? 'loading' :
              error ? 'error' :
              data.length === 0 ? 'empty' : 'data';
return componentMap[state];
```

**Why it matters**: Clear conditional rendering patterns make your code more readable and easier to maintain. They also help prevent bugs by making the rendering logic more explicit.

### 4. Destructuring and Default Props [Beginner]

Use destructuring and default values to simplify prop handling.

**Instead of:**
```jsx
function UserCard(props) {
  const name = props.name || 'Anonymous';
  const role = props.role || 'User';
  const avatar = props.avatar || defaultAvatar;
  // ...
}
```

**Use destructuring with default values:**
```jsx
function UserCard({
  name = 'Anonymous',
  role = 'User',
  avatar = defaultAvatar
}) {
  // Component body is now cleaner
}
```

**Why it matters**: Destructuring makes your code more concise and clearly communicates the props your component expects. Default values provide fallbacks that make your components more robust.

### 5. Implicit Returns for Simple Components [Beginner]

Use arrow functions with implicit returns for simple components.

**Instead of:**
```jsx
const StatusIndicator = ({ status }) => {
  return (
    <div className={`status-indicator ${status}`}>
      {statusLabels[status]}
    </div>
  );
};
```

**Use implicit return:**
```jsx
const StatusIndicator = ({ status }) => (
  <div className={`status-indicator ${status}`}>
    {statusLabels[status]}
  </div>
);
```

**Why it matters**: Implicit returns make simple components more concise and easier to read at a glance. They also signal to other developers that the component is straightforward.

### 6. Component Composition Patterns [Intermediate]

Use composition patterns to create flexible, reusable components.

```jsx
// Compound components pattern
function Tabs({ children, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Pass context to children
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

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

**Why it matters**: Composition patterns create more flexible APIs that give consumers control over the rendered output while maintaining the component's core functionality.

## State Management Optimization

### 1. Local vs. Global State

Be intentional about state location. Not everything needs to be in global state.

- Use **local component state** for UI state that doesn't affect other components
- Use **context** for state that needs to be accessed by multiple components in a subtree
- Use **global state** (Redux, Zustand, Jotai) only for truly application-wide state

### 2. State Normalization

For complex data, normalize state to reduce duplication and simplify updates.

```jsx
// Instead of nested arrays of objects:
const [projects, setProjects] = useState([
  { id: 1, name: 'Project A', tasks: [{ id: 101, text: 'Task 1' }, /* more tasks */] },
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

### 3. Immutable Update Patterns

Use concise patterns for immutable state updates.

```jsx
// Instead of spread operators for deep updates:
setUser({
  ...user,
  preferences: {
    ...user.preferences,
    theme: {
      ...user.preferences.theme,
      mode: 'dark'
    }
  }
});

// Use immer (via use-immer hook) for cleaner updates:
updateUser(draft => {
  draft.preferences.theme.mode = 'dark';
});
```

## Component Library Integration

### 1. shadcn/ui Integration Approach

shadcn/ui provides high-quality React components built on Radix UI primitives. The unique copy-paste approach gives you full control over your components.

Installation and setup:

```bash
# Initialize shadcn/ui in your project
npx shadcn-ui@latest init
```

Key benefits for code reduction:

- No need to reinvent common UI patterns
- Built-in accessibility reduces need for custom a11y code
- Tailwind integration eliminates separate CSS files
- Copy-paste approach allows removing unused features

### 2. Component Customization Strategy

When using shadcn/ui or similar libraries, follow these practices:

1. Start with the base component implementation
2. Remove unused features and props
3. Extend functionality only when necessary
4. Create specialized wrappers rather than modifying base components

Example of a customized button component:

```jsx
// components/ui/button.jsx - Base shadcn implementation
// Import and use as-is, removing unused variants

// components/CustomButton.jsx - Specialized wrapper
import { Button } from "@/components/ui/button";

export const SubmitButton = ({ children, isLoading, ...props }) => (
  <Button {...props} disabled={isLoading || props.disabled}>
    {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
    {children}
  </Button>
);
```

### 3. Recommended Component Libraries

- **shadcn/ui**: Copy-paste components built on Radix UI
- **Headless UI**: Unstyled, accessible components
- **Radix UI**: Low-level primitives for custom components
- **React Aria**: Hooks for accessible UI primitives
- **Tailwind UI**: Commercial component collection using Tailwind CSS

## CSS Optimization with Tailwind

### 1. Utility-First Approach

Embrace Tailwind's utility-first philosophy to eliminate the need for custom CSS files.

```jsx
// Instead of custom CSS:
// Button.css
// .button { padding: 0.5rem 1rem; border-radius: 0.25rem; font-weight: 500; }
// .button-primary { background-color: blue; color: white; }

// <button className="button button-primary">Click Me</button>

// Use Tailwind utilities:
<button className="px-4 py-2 rounded font-medium bg-blue-500 text-white">
  Click Me
</button>
```

### 2. Component Class Extraction

For repeated class combinations, use Tailwind's apply directive or extract them into variables.

```jsx
// For repeated class combinations:
const buttonClasses = "px-4 py-2 rounded font-medium";
const primaryButtonClasses = `${buttonClasses} bg-blue-500 text-white`;

<button className={primaryButtonClasses}>Primary Action</button>
<button className={`${buttonClasses} bg-gray-200 text-gray-800`}>Secondary Action</button>
```

### 3. Responsive Design Optimization

Use Tailwind's responsive modifiers to create responsive layouts without media queries.

```jsx
// Instead of complex media query logic:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## Data Visualization Optimization

### 1. Data Transformation Separation

Move data transformation logic outside of rendering components.

```jsx
// Before:
const ChartComponent = ({ rawData }) => {
  // Data transformation inside component
  const transformedData = rawData.map(item => ({
    x: new Date(item.timestamp).toLocaleDateString(),
    y: item.value,
    category: item.type
  }));

  // More transformations...

  return <LineChart data={transformedData} />;
};

// After:
// Data hook:
const useChartData = (rawData) => {
  return useMemo(() => {
    return rawData.map(item => ({
      x: new Date(item.timestamp).toLocaleDateString(),
      y: item.value,
      category: item.type
    }));
  }, [rawData]);
};

// Component:
const ChartComponent = ({ rawData }) => {
  const transformedData = useChartData(rawData);
  return <LineChart data={transformedData} />;
};
```

### 2. Chart Configuration Patterns

Create reusable chart configurations to avoid repetition.

```jsx
// Define base configurations:
const baseChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  cartesianGrid: { strokeDasharray: '3 3' },
  tooltip: { formatter: value => `${value.toFixed(2)}` }
};

// Extend for specific chart types:
const lineChartConfig = {
  ...baseChartConfig,
  line: { type: 'monotone', strokeWidth: 2, dot: false }
};

// Use in components:
const SimpleLineChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data} margin={lineChartConfig.margin}>
      <CartesianGrid strokeDasharray={lineChartConfig.cartesianGrid.strokeDasharray} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip formatter={lineChartConfig.tooltip.formatter} />
      <Line
        type={lineChartConfig.line.type}
        dataKey="value"
        stroke="#8884d8"
        strokeWidth={lineChartConfig.line.strokeWidth}
        dot={lineChartConfig.line.dot}
      />
    </LineChart>
  </ResponsiveContainer>
);
```

### 3. Conditional Chart Features

Use function components for chart elements that may be conditionally included.

```jsx
const ChartWithOptionalFeatures = ({ data, showLegend, showTooltip }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      {showTooltip && <Tooltip />}
      {showLegend && <Legend />}
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  </ResponsiveContainer>
);
```

## Performance Optimization

### 1. Memoization Strategy

Use memoization strategically to prevent costly recalculations.

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

### 2. Virtualization for Long Lists

Use virtualization for long lists to reduce DOM nodes.

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

### 3. Code Splitting and Lazy Loading

Use dynamic imports for code splitting.

```jsx
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

## Accessibility Guidelines

### 1. Keyboard Navigation [Beginner]

Ensure all interactive elements are keyboard accessible.

```jsx
// Instead of using a div for a button:
<div onClick={handleClick}>Click Me</div>

// Use the appropriate semantic element:
<button onClick={handleClick}>Click Me</button>

// Or for custom components, ensure proper keyboard handling:
<CustomButton
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
  aria-pressed={isPressed}
>
  Click Me
</CustomButton>
```

**Why it matters**: Many users rely on keyboards for navigation. Proper keyboard support ensures your application is usable by people with motor disabilities or those who prefer keyboard navigation.

### 2. ARIA Attributes [Intermediate]

Use ARIA attributes to enhance accessibility when HTML semantics aren't sufficient.

```jsx
// For a custom dropdown:
<div role="combobox" aria-expanded={isOpen} aria-controls="dropdown-list">
  {selectedOption}
  <button
    aria-label="Open options"
    onClick={toggleDropdown}
  >
    ▼
  </button>
  <ul
    id="dropdown-list"
    role="listbox"
    aria-hidden={!isOpen}
  >
    {options.map(option => (
      <li
        key={option.id}
## Testing Strategies

### 1. Component Testing Approach [Beginner]

Use a combination of unit, integration, and end-to-end tests for comprehensive coverage.

```jsx
// Component to test
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p data-testid="count-value">{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// Unit test with React Testing Library
test('increments counter when button is clicked', () => {
  render(<Counter />);

  // Initial state check
  expect(screen.getByTestId('count-value')).toHaveTextContent('0');

  // Interaction
  userEvent.click(screen.getByRole('button', { name: /increment/i }));

  // Updated state check
  expect(screen.getByTestId('count-value')).toHaveTextContent('1');
});
```

**Why it matters**: A balanced testing approach ensures your components work correctly in isolation and in the context of the larger application, catching bugs before they reach production.

### 2. Test-Driven Development [Intermediate]

Write tests before implementing features to ensure code meets requirements.

```jsx
// 1. Write the test first
test('filters items by status', () => {
  // Setup
  const items = [
    { id: 1, name: 'Item 1', status: 'active' },
    { id: 2, name: 'Item 2', status: 'completed' },
    { id: 3, name: 'Item 3', status: 'active' }
  ];

  // Render with props
  render(<ItemList items={items} />);

  // All items should be visible initially
  expect(screen.getAllByRole('listitem')).toHaveLength(3);

  // Filter by status
  userEvent.click(screen.getByRole('button', { name: /show active/i }));

  // Only active items should be visible
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 3')).toBeInTheDocument();
  expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
});

// 2. Then implement the component to pass the test
function ItemList({ items }) {
  const [filter, setFilter] = useState('all');

  const filteredItems = items.filter(item =>
    filter === 'all' || item.status === filter
  );

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>Show All</button>
        <button onClick={() => setFilter('active')}>Show Active</button>
        <button onClick={() => setFilter('completed')}>Show Completed</button>
      </div>
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Why it matters**: TDD ensures your code meets requirements from the start and provides a safety net for refactoring. It also helps you design components with testability in mind.

### 3. Mock Dependencies [Intermediate]

Isolate components from external dependencies using mocks.

```jsx
// Component with external dependency
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUser(userId)
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  return <div>{user.name}</div>;
}

// Test with mocked API
jest.mock('../api');

test('renders user data when loaded', async () => {
  // Setup mock
  api.getUser.mockResolvedValue({ id: '123', name: 'John Doe' });

  // Render component
  render(<UserProfile userId="123" />);

  // Check loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for data to load
  await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

  // Check rendered data
  expect(screen.getByText('John Doe')).toBeInTheDocument();

  // Verify API was called correctly
  expect(api.getUser).toHaveBeenCalledWith('123');
});
```

**Why it matters**: Mocking dependencies makes tests faster, more reliable, and focused on the component's behavior rather than external systems.

### 4. Snapshot Testing [Beginner]

Use snapshot tests to detect unexpected UI changes.

```jsx
// Snapshot test
test('renders correctly', () => {
  const { container } = render(
    <Button variant="primary" size="large">
      Submit
    </Button>
  );

  expect(container).toMatchSnapshot();
});
```

**Why it matters**: Snapshot tests provide a quick way to detect unintended UI changes, serving as a complement to more specific assertions.

### 5. Testing Custom Hooks [Advanced]

Test custom hooks in isolation using the React Hooks Testing Library.

```jsx
// Custom hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// Test
test('should increment counter', () => {
  const { result } = renderHook(() => useCounter(0));

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

**Why it matters**: Testing hooks in isolation ensures they work correctly before being used in components, making it easier to identify and fix issues.
        role="option"
        aria-selected={option.id === selectedOption.id}
      >
        {option.label}
      </li>
    ))}
  </ul>
</div>
```

**Why it matters**: ARIA attributes provide additional context to assistive technologies, making complex UI components more understandable and usable for people with disabilities.

### 3. Focus Management [Intermediate]

Manage focus properly, especially in modal dialogs and dynamic content.

```jsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  // Move focus to the modal when it opens
  useEffect(() => {
    if (isOpen) {
      // Store the current active element to restore focus later
      const previouslyFocused = document.activeElement;

      // Focus the modal
      modalRef.current?.focus();

      // Restore focus when the modal closes
      return () => {
        previouslyFocused?.focus();
      };
    }
  }, [isOpen]);

  // Trap focus within the modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Add focus trapping logic here
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

**Why it matters**: Proper focus management ensures that keyboard users can navigate your application effectively, especially when content changes dynamically.

### 4. Accessible Forms [Beginner]

Create forms that are accessible to all users.

```jsx
// Instead of:
<div>
  <input type="text" onChange={handleNameChange} />
  <span className="error">{nameError}</span>
</div>

// Use proper labeling and error association:
<div>
  <label htmlFor="name-input">Name</label>
  <input
    id="name-input"
    type="text"
    onChange={handleNameChange}
    aria-invalid={!!nameError}
    aria-describedby={nameError ? "name-error" : undefined}
  />
  {nameError && (
    <span id="name-error" className="error" role="alert">
      {nameError}
    </span>
  )}
</div>
```

**Why it matters**: Accessible forms ensure that all users can input data and receive feedback about errors, regardless of their abilities or the assistive technologies they use.

### 5. Color and Contrast [Beginner]

Ensure sufficient color contrast and don't rely solely on color to convey information.

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

**Why it matters**: Sufficient color contrast ensures content is readable for users with low vision or color blindness. Providing multiple cues beyond color ensures information is accessible to everyone.
## Advanced Patterns for Expert Teams

### 1. Render Props vs. Hooks

Choose the right abstraction pattern based on use case.

```jsx
// Render props for complex UI composition:
<DataProvider>
  {(data, loading, error) => (
    // Complex rendering logic
  )}
</DataProvider>

// Hooks for reusable logic:
const { data, loading, error } = useDataProvider();
```

### 2. Higher-Order Components (HOCs)

Use HOCs sparingly and prefer hooks when possible.

```jsx
// Instead of multiple nested HOCs:
export default withRouter(withTheme(withAuth(MyComponent)));

// Prefer hooks approach:
const MyComponent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  // Component logic
};
```

### 3. Component API Design

Design component APIs that are intuitive and minimize boilerplate.

```jsx
// Instead of boolean props for variants:
<Button primary size="large" outline />

// Prefer a variant prop:
<Button variant="primary" size="large" />

// Allow children for flexible composition:
<Button variant="primary">
  <Icon name="save" />
  <span>Save Changes</span>
</Button>
```

## Code Review Guidelines for Line Reduction

When reviewing code, look for these opportunities to reduce line count while maintaining functionality:

1. **Redundant State**: Is each piece of state necessary or can it be derived?
2. **Component Size**: Should this component be broken down further?
3. **Repeated Logic**: Can this pattern be abstracted into a hook or utility?
4. **Prop Drilling**: Is there unnecessary passing of props through components?
5. **Inline Styles**: Can these be replaced with Tailwind classes?
6. **Verbose Conditionals**: Can these be simplified or extracted?
7. **Unused Features**: Is the component carrying unnecessary functionality?
8. **Copy-Pasted Code**: Is there duplication that could be abstracted?

## Implementation Checklist

- [ ] Set up Tailwind CSS and PostCSS optimization
- [ ] Install and configure shadcn/ui components
- [ ] Create custom hook library for common patterns
- [ ] Establish component structure following atomic design
- [ ] Configure ESLint rules for enforcing best practices
- [ ] Set up build optimization for tree-shaking and code splitting
- [ ] Create documentation templates for component APIs
- [ ] Establish testing patterns that don't increase code size

## Conclusion

These guidelines provide a framework for expert React developers to build sophisticated applications while maintaining code efficiency. The focus is on intentional design decisions that create the right balance between functionality, clarity, and conciseness.

Remember that the ultimate goal is not having the fewest lines of code possible, but rather having exactly the right amount of code needed to solve the problem clearly and efficiently.

---

*This document was prepared by the React Tiger Team for high-performance React development.*
