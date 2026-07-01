import { createRoot } from 'react-dom/client'
import { Component } from 'react'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: 'red', padding: 20, whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {'RENDER ERROR:\n' + this.state.error.message + '\n\n' + this.state.error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}

window.onerror = (msg, src, line, col, err) => {
  document.getElementById('root').innerHTML =
    `<pre style="color:red;padding:20px;white-space:pre-wrap">JS ERROR:\n${msg}\n${src}:${line}\n${err?.stack || ''}</pre>`;
};
window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root').innerHTML =
    `<pre style="color:red;padding:20px;white-space:pre-wrap">Unhandled Promise:\n${e.reason?.stack || e.reason}</pre>`;
});

createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
)
