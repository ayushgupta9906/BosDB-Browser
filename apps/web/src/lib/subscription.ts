// Subscription helper functions (client-side)
// For multi-tenant - subscriptions are per-organization

// Client-side cache for organization subscription status
let cachedOrgSubscription: {
    isPro: boolean;
    isTrial: boolean;
    orgId: string | null;
    orgName: string | null;
} | null = null;

/**
 * Fetch and cache organization subscription status from server
 * Call this on app load
 */
export async function fetchOrgSubscription(orgId: string): Promise<{ isPro: boolean; isTrial: boolean }> {
    if (!orgId) {
        return { isPro: false, isTrial: false };
    }

    try {
        const res = await fetch(`/api/subscription?orgId=${encodeURIComponent(orgId)}`);
        if (res.ok) {
            const data = await res.json();
            cachedOrgSubscription = {
                isPro: data.isPro,
                isTrial: data.isTrial,
                orgId: data.organization?.id || null,
                orgName: data.organization?.name || null
            };
            return { isPro: data.isPro, isTrial: data.isTrial };
        }
    } catch (err) {
        console.error('Failed to fetch subscription:', err);
    }
    return { isPro: false, isTrial: false };
}

/**
 * Get cached subscription status (synchronous)
 */
export function getOrgSubscriptionStatus(): { isPro: boolean; isTrial: boolean; orgId: string | null; orgName: string | null } {
    return cachedOrgSubscription || { isPro: false, isTrial: false, orgId: null, orgName: null };
}

/**
 * Check if current org has Pro (use cached value)
 */
export function isPro(): boolean {
    return cachedOrgSubscription?.isPro ?? false;
}

/**
 * Check if current org is on trial
 */
export function isTrial(): boolean {
    return cachedOrgSubscription?.isTrial ?? false;
}

/**
 * Feature names that require Pro subscription
 */
export const PRO_FEATURES = [
    'version_control',
    'commit_history',
    'table_designer',
    'data_editing',
    'granular_permissions',
    'unlimited_connections',
    'json_export',
    'sql_export'
] as const;

export const FREE_FEATURES = [
    'basic_query',
    'csv_export',
    'schema_explorer',
    'query_history_limited' // 50 entries max
] as const;

/**
 * Check if a feature is available (based on org subscription)
 */
export function canUseFeature(feature: string): boolean {
    // Free features are always available
    if ((FREE_FEATURES as readonly string[]).includes(feature)) {
        return true;
    }

    // Pro features require subscription
    if ((PRO_FEATURES as readonly string[]).includes(feature)) {
        return isPro();
    }

    // Unknown feature - default to requiring Pro
    return isPro();
}

/**
 * Get subscription status text for display
 */
export function getSubscriptionStatusText(): string {
    const status = getOrgSubscriptionStatus();
    if (!status.isPro) {
        return 'Free Plan';
    }
    if (status.isTrial) {
        return 'Trial (1 month free)';
    }
    return 'Pro';
}

/**
 * Pricing info
 */
export const PRICING = {
    free: {
        name: 'Free',
        price: 0,
        period: 'forever',
        features: [
            '2 Database Connections',
            '50 Query History Entries',
            'Schema Explorer',
            'CSV Export',
            'Basic Query Editor'
        ]
    },
    pro_trial: {
        name: 'Pro Trial',
        price: 0,
        period: '1 month',
        features: [
            'All Pro features FREE for 1 month',
            'No credit card required',
            'Cancel anytime'
        ]
    },
    pro_monthly: {
        name: 'Pro Monthly',
        price: 29,
        period: 'month',
        features: [
            'Unlimited Connections',
            'Unlimited Query History',
            'Version Control & Commits',
            'Table Designer',
            'Data Grid Editing',
            'Granular Permissions',
            'CSV, JSON, SQL Export',
            'Priority Support'
        ]
    },
    pro_yearly: {
        name: 'Pro Yearly',
        price: 249,
        period: 'year',
        savings: '29%',
        features: [
            'Everything in Pro Monthly',
            '2 Months FREE',
            'Priority Support',
            'Early Access to New Features'
        ]
    }
};
