---
template: default
duration: 90
marker: Architecture
transition: fade
---

```mermaid
graph LR
    Browser1[Display View] -->|WebSocket| Server
    Browser2[Presenter View] -->|WebSocket| Server
    Server --> Controller[Presentation Controller]
    Controller --> Presentation
    Presentation --> Slides[(Markdown Files)]
```

---

Walk through the architecture diagram. The server holds all state, and both browser views connect via WebSockets. The controller manages navigation and timing, while the presentation loads slides from disk.
