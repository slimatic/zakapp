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


import React from 'react';
import { LanguageSwitcher } from '../../components/settings/LanguageSwitcher';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileForm } from './components/ProfileForm';
import { SecuritySettings } from './components/SecuritySettings';
import { DataManagement } from './components/DataManagement';
import { DangerZone } from './components/DangerZone';
import { HelpSupport } from './components/HelpSupport';
import { NotificationSettings } from './components/NotificationSettings';
import { User, Lock, Database, AlertOctagon, LayoutDashboard, Bell, HelpCircle } from 'lucide-react';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'data' | 'help' | 'danger';

const TAB_IDS: SettingsTab[] = ['profile', 'security', 'notifications', 'data', 'help', 'danger'];

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    // The open tab lives in the URL so it survives a refresh, works with the back
    // button, and can be linked to directly (/settings?tab=data). Previously it was
    // component state only, so every visit landed on Profile no matter which section
    // the user came for.
    const [searchParams, setSearchParams] = useSearchParams();
    const requested = searchParams.get('tab') as SettingsTab | null;
    const activeTab: SettingsTab = requested && TAB_IDS.includes(requested) ? requested : 'profile';

    const setActiveTab = (tab: SettingsTab) => {
        // replace: switching tabs should not fill the history stack with entries.
        setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true });
    };

    const navigation = [
        { id: 'profile', name: 'Profile Information', icon: User },
        { id: 'security', name: 'Security', icon: Lock },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'data', name: 'Data Management', icon: Database },
        { id: 'help', name: 'Help & Support', icon: HelpCircle },
        { id: 'danger', name: 'Danger Zone', icon: AlertOctagon },
    ];

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account preferences and data
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Sidebar Navigation.
                    On a phone this is a horizontally scrolling strip rather than a
                    stacked list: six full-width rows pushed the actual settings
                    content below the fold, so opening Settings showed a menu and
                    nothing else. A strip keeps the content visible and matches how
                    the rest of the app navigates. */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav
                        className="-mx-4 flex gap-1.5 overflow-x-auto scroll-px-4 px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
                        aria-label="Settings sections"
                    >
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const selected = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as SettingsTab)}
                                    className={`flex-shrink-0 flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium rounded-md transition-colors lg:w-full lg:whitespace-normal ${selected
                                        ? 'bg-accent text-secondary'
                                        : 'text-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    aria-current={selected ? 'page' : undefined}
                                >
                                    <Icon
                                        className={`flex-shrink-0 h-5 w-5 ${selected ? 'text-secondary' : 'text-muted-foreground'}`}
                                        aria-hidden="true"
                                    />
                                    <span className="lg:truncate">{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Language Selection (#338) */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Language
                        </h3>
                        <div className="px-3">
                            <LanguageSwitcher className="w-full" />
                        </div>
                    </div>

                    {/* Admin Dashboard Link - Separated */}
                    {user?.isAdmin && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Administration
                            </h3>
                            <button
                                onClick={() => navigate('/admin')}
                                className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 
                                bg-muted text-secondary
                                hover:shadow-sm border border-border"
                            >
                                <LayoutDashboard
                                    className="flex-shrink-0 me-3 h-5 w-5 text-secondary"
                                    aria-hidden="true"
                                />
                                <span className="truncate font-bold text-secondary">
                                    Admin Dashboard
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 bg-surface rounded-lg shadow min-h-[500px]">
                    <div className="p-4 sm:p-6 md:p-8">
                        {activeTab === 'profile' && <ProfileForm />}
                        {activeTab === 'security' && <SecuritySettings />}
                        {activeTab === 'notifications' && <NotificationSettings />}
                        {activeTab === 'data' && <DataManagement />}
                        {activeTab === 'help' && <HelpSupport />}
                        {activeTab === 'danger' && <DangerZone />}
                    </div>
                </div>
            </div>
        </div>
    );
};
