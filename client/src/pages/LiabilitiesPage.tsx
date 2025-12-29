/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';
import { useLiabilityRepository } from '../hooks/useLiabilityRepository';
import { LiabilityForm } from '../components/liabilities/LiabilityForm';
import { LiabilityList } from '../components/liabilities/LiabilityList';
import { Button } from '../components/ui';
import { Modal } from '../components/ui/Modal';
import { Liability } from '../types';
import { useMaskedCurrency } from '../contexts/PrivacyContext';

export const LiabilitiesPage: React.FC = () => {
    const { liabilities, isLoading } = useLiabilityRepository();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLiability, setEditingLiability] = useState<Liability | undefined>(undefined);
    const maskedCurrency = useMaskedCurrency();

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Calculate totals
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-900 leading-tight">
                        Liabilities
                    </h1>
                    <p className="mt-1 text-gray-500 max-w-2xl">
                        Track your short-term and long-term debts. Deductible liabilities will be automatically calculated for Zakat.
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <Button onClick={handleAdd} className="shadow-md">
                        Add Liability
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl border border-primary-100/50 p-6 transition-all hover:shadow-md">
                    <dt className="text-sm font-medium text-gray-500 truncate mb-1">Total Liabilities</dt>
                    <dd className="text-4xl font-heading font-bold text-primary-700">
                        {maskedCurrency(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalLiabilities))}
                    </dd>
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
