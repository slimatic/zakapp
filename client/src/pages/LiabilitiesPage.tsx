import React, { useState } from 'react';
import { useLiabilityRepository } from '../hooks/useLiabilityRepository';
import { LiabilityForm } from '../components/liabilities/LiabilityForm';
import { LiabilityList } from '../components/liabilities/LiabilityList';
import { Button } from '../components/ui';
import { Modal } from '../components/ui/Modal';
import { Liability } from '../types';

export const LiabilitiesPage: React.FC = () => {
    const { liabilities, isLoading } = useLiabilityRepository();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLiability, setEditingLiability] = useState<Liability | undefined>(undefined);

    const handleAdd = () => {
        setEditingLiability(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (liability: Liability) => {
        setEditingLiability(liability);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        setEditingLiability(undefined);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    // Calculate totals
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Liabilities
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track your short-term and long-term debts. Deductible liabilities will be automatically calculated for Zakat.
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button onClick={handleAdd}>
                        Add Liability
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Liabilities</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalLiabilities)}
                        </dd>
                    </div>
                </div>
                {/* We can add more stats here later like "Deductible Amount" */}
            </div>

            <LiabilityList liabilities={liabilities} onEdit={handleEdit} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingLiability ? 'Edit Liability' : 'Add Liability'}
                size="lg"
            >
                <div className="mt-2">
                    <LiabilityForm
                        liability={editingLiability}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
};

// Default export for lazy loading
export default LiabilitiesPage;
