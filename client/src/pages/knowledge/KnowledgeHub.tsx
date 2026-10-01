import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Video, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQS_DATA } from '../../data/faqs';
import { GLOSSARY } from '../../data/glossary';

const VIDEO_PLAYLIST_ID = "PLXguldgkbZPffh6p4efOetXkTeJATAbcS";

interface AccordionItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-5 text-start bg-card hover:bg-secondary/90 transition-colors"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-medium text-foreground pe-8">{question}</h3>
                {isOpen ? <ChevronUp className="text-success shrink-0" /> : <ChevronDown className="text-muted-foreground shrink-0" />}
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="p-5 pt-0 text-muted-foreground leading-relaxed border-t border-border/50 bg-surface-2/50">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const KnowledgeHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'faqs' | 'videos' | 'guides' | 'glossary'>('faqs');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(FAQS_DATA.map(f => f.category)));
        return ['All', ...cats];
    }, []);

    // Filter FAQs
    const filteredFaqs = useMemo(() => {
        if (selectedCategory === 'All') return FAQS_DATA;
        return FAQS_DATA.filter(f => f.category === selectedCategory);
    }, [selectedCategory]);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        setOpenFaqIndex(null); // Close any open accordion when changing category
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-bold text-secondary tracking-tight">Learning Hub</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                    A curated collection of relevant resources to help you understand Zakat. Explore FAQs, watch video guides, or read selected articles.
                </p>
            </div>

            {/* Navigation Tabs. Scrolls horizontally on a narrow screen rather
                than widening the page - four tabs with icons and `space-x-8`
                exceed a 390px phone. */}
            <div className="-mx-4 mb-8 flex justify-start border-b border-border px-4 sm:mx-0 sm:justify-center sm:px-0">
                <nav
                    className="flex gap-6 overflow-x-auto sm:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    aria-label="Tabs"
                >
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`${activeTab === 'faqs' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <HelpCircle size={18} />
                        FAQs
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`${activeTab === 'videos' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <Video size={18} />
                        Video Library
                    </button>
                    <button
                        onClick={() => setActiveTab('guides')}
                        className={`${activeTab === 'guides' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <BookOpen size={18} />
                        Guides
                    </button>
                    <button
                        onClick={() => setActiveTab('glossary')}
                        className={`${activeTab === 'glossary' ? 'border-secondary text-secondary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <BookOpen size={18} />
                        Glossary
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[50vh]">
                {activeTab === 'faqs' && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        {/* Category Filter */}
                        <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                                        ? 'bg-accent text-secondary ring-2 ring-ring ring-offset-2'
                                        : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {filteredFaqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    question={faq.question}
                                    answer={faq.answer}
                                    isOpen={openFaqIndex === index}
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'videos' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 max-w-4xl mx-auto"
                    >
                        <div className="bg-card p-6 rounded-xl shadow-sm border border-border text-center">
                            <h3 className="text-xl font-semibold text-foreground mb-6">Simple Zakat Guide Series</h3>
                            <div className="aspect-w-16 aspect-h-9 bg-muted rounded-xl overflow-hidden shadow-lg relative" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 start-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/videoseries?list=${VIDEO_PLAYLIST_ID}`}
                                    title="Zakat Guide Playlist"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="mt-6 text-muted-foreground leading-relaxed">
                                A curated series by Sheikh Joe Bradford explaining the essentials of Zakat in a simple, easy-to-understand format.
                            </p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'guides' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="bg-card p-12 rounded-2xl shadow-sm border border-border max-w-2xl mx-auto">
                            <div className="bg-accent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-success" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">Detailed Guides Coming Soon</h3>
                            <p className="text-muted-foreground text-lg">
                                We are strictly compiling comprehensive written guides on Zakat calculation for different asset classes.
                            </p>
                            <button className="mt-8 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors">
                                Notify when available
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'glossary' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2"
                    >
                        {Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term)).map((term) => (
                            <div key={term.term} className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-secondary mb-2 capitalize">{term.display}</h3>
                                <p className="text-foreground/80 font-medium mb-3">{term.definition}</p>
                                {term.longDefinition && (
                                    <p className="text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-3 mt-2">
                                        {term.longDefinition}
                                    </p>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
