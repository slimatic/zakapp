import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useOnboarding } from '../context/OnboardingContext';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';


export const IdentityStep: React.FC = () => {
    const { data, updateData, nextStep } = useOnboarding();
    const selectedCurrency = data.settings?.currency || 'USD';

    // Fetch prices in selected currency
    const { goldPrice, silverPrice } = useNisabThreshold(selectedCurrency, 'SILVER');

    const handleMadhabChange = (madhab: 'hanafi' | 'shafii' | 'standard') => {
        updateData('methodology', { madhab });
    };

    const handleNisabChange = (standard: 'gold' | 'silver') => {
        updateData('nisab', { standard });
    };

    const handleCurrencyChange = (currency: string) => {
        updateData('settings', { currency });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency }).format(val);

    const currencies = [
        { code: 'USD', name: 'US Dollar ($)' },
        { code: 'EUR', name: 'Euro (€)' },
        { code: 'GBP', name: 'British Pound (£)' },
        { code: 'SAR', name: 'Saudi Riyal (SAR)' },
        { code: 'AED', name: 'UAE Dirham (AED)' },
        { code: 'PKR', name: 'Pakistani Rupee (Rs)' },
        { code: 'INR', name: 'Indian Rupee (₹)' },
        { code: 'MYR', name: 'Malaysian Ringgit (RM)' },
        { code: 'CAD', name: 'Canadian Dollar (C$)' },
        { code: 'AUD', name: 'Australian Dollar (A$)' }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Preferred Currency</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Choose the currency for your assets and Zakat calculations.
                </p>
                <div className="w-full max-w-sm">
                    <Listbox value={selectedCurrency} onChange={handleCurrencyChange}>
                        {({ open }) => (
                            <div className="relative mt-1">
                                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                                    <span className="block truncate">
                                        {currencies.find(c => c.code === selectedCurrency)?.code} - {currencies.find(c => c.code === selectedCurrency)?.name}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </span>
                                </Listbox.Button>
                                <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {currencies.map((currency) => (
                                            <Listbox.Option
                                                key={currency.code}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'
                                                    }`
                                                }
                                                value={currency.code}
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {currency.code} - {currency.name}
                                                        </span>
                                                        {selected ? (
                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600">
                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </div>
                        )}
                    </Listbox>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">School of Thought (Madhab)</h3>
                <p className="text-sm text-gray-500 mb-4">
                    This determines which assets are Zakatable, especially jewelry.
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'standard', title: 'Standard (Recommended)', desc: 'Follows international consensus (Fiqh Academy).' },
                        { id: 'hanafi', title: 'Hanafi', desc: 'Gold/Silver jewelry is always Zakatable.' },
                        { id: 'shafii', title: 'Shafi\'i / Maliki / Hanbali', desc: 'Personal use jewelry is generally exempt.' }
                    ].map((option) => (
                        <div
                            key={option.id}
                            onClick={() => handleMadhabChange(option.id as any)}
                            className={`
                            relative rounded-lg border p-4 cursor-pointer flex flex-col hover:border-emerald-500 transition-all
                            ${data.methodology.madhab === option.id ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50' : 'border-gray-200'}
                        `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="block font-medium text-gray-900">{option.title}</span>
                                {data.methodology.madhab === option.id && (
                                    <span className="text-emerald-600 text-lg">✓</span>
                                )}
                            </div>
                            <span className="mt-1 text-sm text-gray-500">{option.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nisab Threshold</h3>
                <p className="text-sm text-gray-500 mb-4">
                    The minimum wealth required before Zakat is due. Updated automatically with live market prices.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        {
                            id: 'silver',
                            title: 'Silver Standard',
                            desc: 'More cautious, benefits the poor.',
                            gramWeight: 612.36,
                            price: silverPrice
                        },
                        {
                            id: 'gold',
                            title: 'Gold Standard',
                            desc: 'Higher threshold.',
                            gramWeight: 87.48,
                            price: goldPrice
                        }
                    ].map((option) => {
                        const threshold = (option.price || 0) * option.gramWeight;
                        return (
                            <div
                                key={option.id}
                                onClick={() => handleNisabChange(option.id as any)}
                                className={`
                                relative rounded-lg border p-4 cursor-pointer hover:border-emerald-500 transition-all text-center flex flex-col justify-between h-full
                                ${data.nisab.standard === option.id ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50' : 'border-gray-200'}
                            `}
                            >
                                <div>
                                    <span className="block font-bold text-gray-900 text-lg mb-1">{option.title}</span>
                                    <span className="block text-2xl font-bold text-emerald-700 my-2">
                                        {option.price ? formatCurrency(threshold) : 'Loading...'}
                                    </span>
                                    <span className="block text-xs text-gray-500 mb-2">
                                        Based on {option.gramWeight}g @ {option.price ? formatCurrency(option.price) : '...'}/g
                                    </span>
                                </div>
                                <span className="block text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{option.desc}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};
