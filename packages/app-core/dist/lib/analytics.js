/**
 * Analytics and Monitoring System
 *
 * Comprehensive system for tracking tool usage, performance,
 * and user behavior to enable data-driven decisions.
 */
export class AnalyticsManager {
    events = [];
    maxEvents = 10000;
    storage;
    alerts = new Map();
    metricsCache = new Map();
    constructor(storage) {
        this.storage = storage;
        this.initializeDefaultAlerts();
    }
    /**
     * Track an analytics event
     */
    async track(event) {
        const fullEvent = {
            id: this.generateEventId(),
            timestamp: new Date(),
            ...event
        };
        // Add to in-memory storage
        this.events.push(fullEvent);
        // Maintain max events limit
        if (this.events.length > this.maxEvents) {
            this.events.splice(0, this.events.length - this.maxEvents);
        }
        // Persist to storage
        await this.storage.saveEvent(fullEvent);
        // Check alerts
        await this.checkAlerts(fullEvent);
        // Invalidate related cache
        this.invalidateCache(['usage', 'performance', event.toolId].filter(Boolean));
    }
    /**
     * Track tool usage
     */
    async trackToolUsage(toolId, action, sessionId, data, metadata) {
        await this.track({
            eventType: 'tool_usage',
            toolId,
            sessionId,
            data: {
                action,
                ...data
            },
            metadata
        });
    }
    /**
     * Track performance metrics
     */
    async trackPerformance(toolId, sessionId, metrics) {
        await this.track({
            eventType: 'performance',
            toolId,
            sessionId,
            data: metrics
        });
    }
    /**
     * Track errors
     */
    async trackError(toolId, sessionId, error) {
        await this.track({
            eventType: 'error',
            toolId,
            sessionId,
            data: error
        });
    }
    /**
     * Get tool performance metrics
     */
    async getToolMetrics(toolId, timeRange) {
        const cacheKey = `metrics:${toolId}:${timeRange?.start?.getTime()}:${timeRange?.end?.getTime()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const events = await this.storage.getEvents({
            eventType: 'tool_usage',
            toolId,
            timeRange
        });
        if (events.length === 0)
            return null;
        const usageEvents = events.filter(e => e.eventType === 'tool_usage');
        const completedEvents = usageEvents.filter(e => e.data.action === 'complete');
        const successfulEvents = completedEvents.filter(e => e.data.success === true);
        // Calculate metrics
        const totalProcessingTime = completedEvents
            .filter(e => e.data.processingTime)
            .reduce((sum, e) => sum + (e.data.processingTime || 0), 0);
        const avgProcessingTime = completedEvents.length > 0 ? totalProcessingTime / completedEvents.length : 0;
        const totalFileSize = completedEvents.reduce((sum, e) => sum + e.data.fileSize, 0);
        const avgFileSize = completedEvents.length > 0 ? totalFileSize / completedEvents.length : 0;
        const successRate = completedEvents.length > 0 ? (successfulEvents.length / completedEvents.length) * 100 : 0;
        const errorRate = 100 - successRate;
        // Get popular formats
        const formatCounts = {};
        completedEvents.forEach(event => {
            const format = `${event.data.inputFormat} → ${event.data.outputFormat}`;
            formatCounts[format] = (formatCounts[format] || 0) + 1;
        });
        const popularFormats = Object.entries(formatCounts)
            .map(([format, count]) => ({ format, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Calculate peak usage (events per hour)
        const hourlyUsage = {};
        usageEvents.forEach(event => {
            const hour = new Date(event.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
            hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
        });
        const peakUsage = Math.max(...Object.values(hourlyUsage), 0);
        const metrics = {
            toolId,
            averageProcessingTime: avgProcessingTime,
            totalUsage: usageEvents.length,
            successRate,
            averageFileSize: avgFileSize,
            peakUsage,
            errorRate,
            popularFormats,
            timeRange: {
                start: timeRange?.start || new Date(Math.min(...events.map(e => e.timestamp.getTime()))),
                end: timeRange?.end || new Date(Math.max(...events.map(e => e.timestamp.getTime())))
            }
        };
        this.setCache(cacheKey, metrics, 5 * 60 * 1000); // Cache for 5 minutes
        return metrics;
    }
    /**
     * Get overall usage statistics
     */
    async getUsageStatistics(timeRange) {
        const cacheKey = `usage:${timeRange?.start?.getTime()}:${timeRange?.end?.getTime()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const events = await this.storage.getEvents({ timeRange });
        const conversionEvents = events.filter(e => e.eventType === 'tool_usage');
        const completedConversions = conversionEvents.filter(e => e.data.action === 'complete');
        // Calculate statistics
        const totalConversions = completedConversions.length;
        const uniqueUsers = new Set(events.map(e => e.userId || e.sessionId)).size;
        const totalFilesSizeMB = completedConversions.reduce((sum, e) => sum + e.data.fileSize, 0) / (1024 * 1024);
        // Popular tools
        const toolUsage = {};
        completedConversions.forEach(event => {
            if (event.toolId) {
                toolUsage[event.toolId] = (toolUsage[event.toolId] || 0) + 1;
            }
        });
        const popularTools = Object.entries(toolUsage)
            .map(([toolId, usage]) => ({ toolId, usage }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 20);
        // Format distribution
        const formatDistribution = {};
        completedConversions.forEach(event => {
            const format = event.data.outputFormat;
            formatDistribution[format] = (formatDistribution[format] || 0) + 1;
        });
        // Platform distribution
        const platformDistribution = {};
        events.forEach(event => {
            const platform = event.metadata?.platform || 'unknown';
            platformDistribution[platform] = (platformDistribution[platform] || 0) + 1;
        });
        // Error types
        const errorEvents = events.filter(e => e.eventType === 'error');
        const errorTypes = {};
        errorEvents.forEach(event => {
            const errorType = event.data.code || 'unknown';
            errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        });
        // Time series data (daily conversion counts)
        const dailyConversions = {};
        completedConversions.forEach(event => {
            const day = event.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
            dailyConversions[day] = (dailyConversions[day] || 0) + 1;
        });
        const timeSeriesData = Object.entries(dailyConversions)
            .map(([timestamp, value]) => ({ timestamp: new Date(timestamp), value }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const statistics = {
            totalConversions,
            totalUsers: uniqueUsers,
            totalFilesSizeMB,
            popularTools,
            formatDistribution,
            platformDistribution,
            errorTypes,
            timeSeriesData
        };
        this.setCache(cacheKey, statistics, 10 * 60 * 1000); // Cache for 10 minutes
        return statistics;
    }
    /**
     * Set up alert rule
     */
    setAlertRule(rule) {
        this.alerts.set(rule.id, rule);
    }
    /**
     * Check alerts against current event
     */
    async checkAlerts(event) {
        for (const [ruleId, rule] of this.alerts) {
            if (!rule.enabled)
                continue;
            // Skip if recently triggered
            if (rule.lastTriggered &&
                (Date.now() - rule.lastTriggered.getTime()) < rule.condition.timeWindow * 60 * 1000) {
                continue;
            }
            try {
                const shouldTrigger = await this.evaluateAlertCondition(rule, event);
                if (shouldTrigger) {
                    await this.triggerAlert(rule, event);
                    rule.lastTriggered = new Date();
                }
            }
            catch (error) {
                console.error(`Error evaluating alert ${ruleId}:`, error);
            }
        }
    }
    /**
     * Evaluate alert condition
     */
    async evaluateAlertCondition(rule, event) {
        const { metric, operator, threshold, timeWindow } = rule.condition;
        // Get recent events within time window
        const cutoff = new Date(Date.now() - timeWindow * 60 * 1000);
        const recentEvents = this.events.filter(e => e.timestamp >= cutoff);
        let value;
        switch (metric) {
            case 'error_rate':
                const totalEvents = recentEvents.length;
                const errorEvents = recentEvents.filter(e => e.eventType === 'error').length;
                value = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
                break;
            case 'processing_time':
                const perfEvents = recentEvents.filter(e => e.eventType === 'performance');
                value = perfEvents.length > 0
                    ? perfEvents.reduce((sum, e) => sum + (e.data.processingTime || 0), 0) / perfEvents.length
                    : 0;
                break;
            case 'usage_spike':
                value = recentEvents.filter(e => e.eventType === 'tool_usage').length;
                break;
            default:
                return false;
        }
        // Evaluate condition
        switch (operator) {
            case '>': return value > threshold;
            case '<': return value < threshold;
            case '>=': return value >= threshold;
            case '<=': return value <= threshold;
            case '=': return value === threshold;
            default: return false;
        }
    }
    /**
     * Trigger alert
     */
    async triggerAlert(rule, event) {
        console.warn(`Alert triggered: ${rule.name}`);
        for (const action of rule.actions) {
            try {
                switch (action.type) {
                    case 'log':
                        console.log(`[ALERT] ${rule.name}: ${rule.description}`, { rule, event });
                        break;
                    case 'webhook':
                        // Implementation would make HTTP request to webhook URL
                        console.log(`Would send webhook to: ${action.target}`);
                        break;
                    case 'email':
                        // Implementation would send email
                        console.log(`Would send email to: ${action.target}`);
                        break;
                }
            }
            catch (error) {
                console.error(`Failed to execute alert action ${action.type}:`, error);
            }
        }
    }
    /**
     * Initialize default alert rules
     */
    initializeDefaultAlerts() {
        // High error rate alert
        this.setAlertRule({
            id: 'high-error-rate',
            name: 'High Error Rate',
            description: 'Error rate exceeds 10% in the last 10 minutes',
            condition: {
                metric: 'error_rate',
                operator: '>',
                threshold: 10,
                timeWindow: 10
            },
            actions: [
                { type: 'log', target: 'console' }
            ],
            enabled: true
        });
        // Slow processing alert
        this.setAlertRule({
            id: 'slow-processing',
            name: 'Slow Processing',
            description: 'Average processing time exceeds 30 seconds',
            condition: {
                metric: 'processing_time',
                operator: '>',
                threshold: 30000,
                timeWindow: 15
            },
            actions: [
                { type: 'log', target: 'console' }
            ],
            enabled: true
        });
        // Usage spike alert
        this.setAlertRule({
            id: 'usage-spike',
            name: 'Usage Spike',
            description: 'More than 1000 tool usages in 10 minutes',
            condition: {
                metric: 'usage_spike',
                operator: '>',
                threshold: 1000,
                timeWindow: 10
            },
            actions: [
                { type: 'log', target: 'console' }
            ],
            enabled: true
        });
    }
    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.metricsCache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp.getTime() > cached.ttl) {
            this.metricsCache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data, ttl) {
        this.metricsCache.set(key, {
            data,
            timestamp: new Date(),
            ttl
        });
    }
    invalidateCache(keys) {
        keys.forEach(key => {
            // Remove all cache entries that start with the key
            for (const cacheKey of this.metricsCache.keys()) {
                if (cacheKey.includes(key)) {
                    this.metricsCache.delete(cacheKey);
                }
            }
        });
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
/**
 * In-memory storage implementation (for development/testing)
 */
export class InMemoryAnalyticsStorage {
    events = [];
    async saveEvent(event) {
        this.events.push(event);
        // Keep only last 50k events
        if (this.events.length > 50000) {
            this.events.splice(0, this.events.length - 50000);
        }
    }
    async getEvents(filters = {}) {
        let filtered = this.events;
        if (filters.eventType) {
            filtered = filtered.filter(e => e.eventType === filters.eventType);
        }
        if (filters.toolId) {
            filtered = filtered.filter(e => e.toolId === filters.toolId);
        }
        if (filters.timeRange) {
            filtered = filtered.filter(e => e.timestamp >= filters.timeRange.start && e.timestamp <= filters.timeRange.end);
        }
        if (filters.limit) {
            filtered = filtered.slice(-filters.limit);
        }
        return filtered;
    }
    async deleteOldEvents(beforeDate) {
        const originalLength = this.events.length;
        this.events = this.events.filter(e => e.timestamp >= beforeDate);
        return originalLength - this.events.length;
    }
}
/**
 * Create analytics manager with in-memory storage
 */
export function createAnalyticsManager() {
    return new AnalyticsManager(new InMemoryAnalyticsStorage());
}
//# sourceMappingURL=analytics.js.map