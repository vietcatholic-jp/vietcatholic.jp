"use client";

import { AnalyticsProvider, useAnalytics } from "./AnalyticsProvider";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { SummaryReport } from "./SummaryReport";
import { ShirtSizeReport, ProvinceReport, DioceseReport } from "./DetailedReport";

function AnalyticsContent() {
  const { filters } = useAnalytics();

  const renderReport = () => {
    switch (filters.reportType) {
      case 'shirt-size':
        return <ShirtSizeReport />;
      case 'province':
        return <ProvinceReport />;
      case 'diocese':
        return <DioceseReport />;
      default:
        return <SummaryReport />;
    }
  };

  return (
    <div className="space-y-6">
      <AnalyticsFilters />
      {renderReport()}
    </div>
  );
}

interface AnalyticsDashboardProps {
  apiEndpoint?: string;
}

export function AnalyticsDashboard({ apiEndpoint }: AnalyticsDashboardProps) {
  return (
    <AnalyticsProvider apiEndpoint={apiEndpoint}>
      <AnalyticsContent />
    </AnalyticsProvider>
  );
}