import React from 'react';
import { SystemDiagnostics } from '../components/common/SystemDiagnostics';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * No <Layout> here: the /diagnostics route in App.tsx already renders this page
 * inside one. Wrapping again produced a second sidebar, a second top bar and a
 * doubled footer nested inside the real shell.
 */
const DiagnosticsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 ps-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            <SystemDiagnostics />
        </div>
    );
};

export default DiagnosticsPage;
