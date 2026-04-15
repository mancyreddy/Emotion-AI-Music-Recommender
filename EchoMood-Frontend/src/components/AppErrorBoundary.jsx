import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, seconds: 3 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error details for debugging without crashing the whole app
    console.error('App crashed:', error, info);
    this.startReloadCountdown();
  }

  startReloadCountdown() {
    this.interval = setInterval(() => {
      this.setState((s) => ({ seconds: Math.max(0, s.seconds - 1) }));
    }, 1000);
    this.timeout = setTimeout(() => {
      try { window.location.reload(); } catch {}
    }, 10000);
  }

  componentWillUnmount() {
    if (this.interval) clearInterval(this.interval);
    if (this.timeout) clearTimeout(this.timeout);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h3>Something went wrong.</h3>
          <p style={{ opacity: 0.8 }}>Reloading in {this.state.seconds}s…</p>
        </div>
      );
    }
    return this.props.children;
  }
}