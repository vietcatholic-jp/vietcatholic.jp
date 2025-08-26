"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { TEAM_MANAGEMENT_ERRORS } from "@/lib/types/team-management";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class TeamManagementErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Team Management Error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const getErrorMessage = (error?: Error) => {
    if (!error) return TEAM_MANAGEMENT_ERRORS.UNKNOWN_ERROR;
    
    if (error.message.includes("fetch")) {
      return TEAM_MANAGEMENT_ERRORS.NETWORK_ERROR;
    }
    
    if (error.message.includes("unauthorized") || error.message.includes("401")) {
      return TEAM_MANAGEMENT_ERRORS.UNAUTHORIZED;
    }
    
    if (error.message.includes("team") && error.message.includes("not found")) {
      return TEAM_MANAGEMENT_ERRORS.TEAM_NOT_FOUND;
    }
    
    return error.message || TEAM_MANAGEMENT_ERRORS.UNKNOWN_ERROR;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-red-600">Đã xảy ra lỗi</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {getErrorMessage(error)}
        </p>
        {retry && (
          <Button onClick={retry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Specific error fallbacks for different components
export function TeamOverviewErrorFallback({ retry }: ErrorFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Lỗi tải thông tin nhóm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Không thể tải thông tin nhóm. Vui lòng thử lại.
        </p>
        {retry && (
          <Button onClick={retry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function MemberListErrorFallback({ retry }: ErrorFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Lỗi tải danh sách thành viên
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Không thể tải danh sách thành viên. Vui lòng thử lại.
        </p>
        {retry && (
          <Button onClick={retry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Async error:", error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

export default TeamManagementErrorBoundary;
