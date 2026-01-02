export interface GlossaryTerm {
    term: string; // The key/lowercase term
    display: string; // How it should appear in titles/lists
    definition: string; // Short definition for tooltips
    longDefinition?: string; // Detailed definition for Knowledge Hub
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
    'zakat': {
        term: 'zakat',
        display: 'Zakat',
        definition: 'An obligatory charitable payment made by Muslims, calculated as 2.5% of surplus wealth.',
        longDefinition: 'Zakat is one of the Five Pillars of Islam. It is a mandatory charitable contribution, often considered a tax. The payment is calculated as 2.5% of your surplus wealth once a year.',
    },
    'nisab': {
        term: 'nisab',
        display: 'Nisab',
        definition: 'The minimum amount of wealth a Muslim must possess for a whole lunar year to be liable for Zakat.',
        longDefinition: 'Nisab is the threshold of wealth that makes one liable to pay Zakat. There are two standards: Gold (85g) and Silver (595g). You pay Zakat only if your net assets exceed this threshold.',
    },
    'hawl': {
        term: 'hawl',
        display: 'Hawl',
        definition: 'The lunar year (approx 354 days) that must pass before Zakat becomes due on your wealth.',
        longDefinition: 'A Hawl is a full lunar year. Zakat is not due on wealth until it has been in your possession for one full Hawl without dropping below the Nisab threshold.',
    },
    'rizq': {
        term: 'rizq',
        display: 'Rizq',
        definition: 'Provision or sustenance provided by Allah (God).',
        longDefinition: 'Rizq refers to all aspects of sustenance and provision in your life, including wealth, health, and knowledge, which are believed to be provided by God.',
    },
    'local-first': {
        term: 'local-first',
        display: 'Local-First',
        definition: 'A software architecture where your data is stored on your device, not on a central server.',
        longDefinition: 'Local-First means your data lives on your device. We prioritize your privacy by ensuring your financial details are not sent to the cloud by default.',
    },
    'madhab': {
        term: 'madhab',
        display: 'Madhab',
        definition: 'A school of thought in Islamic jurisprudence.',
        longDefinition: 'A Madhab is a school of thought within Islamic jurisprudence (Fiqh). The four major Sunni schools are Hanafi, Maliki, Shafi\'i, and Hanbali. ZakApp supports calculations based on these methodologies.',
    },
    'fidyah': {
        term: 'fidyah',
        display: 'Fidyah',
        definition: 'Compensation for missed fasts that cannot be made up later, usually due to illness or age.',
        longDefinition: 'Fidyah is a donation of food or money to the poor, required when a fast is missed out of necessity (like chronic illness) and cannot be made up.'
    },
    'kaffarah': {
        term: 'kaffarah',
        display: 'Kaffarah',
        definition: 'Expiation for deliberately breaking a fast or oath.',
        longDefinition: 'Kaffarah is the penalty for deliberately breaking a fast during Ramadan without a valid reason, or breaking a solemn oath.'
    }
};

export const getGlossaryTerm = (term: string): GlossaryTerm | undefined => {
    return GLOSSARY[term.toLowerCase()];
};
