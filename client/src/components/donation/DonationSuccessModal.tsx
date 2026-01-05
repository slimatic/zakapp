import React, { useEffect, useState } from 'react';
import { useDonations } from '../../hooks/useDonations';

interface DonationSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DonationSuccessModal: React.FC<DonationSuccessModalProps> = ({ isOpen, onClose }) => {
    const { isEnabled, donationUrl } = useDonations();
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        if (isOpen && isEnabled) {
            // Check frequency cap (e.g. show once every 30 days)
            const lastShown = localStorage.getItem('zakapp_donation_modal_shown');
            const now = Date.now();
            const cooldown = 30 * 24 * 60 * 60 * 1000; // 30 days

            if (!lastShown || (now - parseInt(lastShown)) > cooldown) {
                setShouldShow(true);
                localStorage.setItem('zakapp_donation_modal_shown', now.toString());
            } else {
                onClose(); // Auto-close if suppressed
            }
        }
    }, [isOpen, isEnabled, onClose]);

    if (!shouldShow || !isEnabled) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                            <span className="text-2xl">☕</span>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Did ZakApp save you time?
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    We keep ZakApp privacy-first and open-source for everyone. If you found it useful, consider a small Sadaqah to help cover our server costs.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                            onClick={onClose}
                        >
                            No thanks
                        </button>
                        <a
                            href={donationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:text-sm"
                            onClick={onClose}
                        >
                            Support Project
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
