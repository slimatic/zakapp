import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Video, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQS_DATA } from '../../data/faqs';

const VIDEO_PLAYLIST_ID = "PLXguldgkbZPffh6p4efOetXkTeJATAbcS";

interface AccordionItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-medium text-gray-900 pr-8">{question}</h3>
                {isOpen ? <ChevronUp className="text-emerald-500 shrink-0" /> : <ChevronDown className="text-gray-400 shrink-0" />}
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="p-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-50 bg-gray-50/50">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const KnowledgeHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'faqs' | 'videos' | 'guides'>('faqs');
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
                <h1 className="text-4xl font-bold text-emerald-900 tracking-tight">Ilm Hub</h1>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                    A curated collection of relevant resources to help you understand Zakat. Explore FAQs, watch video guides, or read selected articles.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center border-b border-gray-200 mb-8">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`${activeTab === 'faqs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <HelpCircle size={18} />
                        FAQs
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`${activeTab === 'videos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <Video size={18} />
                        Video Library
                    </button>
                    <button
                        onClick={() => setActiveTab('guides')}
                        className={`${activeTab === 'guides' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                        <BookOpen size={18} />
                        Guides
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
                                        ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 ring-offset-2'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Simple Zakat Guide Series</h3>
                            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-xl overflow-hidden shadow-lg relative" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/videoseries?list=${VIDEO_PLAYLIST_ID}`}
                                    title="Zakat Guide Playlist"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="mt-6 text-gray-600 leading-relaxed">
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
                        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Detailed Guides Coming Soon</h3>
                            <p className="text-gray-500 text-lg">
                                We are strictly compiling comprehensive written guides on Zakat calculation for different asset classes.
                            </p>
                            <button className="mt-8 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                                Notify when available
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
