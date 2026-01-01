export interface FAQItem {
    category: string;
    question: string;
    answer: string;
}

export const FAQS_DATA: FAQItem[] = [
    // 1. General Principles & Basics
    {
        category: "General Principles",
        question: "What is Zakat?",
        answer: "Zakat is a mandatory charitable contribution and the third pillar of Islam. It serves as a purification for your wealth and a means of social welfare. It is not a tax on income, but a charge on accumulated surplus wealth."
    },
    {
        category: "General Principles",
        question: "Who must pay Zakat?",
        answer: "Every Muslim who owns wealth that meets or exceeds the Nisab (minimum threshold) and has held that wealth for a full lunar year (Hawl). The wealth must be fully owned, in excess of personal needs, and productive (capable of growth)."
    },
    {
        category: "General Principles",
        question: "What is the Nisab?",
        answer: "The Nisab is the minimum wealth threshold for Zakat liability. Gold: 85g pure gold. Silver: 595g pure silver. The Silver Nisab is preferred as it limits poverty by allowing more people to contribute."
    },
    {
        category: "General Principles",
        question: "When is Zakat due?",
        answer: "Zakat is due once one lunar year (Hawl) has passed since you possessed wealth above the Nisab. If using the Gregorian calendar, the rate increases to 2.578% to account for the longer solar year."
    },

    // 2. Assets & Calculation
    {
        category: "Assets & Calculation",
        question: "What is the general Zakat rate?",
        answer: "For most assets (cash, gold, silver, merchandise), the rate is 2.5% of the total value."
    },
    {
        category: "Assets & Calculation",
        question: "How do I pay Zakat on Cash?",
        answer: "Calculate 2.5% of your total cash holdings, including cash on hand, checking accounts, savings accounts, and digital currencies."
    },
    {
        category: "Assets & Calculation",
        question: "Do I pay Zakat on Jewelry?",
        answer: "Investment/Savings jewelry is Zakatable (market value of metal). For personal use jewelry, opinions differ: The Hanafi school of thought says pay on all gold/silver; others exempt it. Calculating 2.5% on the metal weight is the safer approach."
    },
    {
        category: "Assets & Calculation",
        question: "How do I treat Stocks?",
        answer: "Active Traders: Pay 2.5% on total value. Long-term Investors: Pay on zakatable assets of the company only (approx. 30% of market value x 2.5%)."
    },
    {
        category: "Assets & Calculation",
        question: "Retirement Accounts (401k, IRA)?",
        answer: "Accessible funds (e.g., Roth): Treat as investment (Accessible Amt x 30% x 2.5%). Inaccessible funds (e.g., Traditional 401k): Zakat is usually due only upon receipt (withdrawal)."
    },
    {
        category: "Assets & Calculation",
        question: "Is my Home or Car Zakatable?",
        answer: "No. Primary residence, personal vehicles, clothing, household furniture, and tools for work are exempt from Zakat."
    },
    {
        category: "Assets & Calculation",
        question: "How is Rental Property treated?",
        answer: "The property value itself is exempt (0%). Zakat is only due on the accumlated Net Rental Income (Rent minus Expenses) that remains in your possession. If there is a net loss, no Zakat is due on the income."
    },
    {
        category: "Assets & Calculation",
        question: "How is Cryptocurrency treated?",
        answer: "Crypto is treated as currency or merchandise. Zakat is 2.5% of the total market value."
    },

    // 3. Deducting Expenses
    {
        category: "Liabilities",
        question: "Can I deduct debts?",
        answer: "You may deduct immediate debts due now (this month's bills/payments). You cannot deduct the entire balance of long-term debts (like a 30-year mortgage), only the current due payment."
    },

    // 4. Haram Earnings
    {
        category: "Purification",
        question: "Do I pay Zakat on Haram income?",
        answer: "No. Haram wealth does not count for Zakat. You must purify it by donating 100% of such income to charity (without expecting reward)."
    },

    // 5. Recipients
    {
        category: "Recipients",
        question: "Who can receive Zakat?",
        answer: "Eight categories: The Poor, The Needy, Zakat Collectors, Reconciling Hearts, Freeing Captives, Debtors, In the Cause of Allah, and Wayfarers."
    },
    {
        category: "Recipients",
        question: "Who CANNOT receive Zakat?",
        answer: "The wealthy, your immediate family (parents, children, spouse), and the family of the Prophet (SAW). Non-Muslims generally receive Sadaqah, not Zakat."
    },

    // 6. Zakat al-Fitr
    {
        category: "Zakat al-Fitr",
        question: "What is Zakat al-Fitr?",
        answer: "A mandatory charity due before Eid al-Fitr prayer to purify the fast. It is ~2.5kg of staple food (or its cash value) per person in the household."
    }
];
