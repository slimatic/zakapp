export const useDonations = () => {
    // Default to true for development if not set, otherwise respect the env var
    // In production, this should be strictly controlled
    const isEnabled = import.meta.env.VITE_ENABLE_DONATIONS !== 'false';
    const donationUrl = '/donate.html'; // Assuming simple redirection to the static page

    return {
        isEnabled,
        donationUrl
    };
};
