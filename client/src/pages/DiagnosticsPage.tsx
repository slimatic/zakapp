/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
