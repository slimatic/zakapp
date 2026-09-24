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
import { LanguageSwitcher } from '../../components/settings/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileForm } from './components/ProfileForm';
import { SecuritySettings } from './components/SecuritySettings';
import { DataManagement } from './components/DataManagement';
import { DangerZone } from './components/DangerZone';
import { HelpSupport } from './components/HelpSupport';
import { NotificationSettings } from './components/NotificationSettings';
import { User, Lock, Database, AlertOctagon, LayoutDashboard, Bell } from 'lucide-react';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'data' | 'help' | 'danger';

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const navigation = [
        { id: 'profile', name: 'Profile Information', icon: User },
        { id: 'security', name: 'Security', icon: Lock },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'data', name: 'Data Management', icon: Database },
        { id: 'help', name: 'Help & Support', icon: User },
        { id: 'danger', name: 'Danger Zone', icon: AlertOctagon },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
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
                                        ? 'bg-accent text-secondary'
                                        : 'text-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    aria-current={activeTab === item.id ? 'page' : undefined}
                                >
                                    <Icon
                                        className={`flex-shrink-0 [margin-inline-start:-0.25rem] me-3 h-5 w-5 ${activeTab === item.id ? 'text-secondary' : 'text-muted-foreground group-hover:text-muted-foreground'
                                            }`}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{item.name}</span>
                                </button>
                            );
                        })}

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
                                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 
                                    bg-muted text-secondary 
                                    hover:shadow-sm border border-border"
                                >
                                    <LayoutDashboard
                                        className="flex-shrink-0 [margin-inline-start:-0.25rem] me-3 h-5 w-5 text-secondary"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate font-bold text-secondary">
                                        Admin Dashboard
                                    </span>
                                </button>
                            </div>
                        )}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-surface rounded-lg shadow min-h-[500px]">
                    <div className="p-6 md:p-8">
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
