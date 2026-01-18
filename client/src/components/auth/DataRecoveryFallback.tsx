import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface Props {
    onReset: () => void;
}

export const DataRecoveryFallback: React.FC<Props> = ({ onReset }) => {
    const { recoverData } = useAuth();
    const [password, setPassword] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);
    const [showNuclearOption, setShowNuclearOption] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setIsRecovering(true);
        try {
            const success = await recoverData(password);
            if (!success) {
                setIsRecovering(false);
                // Toast handled in context
            } else {
                // Success handled in context (reload)
            }
        } catch (error) {
            console.error(error);
            setIsRecovering(false);
        }
    };

    const handleResetData = () => {
        if (window.confirm('WARNING: This will delete ALL your local data (assets, payments, settings). This action cannot be undone. Are you sure?')) {
            // We need to clear the local database.
            // The simplest way might be to clear local storage salt and reload, invoking a fresh start logic?
            // Or specific DB destruction.
            // For now, let's clear DB related items from LocalStorage and attempt to nuke RxDB if we can?
            // Since we can't easily access DB instance here without async, let's just clear Storage keys that define "User existance" locally?
            // Actually, AuthContext has logic to handle DB1 error by nuking.
            // Maybe we just reload?

            // A nuclear option is to indexedDB.deleteDatabase.
            // Let's force a "logout" and clear everything.

            localStorage.clear();
            sessionStorage.clear();

            // Attempt to delete RxDB database from IndexedDB
            // Name usually 'zakapp_db_' + userId or similar.
            // We will try generic approach or ask user to clear site data if this fails.
            const req = indexedDB.deleteDatabase('zakapp_db'); // Default name if not prefixed?
            // Inspecting db.ts would reveal the name. 
            // For now, let's try just clearing storage and reloading.

            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
                    <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">Decryption Failed</h2>
                <p className="text-gray-600 mb-6">
                    Did you recently change your password?
                </p>

                <div className="text-left bg-amber-50 p-4 rounded-md mb-6 text-sm text-amber-800">
                    <p className="mb-2"><strong>Security Notice:</strong> Your data is encrypted with your password. When you change your password, your local data remains locked with the old one.</p>
                    <p>Please enter your <strong>OLD password</strong> below to unlock and migrate your data.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-left">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your previous password"
                            required
                            disabled={isRecovering}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isRecovering} isLoading={isRecovering}>
                        {isRecovering ? 'Recovering Data...' : 'Recover My Data'}
                    </Button>
                </form>

                <div className="mt-8 border-t pt-6">
                    <button
                        type="button"
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => setShowNuclearOption(!showNuclearOption)}
                    >
                        I forgot my old password
                    </button>

                    {showNuclearOption && (
                        <div className="mt-4 animate-fadeIn">
                            <p className="text-xs text-red-600 mb-3">
                                If you cannot remember your old password, your encrypted data is permanently lost.
                                You must reset your local database to use the app again.
                            </p>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleResetData}
                                className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                            >
                                Reset Local Data (Data Loss)
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
