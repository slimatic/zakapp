import React from 'react';
import { Layout } from '../components/layout/Layout';
import { SystemDiagnostics } from '../components/common/SystemDiagnostics';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DiagnosticsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="container mx-auto py-6 max-w-4xl space-y-6">
                <div>
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
                
                <SystemDiagnostics />
            </div>
        </Layout>
    );
};

export default DiagnosticsPage;
