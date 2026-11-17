import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `${parsed.error} (${parsed.operationType} on ${parsed.path || 'database'})`;
        }
      } catch {
        // plain error message
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#edf3e6] p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <h1 className="font-display text-xl font-bold text-stone-900">
              Ente Veedu ran into a connection issue
            </h1>
            <p className="mt-2 text-sm text-stone-600 break-words">{friendly}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 w-full h-11 rounded-xl bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-900 transition-colors"
            >
              Reload Village
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
