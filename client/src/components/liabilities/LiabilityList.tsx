import React, { useState } from 'react';
import { Liability } from '../../types';
import { Button } from '../ui';
import { calculateDeductibleLiabilities } from '../../core/calculations/wealthCalculator';
import toast from 'react-hot-toast';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';

interface LiabilityListProps {
    liabilities: Liability[];
    onEdit: (liability: Liability) => void;
}

export const LiabilityList: React.FC<LiabilityListProps> = ({ liabilities, onEdit }) => {
    const { removeLiability } = useLiabilityRepository();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const maskedCurrency = useMaskedCurrency();

    const handleDelete = async (id: string) => {
        try {
            await removeLiability(id);
            toast.success('Liability removed');
            setDeleteId(null);
        } catch (error) {
            toast.error('Failed to delete liability');
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Check deductibility for UI indication
    const isDeductible = (liability: Liability) => {
        const deductibleAmount = calculateDeductibleLiabilities([liability], new Date());
        return deductibleAmount > 0;
    };

    if (liabilities.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No liabilities</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a debt or liability.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            <ul className="divide-y divide-gray-200">
                {liabilities.map((liability) => (
                    <li key={liability.id}>
                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-blue-600 truncate">{liability.name}</p>
                                    <p className="text-xs text-gray-500">{liability.creditor ? `Creditor: ${liability.creditor}` : 'No creditor specified'}</p>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {maskedCurrency(formatCurrency(liability.amount, liability.currency))}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Due: {formatDate(liability.dueDate)}</p>
                                </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between sm:items-center">
                                <div className="sm:flex sm:items-center gap-2">
                                    <p className="flex items-center text-sm text-gray-500 capitalize">
                                        {liability.type.replace(/_/g, ' ')}
                                    </p>
                                    {isDeductible(liability) ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Zakat Deductible
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                            Non-Deductible
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center text-sm gap-2 sm:mt-0">
                                    <Button variant="outline" size="sm" onClick={() => onEdit(liability)}>
                                        Edit
                                    </Button>
                                    {deleteId === liability.id ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-600">Sure?</span>
                                            <button onClick={() => handleDelete(liability.id)} className="text-red-600 hover:text-red-800 text-xs font-medium underline">Yes</button>
                                            <button onClick={() => setDeleteId(null)} className="text-gray-600 hover:text-gray-800 text-xs font-medium underline">No</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteId(liability.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
