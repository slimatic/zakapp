
import React, { useState, useEffect } from 'react';
import { User, adminService } from '../../services/adminService';
import { DEFAULT_LIMITS } from '../../constants/limits';

interface LimitModalProps {
    user: User | null;
    onClose: () => void;
    onSave: (userId: string, limits: { maxAssets: number | null, maxNisabRecords: number | null, maxPayments: number | null, maxLiabilities: number | null }) => void;
}

export const LimitModal: React.FC<LimitModalProps> = ({ user, onClose, onSave }) => {
    const [maxAssets, setMaxAssets] = useState<string>('');
    const [maxNisabRecords, setMaxNisabRecords] = useState<string>('');
    const [maxPayments, setMaxPayments] = useState<string>('');
    const [maxLiabilities, setMaxLiabilities] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setMaxAssets(user.maxAssets !== null ? user.maxAssets.toString() : '');
            setMaxNisabRecords(user.maxNisabRecords !== null ? user.maxNisabRecords.toString() : '');
            setMaxPayments(user.maxPayments !== null ? user.maxPayments.toString() : '');
            setMaxLiabilities(user.maxLiabilities !== null && user.maxLiabilities !== undefined ? user.maxLiabilities.toString() : '');
        }
    }, [user]);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const limits = {
            maxAssets: maxAssets === '' ? null : parseInt(maxAssets),
            maxNisabRecords: maxNisabRecords === '' ? null : parseInt(maxNisabRecords),
            maxPayments: maxPayments === '' ? null : parseInt(maxPayments),
            maxLiabilities: maxLiabilities === '' ? null : parseInt(maxLiabilities)
        };

        try {
            const res = await adminService.updateUserLimits(user.id, limits);
            if (res.success) {
                onSave(user.id, limits);
                onClose();
            } else {
                alert(res.message || 'Failed to update limits');
            }
        } catch (error) {
            alert('Error updating limits');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Manage Limits for {user.username}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="maxAssets" className="block text-sm font-medium text-gray-700 mb-1">
                            Max Assets (Default: {DEFAULT_LIMITS.MAX_ASSETS})
                        </label>
                        <input
                            id="maxAssets"
                            type="number"
                            value={maxAssets}
                            onChange={(e) => setMaxAssets(e.target.value)}
                            placeholder="Leave empty for default"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="maxNisabRecords" className="block text-sm font-medium text-gray-700 mb-1">
                            Max Nisab Records (Default: {DEFAULT_LIMITS.MAX_NISAB_RECORDS})
                        </label>
                        <input
                            id="maxNisabRecords"
                            type="number"
                            value={maxNisabRecords}
                            onChange={(e) => setMaxNisabRecords(e.target.value)}
                            placeholder="Leave empty for default"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="maxPayments" className="block text-sm font-medium text-gray-700 mb-1">
                            Max Payments (Default: {DEFAULT_LIMITS.MAX_PAYMENTS})
                        </label>
                        <input
                            id="maxPayments"
                            type="number"
                            value={maxPayments}
                            onChange={(e) => setMaxPayments(e.target.value)}
                            placeholder="Leave empty for default"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="maxLiabilities" className="block text-sm font-medium text-gray-700 mb-1">
                            Max Liabilities (Default: {DEFAULT_LIMITS.MAX_LIABILITIES})
                        </label>
                        <input
                            id="maxLiabilities"
                            type="number"
                            value={maxLiabilities}
                            onChange={(e) => setMaxLiabilities(e.target.value)}
                            placeholder="Leave empty for default"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
