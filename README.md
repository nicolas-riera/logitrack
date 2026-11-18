# Logitrack

LogiTrack is designed for warehouse logistics coordinators operating on lightweight terminals. To ensure maximum performance and adhere to strict technical constraints, the application is built without any heavy frontend frameworks or UI libraries (such as React, Vue, Tailwind, or Bootstrap). Instead, it relies on modern native web standards, direct DOM manipulation, and asynchronous REST API integration.

## Project Structure & Architectural Choices
The repository is organized into clear, isolated directories separating documentation, frontend source code, and the backend API:

```
logitrack/
├── docs/                       # Wireframes (SVG) and project specifications
├── frontend/                   # Client-side Vanilla JS application[cite: 9]
│   ├── src/
│   │   ├── api/                # Asynchronous REST API calls (fetch / async-await)
│   │   │   └── shipmentsApi.js
│   │   ├── components/         # Modular UI & DOM manipulation components
│   │   │   ├── dropdown.js
│   │   │   ├── navigation.js
│   │   │   ├── networkState.js
│   │   │   └── shipmentModal.js
│   │   ├── core/               # App constants & helper utilities (debounce, storage)
│   │   │   ├── constants.js
│   │   │   └── utils.js
│   │   └── dashboard.js        # Main entry point & centralized state/event handling[cite: 9]
│   ├── styles/                 # Modular pure CSS architecture (Grid & Flexbox)
│   │   ├── components/         # Component-specific stylesheets (dialog, sidebar, etc.)[cite: 9]
│   │   ├── core.css
│   │   └── dashboard.css
│   └── index.html              # Semantic HTML5 markup[cite: 3, 9]
└── logitrack_backend/          # Local REST API server[cite: 9]
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended) installed on your machine.
- A modern web browser (Chrome, Firefox, Edge, Safari).

### 1. Backend Setup

Navigate to the backend directory (or clone the official repository if not already present) and start the local API server:

```bash
git clone https://github.com/PlateformeProjects/logitrack_backend.git
```` 

```bash
cd logitrack_backend
```

```bash
npm install
```

```bash
npm start
```

### 2. Frontend Setup

Because the frontend uses native ES Modules (type="module"), it must be served over HTTP rather than opened directly via the file:// protocol:

```bash
cd frontend
npx serve .
```

Open the provided local URL in your browser to access the dashboard.

## Technical Explanations

### 1. Debounce Optimization

Real-time text searching (filtering by tracking number or recipient name) triggers input events on every single keystroke. Without rate-limiting, rapid typing would trigger redundant filtering calculations, DOM re-renders, or unnecessary API requests.

- How it works: the Debounce higher-order function wraps the search callback and manages a ``setTimeout`` timer. Each time the user types a character, any pending timer is cleared (``clearTimeout``) and reset for a fixed delay (250–300 ms). The search handler only executes once the user pauses typing for that duration.
- Benefit: Prevents main-thread congestion and unnecessary network overhead, ensuring smooth, responsive input handling even on low-power warehouse terminals.   

### 2. Event Delegation

Attaching individual ``addEventListener`` callbacks to every dynamically generated shipment row, card, or action button scales poorly and complicates DOM updates.

- How it works: Leveraging the DOM event bubbling phase, a single event listener is attached to a static parent container. When a click occurs anywhere inside the container, the handler inspects event.target.closest('[data-action]') (or the target card selector) to identify which element was interacted with and extract its dataset attributes (such as the shipment ID).

- Benefit: Keeps memory consumption minimal, eliminates the need to re-bind listeners whenever the shipment list is re-rendered after filtering or sorting, and prevents memory leaks from orphaned DOM nodes.