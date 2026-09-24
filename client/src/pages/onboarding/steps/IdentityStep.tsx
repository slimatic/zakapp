import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useOnboarding } from '../context/OnboardingContext';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';
import { getSupportedCurrencies, getCurrencySymbol, formatCurrency as formatCurrencyCanonical } from '../../../utils/formatters';


export const IdentityStep: React.FC = () => {
  const { t } = useTranslation('onboarding');
    const { data, updateData, nextStep } = useOnboarding();
    const selectedCurrency = data.settings?.currency || 'USD';

    // Always fetch Nisab prices in USD for consistent display during onboarding
    const { goldPrice, silverPrice } = useNisabThreshold('USD', 'SILVER');

    const handleMadhabChange = (madhab: 'hanafi' | 'shafii' | 'standard') => {
        updateData('methodology', { madhab });
    };

    const handleNisabChange = (standard: 'gold' | 'silver') => {
        updateData('nisab', { standard });
    };

    const handleCurrencyChange = (currency: string) => {
        updateData('settings', { currency });
    };

    // Nisab thresholds are always shown in USD for clarity during onboarding
    const formatNisabUSD = (val: number) =>
        formatCurrencyCanonical(val, 'USD');

    const currencies = getSupportedCurrencies().map(code => ({
        code,
        // Symbol only: every template in this file already renders `{code} - ...`
        // itself, so including the code here produced "USD - USD ($)".
        name: getCurrencySymbol(code)
    }));

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('steps.identity.preferredCurrency')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Choose the currency for your assets and Zakat calculations.
                </p>
                <div className="w-full max-w-sm">
                    <Listbox value={selectedCurrency} onChange={handleCurrencyChange}>
                        {({ open: _open }) => (
                            <div className="relative mt-1">
                                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-card py-3 ps-4 pe-10 text-start border border-border-strong shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm">
                                    <span className="block truncate">
                                        {currencies.find(c => c.code === selectedCurrency)?.code} - {currencies.find(c => c.code === selectedCurrency)?.name}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2">
                                        <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                    </span>
                                </Listbox.Button>
                                <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {currencies.map((currency) => (
                                            <Listbox.Option
                                                key={currency.code}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 ps-10 pe-4 ${active ? 'bg-accent text-secondary' : 'text-foreground'
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
                                                            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-secondary">
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

            <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('steps.identity.schoolOfThought')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
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
                            relative rounded-lg border p-4 cursor-pointer flex flex-col hover:border-secondary transition-all
                            ${data.methodology.madhab === option.id ? 'border-secondary ring-2 ring-secondary/25 bg-accent' : 'border-border'}
                        `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="block font-medium text-foreground">{option.title}</span>
                                {data.methodology.madhab === option.id && (
                                    <span className="text-secondary text-lg">✓</span>
                                )}
                            </div>
                            <span className="mt-1 text-sm text-muted-foreground">{option.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('steps.identity.nisabThreshold')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
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
                                relative rounded-lg border p-4 cursor-pointer hover:border-secondary transition-all text-center flex flex-col justify-between h-full
                                ${data.nisab.standard === option.id ? 'border-secondary ring-2 ring-secondary/25 bg-accent' : 'border-border'}
                            `}
                            >
                                <div>
                                    <span className="block font-bold text-foreground text-lg mb-1">{option.title}</span>
                                    <span className="block text-2xl font-bold text-secondary my-2">
                                        {option.price ? formatNisabUSD(threshold) : 'Loading...'}
                                    </span>
                                    <span className="block text-xs text-muted-foreground mb-2">
                                        Based on {option.gramWeight}g @ {option.price ? formatNisabUSD(option.price) : '...'}/g
                                    </span>
                                </div>
                                <span className="block text-xs text-muted-foreground mt-2 border-t border-border pt-2">{option.desc}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold shadow-elev-2 hover:bg-secondary/90 transition-all transform hover:-translate-y-0.5"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};
