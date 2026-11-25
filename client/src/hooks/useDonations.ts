export const useDonations = () => {
    // Default to true for development if not set, otherwise respect the env var
    // In production, this should be strictly controlled
    const isEnabled = import.meta.env.VITE_ENABLE_DONATIONS !== 'false';
    // Canonical donation page lives on the marketing site. It is the URL people
    // actually share, it can be updated without an app release, and because it
    // is a different origin the service worker cannot answer it with the cached
    // app shell (which is what happened to /donate.html).
    const donationUrl = 'https://zakapp.org/donate';

    return {
        isEnabled,
        donationUrl
    };
};
