// Google Analytics is opt-in: set NEXT_PUBLIC_GA_ID to enable it. Forks and
// local checkouts leave it unset and send nothing.
export const GA_TRACKING_ID: string = process.env.NEXT_PUBLIC_GA_ID ?? ''

const gtag = (): ((...args: unknown[]) => void) | undefined => {
    if (!GA_TRACKING_ID || typeof window === 'undefined') return undefined;
    const fn = (window as any).gtag;
    return typeof fn === 'function' ? fn : undefined;
};

export const event = ({
    action,
    category,
    label,
    value,
}: {
    action: string;
    category: string;
    label: string;
    value: number;
}) => {
    gtag()?.("event", action, {
        event_category: category,
        event_label: label,
        value: value,
    });
};
