import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';
import { Liability } from '../../types';
import { Button, Input } from '../ui';
import { EncryptedBadge } from '../ui/EncryptedBadge';
import { calculateDeductibleLiabilities } from '../../core/calculations/wealthCalculator';

interface LiabilityFormProps {
    liability?: Liability;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const LiabilityForm: React.FC<LiabilityFormProps> = ({ liability, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: liability?.name || '',
        type: liability?.type || 'short_term',
        amount: liability?.amount || 0,
        currency: liability?.currency || 'USD',
        dueDate: liability?.dueDate ? new Date(liability.dueDate).toISOString().split('T')[0] : '',
        creditor: liability?.creditor || '',
        notes: liability?.notes || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addLiability, updateLiability } = useLiabilityRepository();
    const isEditing = !!liability;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!formData.currency.trim()) newErrors.currency = 'Currency is required';
        if (!formData.dueDate) {
            newErrors.dueDate = 'Due date is required';
        } else {
            // Check if date is valid
            if (isNaN(new Date(formData.dueDate).getTime())) {
                newErrors.dueDate = 'Invalid date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const data = {
                name: formData.name,
                type: formData.type,
                amount: formData.amount,
                currency: formData.currency,
                dueDate: new Date(formData.dueDate).toISOString(),
                creditor: formData.creditor,
                notes: formData.notes,
                // Default fields
                isActive: true,
            };

            if (isEditing && liability) {
                await updateLiability(liability.id, data);
                toast.success('Liability updated');
            } else {
                await addLiability(data as any); // Types need to be aligned if Omit is used in repo
                toast.success('Liability added');
            }
            onSuccess?.();
        } catch (error: any) {
            console.error('Liability save error:', error);
            toast.error(error.message || 'Failed to save liability');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // Check if current due date would make it deductible
    const isDeductiblePreview = () => {
        if (!formData.dueDate) return false;
        const dummyLiability = { ...formData, id: 'temp', userId: 'temp', amount: Number(formData.amount), isActive: true, createdAt: '', updatedAt: '', dueDate: new Date(formData.dueDate).toISOString() } as Liability;
        const deductibleAmount = calculateDeductibleLiabilities([dummyLiability], new Date());
        return deductibleAmount > 0;
    };

    return (
        <div className="max-w-xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Edit Liability' : 'Add New Liability'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name *</label>
                    <Input
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className={errors.name ? 'border-red-500' : ''}
                        placeholder="e.g. Credit Card, Mortgage, Student Loan"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Type & Creditor */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={e => handleChange('type', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                        >
                            <option value="short_term">Short Term (Immediate)</option>
                            <option value="long_term">Long Term (Deferred)</option>
                            <option value="business_payable">Business Payable</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Creditor (Optional)</label>
                        <Input
                            value={formData.creditor}
                            onChange={e => handleChange('creditor', e.target.value)}
                            placeholder="e.g. Chase, Bank of America"
                        />
                    </div>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Amount *</label>
                            <EncryptedBadge />
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                            className={errors.amount ? 'border-red-500' : ''}
                        />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                            value={formData.currency}
                            onChange={e => handleChange('currency', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="SAR">SAR</option>
                            <option value="PKR">PKR</option>
                        </select>
                    </div>
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => handleChange('dueDate', e.target.value)}
                        className={errors.dueDate ? 'border-red-500' : ''}
                    />
                    {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}

                    {/* Ductibility Preview */}
                    {formData.dueDate && !isNaN(new Date(formData.dueDate).getTime()) && (
                        <div className={`mt-2 text-xs p-2 rounded ${isDeductiblePreview() ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isDeductiblePreview()
                                ? '✅ Eligible for Zakat Deduction (Due within ~1 lunar year)'
                                : 'ℹ️ Not automatically deductible (Due later than 1 lunar year)'}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => handleChange('notes', e.target.value)}
                        rows={3}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" isLoading={isSubmitting}>
                        {isEditing ? 'Update' : 'Add'} Liability
                    </Button>
                </div>

            </form>
        </div>
    );
};
