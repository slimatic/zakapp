import React from 'react';
import { Tooltip } from '../ui/Tooltip';
import { getGlossaryTerm } from '../../data/glossary';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GlossaryTermProps {
    term: string;
    children?: React.ReactNode;
    fallback?: string;
    className?: string; // Allow custom styling for the text
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({
    term,
    children,
    fallback,
    className = "decoration-dotted decoration-gray-400 underline underline-offset-4 decoration-2 cursor-help"
}) => {
    const glossaryItem = getGlossaryTerm(term);

    // If term not found, just return text as is
    if (!glossaryItem) {
        return <>{children || fallback || term}</>;
    }

    const tooltipContent = (
        <div className="space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
                {glossaryItem.display}
            </div>
            <p className="text-gray-200">
                {glossaryItem.definition}
            </p>
            {glossaryItem.longDefinition && (
                <div className="pt-2 mt-2 border-t border-gray-700 text-xs text-right">
                    <Link to="/learn" className="text-emerald-400 hover:text-emerald-300 flex items-center justify-end gap-1">
                        <BookOpen size={12} />
                        Learn more
                    </Link>
                </div>
            )}
        </div>
    );

    return (
        <Tooltip content={tooltipContent} maxWidth="280px">
            <span className={className}>
                {children || glossaryItem.display}
            </span>
        </Tooltip>
    );
};
