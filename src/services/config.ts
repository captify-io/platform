import type { MenuItem } from '../types';

export const config: MenuItem[] = [
  {
    "id": "pmbook-ops",
    "label": "Operations",
    "icon": "layout-dashboard",
    "href": "#",
    "order": 0,
    "children": [
      {
        "id": "pmbook-ops-insights",
        "label": "Insights",
        "icon": "eye",
        "href": "/ops/insights",
        "order": 0
      },
      {
        "id": "pmbook-ops-contracts",
        "label": "Contracts",
        "icon": "file-text",
        "href": "/ops/contracts",
        "order": 1
      },
      {
        "id": "pmbook-ops-people",
        "label": "People",
        "icon": "users",
        "href": "/ops/people",
        "order": 2
      },
      {
        "id": "pmbook-ops-performance",
        "label": "Performance",
        "icon": "bar-chart",
        "href": "/ops/performance",
        "order": 3
      }
    ]
  },
  {
    "id": "pmbook-execution",
    "label": "Execution",
    "icon": "briefcase",
    "href": "#",
    "order": 1,
    "children": [
      {
        "id": "pmbook-exe-value-streams",
        "label": "Value Streams",
        "icon": "git-branch",
        "href": "/exe/value-streams",
        "order": 0
      },
      {
        "id": "pmbook-exe-tickets",
        "label": "My Tickets",
        "icon": "check-square",
        "href": "/exe/my-tickets",
        "order": 1
      },
      {
        "id": "pmbook-service-hub",
        "label": "Service Hub",
        "icon": "users",
        "href": "/exe/service-hub",
        "order": 2
      }
    ]
  }
];

export default config;