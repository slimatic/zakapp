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
import MethodologyExplainer from './MethodologyExplainer';
import NisabExplainer from './NisabExplainer';

/**
 * EducationalContent Component - T026
 *
 * Main educational content component with FAQ, methodology explanations,
 * and comprehensive Islamic finance education.
 */
const EducationalContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'methodologies' | 'nisab' | 'faq'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Zakat?",
      answer: "Zakat is one of the Five Pillars of Islam. It is a mandatory form of almsgiving and purification of wealth. Muslims who meet the nisab threshold must pay 2.5% of their zakatable assets annually to those in need.",
      category: "basics"
    },
    {
      question: "Who must pay Zakat?",
      answer: "Every Muslim who possesses wealth above the nisab threshold for one full lunar year must pay Zakat. This includes adults who are sane, free, and have reached puberty. Zakat is not obligatory on children or those who are mentally incapacitated.",
      category: "eligibility"
    },
    {
      question: "What is Nisab?",
      answer: "Nisab is the minimum threshold of wealth that makes Zakat obligatory. It is calculated based on the value of either 87.48 grams of gold or 612.36 grams of pure silver. If your total zakatable assets fall below this threshold, you are not required to pay Zakat.",
      category: "threshold"
    },
    {
      question: "What assets are zakatable?",
      answer: "Zakatable assets include: cash, gold, silver, business inventory, investment accounts, rental income, and debts owed to you. Non-zakatable assets include: primary residence, personal use items, debts you owe, and assets below nisab threshold.",
      category: "assets"
    },
    {
      question: "When is Zakat due?",
      answer: "Zakat becomes due when one lunar year (354-355 days) has passed since your wealth reached the nisab threshold. You can pay it immediately or wait until the end of the lunar year. Many Muslims pay Zakat during Ramadan.",
      category: "timing"
    },
    {
      question: "How is Zakat calculated?",
      answer: "Zakat is calculated at 2.5% of your total zakatable assets. First, calculate your total wealth, subtract any debts you owe, then apply the 2.5% rate to the remaining amount above the nisab threshold.",
      category: "calculation"
    },
    {
      question: "Who receives Zakat?",
      answer: "Zakat must be distributed to eight categories of recipients as mentioned in the Quran: the poor, orphans, widows, the disabled, those in debt, wayfarers, those working in the path of Allah, and the children of the destitute.",
      category: "distribution"
    },
    {
      question: "Can Zakat be given to family members?",
      answer: "While Zakat can be given to relatives who qualify as recipients (poor relatives, orphans in the family, etc.), it is preferred to give Zakat to those outside your immediate family to maximize the reward and help those most in need.",
      category: "distribution"
    },
    {
      question: "What about Zakat on investments and retirement accounts?",
      answer: "Investment accounts and retirement savings are zakatable if they represent accumulated wealth. However, many scholars consider retirement accounts as 'deferred consumption' and exempt them from Zakat until withdrawal.",
      category: "assets"
    },
    {
      question: "Is cryptocurrency zakatable?",
      answer: "Cryptocurrency is treated like other currencies and commodities. If held for investment purposes and above nisab threshold, it is subject to Zakat at 2.5% of its value.",
      category: "assets"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const glossaryTerms = [
    { term: "Zakat", definition: "Mandatory almsgiving and purification of wealth" },
    { term: "Nisab", definition: "Minimum wealth threshold for Zakat obligation" },
    { term: "Zakatable", definition: "Assets subject to Zakat calculation" },
    { term: "Sadaqah", definition: "Voluntary charity (different from obligatory Zakat)" },
    { term: "Lunar Year", definition: "Islamic calendar year of 354-355 days" },
    { term: "Hawl", definition: "One complete lunar year period for Zakat calculation" }
  ];

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = "Learn about Zakat calculation and Islamic finance principles";

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Zakat Education Center</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive guide to understanding Zakat principles, calculations, and Islamic financial obligations
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: '📚' },
              { id: 'methodologies', label: 'Methodologies', icon: '⚖️' },
              { id: 'nisab', label: 'Nisab Threshold', icon: '🪙' },
              { id: 'faq', label: 'FAQ', icon: '❓' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Introduction */}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding Zakat</h2>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Zakat is the third pillar of Islam and represents a fundamental principle of Islamic finance.
                  It serves as both a spiritual purification of wealth and a social welfare system designed to
                  promote economic justice and community welfare.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Spiritual Significance</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Purification of wealth from the love of materialism</li>
                      <li>• Expression of gratitude to Allah for blessings</li>
                      <li>• Development of compassion and generosity</li>
                      <li>• Spiritual growth through charitable giving</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Social Impact</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Redistribution of wealth in society</li>
                      <li>• Support for the vulnerable and needy</li>
                      <li>• Reduction of poverty and inequality</li>
                      <li>• Community building and social cohesion</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Key Principles */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Principles of Zakat</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">2.5%</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Fixed Rate</h4>
                    <p className="text-sm text-gray-600">Simple 2.5% of zakatable wealth</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📅</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Annual Obligation</h4>
                    <p className="text-sm text-gray-600">Due once per lunar year</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🤝</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Community Benefit</h4>
                    <p className="text-sm text-gray-600">Distributed to 8 categories</p>
                  </div>
                </div>
              </div>

              {/* Islamic References */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quranic Foundation</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">Surah At-Taubah (9:103)</span>
                    </div>
                    <blockquote className="text-gray-700 italic">
                      "Take, [O, Muhammad], from their wealth a charity by which you purify them and cause them increase, and invoke [Allah's blessings] upon them. Indeed, your invocations are reassurance for them..."
                    </blockquote>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">Surah Al-Baqarah (2:267)</span>
                    </div>
                    <blockquote className="text-gray-700 italic">
                      "O you who have believed, spend from the good things which you have earned and from that which We have produced for you from the earth..."
                    </blockquote>
                  </div>
                </div>
              </div>

              {/* Glossary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Islamic Finance Glossary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {glossaryTerms.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <span className="font-medium text-gray-900">{item.term}:</span>
                      <span className="text-gray-600 text-sm ml-4">{item.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'methodologies' && <MethodologyExplainer />}

          {activeTab === 'nisab' && <NisabExplainer />}

          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${
                          expandedFaq === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {faq.category}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500">No FAQ entries found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Share This Knowledge</h3>
          <p className="text-gray-600 mb-4">Help others learn about Zakat and Islamic finance</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
          </div>
        </div>
      </div>

      {/* Footer Resources */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://simple-zakat-guide.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-blue-600">Simple Zakat Guide</span>
            </a>
            <a
              href="https://www.zakat.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-blue-600">Zakat Foundation</span>
            </a>
            <a
              href="https://www.islamicrelief.org/zakat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-blue-600">Islamic Relief</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalContent;