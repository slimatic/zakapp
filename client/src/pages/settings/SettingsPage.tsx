
import React, { useState } from 'react';
import { Layout } from '../../components/layout/Layout'; // Assuming Layout exists
import { ProfileForm } from './components/ProfileForm';
import { SecuritySettings } from './components/SecuritySettings';
import { DataManagement } from './components/DataManagement';
import { DangerZone } from './components/DangerZone';
import { HelpSupport } from './components/HelpSupport';
import { User, Lock, Database, AlertOctagon } from 'lucide-react';

type SettingsTab = 'profile' | 'security' | 'data' | 'help' | 'danger';

export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const navigation = [
        { id: 'profile', name: 'Profile Information', icon: User },
        { id: 'security', name: 'Security', icon: Lock },
        { id: 'data', name: 'Data Management', icon: Database },
        { id: 'help', name: 'Help & Support', icon: User }, // Or a HelpCircle icon if available, reusing User for now or importing HelpCircle
        { id: 'danger', name: 'Danger Zone', icon: AlertOctagon },
    ];

    return (
        // If Layout wraps pages in App.tsx/routes, we might not need to render it here.
        // However, usually pages are standalone. Let's assume standardized container usage.
        // I'll use a container div, assuming the Router wraps this in the Layout.
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">
                    Manage your account preferences and data
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as SettingsTab)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    aria-current={activeTab === item.id ? 'page' : undefined}
                                >
                                    <Icon
                                        className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${activeTab === item.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                            }`}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-lg shadow min-h-[500px]">
                    <div className="p-6 md:p-8">
                        {activeTab === 'profile' && <ProfileForm />}
                        {activeTab === 'security' && <SecuritySettings />}
                        {activeTab === 'data' && <DataManagement />}
                        {activeTab === 'help' && <HelpSupport />}
                        {activeTab === 'danger' && <DangerZone />}
                    </div>
                </div>
            </div>
        </div>
    );
};
