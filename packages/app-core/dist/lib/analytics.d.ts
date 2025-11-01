/**
 * Analytics and Monitoring System
 *
 * Comprehensive system for tracking tool usage, performance,
 * and user behavior to enable data-driven decisions.
 */
export interface AnalyticsEvent {
    id: string;
    timestamp: Date;
    eventType: 'tool_usage' | 'conversion' | 'error' | 'performance' | 'user_interaction';
    toolId?: string;
    userId?: string;
    sessionId: string;
    data: Record<string, any>;
    metadata?: {
        userAgent?: string;
        platform?: string;
        version?: string;
        referrer?: string;
    };
}
export interface ToolUsageEvent extends AnalyticsEvent {
    eventType: 'tool_usage';
    data: {
        action: 'start' | 'complete' | 'cancel';
        inputFormat: string;
        outputFormat: string;
        fileSize: number;
        processingTime?: number;
        success?: boolean;
        errorMessage?: string;
    };
}
export interface PerformanceMetrics {
    toolId: string;
    averageProcessingTime: number;
    totalUsage: number;
    successRate: number;
    averageFileSize: number;
    peakUsage: number;
    errorRate: number;
    popularFormats: Array<{
        format: string;
        count: number;
    }>;
    timeRange: {
        start: Date;
        end: Date;
    };
}
export interface UsageStatistics {
    totalConversions: number;
    totalUsers: number;
    totalFilesSizeMB: number;
    popularTools: Array<{
        toolId: string;
        usage: number;
        name?: string;
    }>;
    formatDistribution: Record<string, number>;
    platformDistribution: Record<string, number>;
    errorTypes: Record<string, number>;
    timeSeriesData: Array<{
        timestamp: Date;
        value: number;
    }>;
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    condition: {
        metric: string;
        operator: '>' | '<' | '=' | '>=' | '<=';
        threshold: number;
        timeWindow: number;
    };
    actions: Array<{
        type: 'email' | 'webhook' | 'log';
        target: string;
        template?: string;
    }>;
    enabled: boolean;
    lastTriggered?: Date;
}
export declare class AnalyticsManager {
    private events;
    private maxEvents;
    private storage;
    private alerts;
    private metricsCache;
    constructor(storage: AnalyticsStorage);
    /**
     * Track an analytics event
     */
    track(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Track tool usage
     */
    trackToolUsage(toolId: string, action: 'start' | 'complete' | 'cancel', sessionId: string, data: {
        inputFormat: string;
        outputFormat: string;
        fileSize: number;
        processingTime?: number;
        success?: boolean;
        errorMessage?: string;
    }, metadata?: AnalyticsEvent['metadata']): Promise<void>;
    /**
     * Track performance metrics
     */
    trackPerformance(toolId: string, sessionId: string, metrics: {
        processingTime: number;
        memoryUsage?: number;
        cpuUsage?: number;
        fileSize: number;
    }): Promise<void>;
    /**
     * Track errors
     */
    trackError(toolId: string | undefined, sessionId: string, error: {
        message: string;
        code?: string;
        stack?: string;
        context?: Record<string, any>;
    }): Promise<void>;
    /**
     * Get tool performance metrics
     */
    getToolMetrics(toolId: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<PerformanceMetrics | null>;
    /**
     * Get overall usage statistics
     */
    getUsageStatistics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<UsageStatistics>;
    /**
     * Set up alert rule
     */
    setAlertRule(rule: AlertRule): void;
    /**
     * Check alerts against current event
     */
    private checkAlerts;
    /**
     * Evaluate alert condition
     */
    private evaluateAlertCondition;
    /**
     * Trigger alert
     */
    private triggerAlert;
    /**
     * Initialize default alert rules
     */
    private initializeDefaultAlerts;
    /**
     * Cache management
     */
    private getFromCache;
    private setCache;
    private invalidateCache;
    /**
     * Generate unique event ID
     */
    private generateEventId;
}
/**
 * Storage interface for analytics data
 */
export interface AnalyticsStorage {
    saveEvent(event: AnalyticsEvent): Promise<void>;
    getEvents(filters?: {
        eventType?: string;
        toolId?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
        limit?: number;
    }): Promise<AnalyticsEvent[]>;
    deleteOldEvents(beforeDate: Date): Promise<number>;
}
/**
 * In-memory storage implementation (for development/testing)
 */
export declare class InMemoryAnalyticsStorage implements AnalyticsStorage {
    private events;
    saveEvent(event: AnalyticsEvent): Promise<void>;
    getEvents(filters?: Parameters<AnalyticsStorage['getEvents']>[0]): Promise<AnalyticsEvent[]>;
    deleteOldEvents(beforeDate: Date): Promise<number>;
}
/**
 * Create analytics manager with in-memory storage
 */
export declare function createAnalyticsManager(): AnalyticsManager;
//# sourceMappingURL=analytics.d.ts.map