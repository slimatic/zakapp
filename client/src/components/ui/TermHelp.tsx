
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';

interface TermHelpProps {
    term: string;
    arabic?: string;
    definition: string;
    children?: React.ReactNode;
}

export const TermHelp: React.FC<TermHelpProps> = ({ term, arabic, definition, children }) => {
    return (
        <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <span className="inline-flex items-center gap-1 cursor-help group border-b border-dotted border-gray-400 decoration-gray-400/50 hover:border-emerald-500 hover:text-emerald-700 transition-colors" role="button" tabIndex={0}>
                        {children || term}
                        <span className="sr-only">Explanation available</span>
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="z-50 max-w-xs bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-xl animate-in fade-in zoom-in-95 duration-200"
                        sideOffset={5}
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between gap-4 border-b border-gray-700 pb-1 mb-1">
                                <span className="font-semibold text-emerald-300">{term}</span>
                                {arabic && <span className="font-arabic text-emerald-100/80" lang="ar" dir="rtl">{arabic}</span>}
                            </div>
                            <p className="leading-relaxed opacity-90">{definition}</p>
                        </div>
                        <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
};
