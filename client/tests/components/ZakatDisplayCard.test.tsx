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

1|import React from 'react';
2|import { render, screen } from '@testing-library/react';
3|import '@testing-library/jest-dom';
4|import ZakatDisplayCard from '../../src/components/tracking/ZakatDisplayCard';
5|import { PrivacyProvider } from '../../src/contexts/PrivacyContext';
6|
7|const sampleRecord = {
8|  id: 'r1',
9|  status: 'DRAFT',
10|  totalWealth: '8100',
11|  zakatableWealth: '3900',
12|  zakatAmount: '97.5',
13|};
14|
15|describe('ZakatDisplayCard', () => {
16|  it('shows total wealth and zakatable wealth and calculated zakat', () => {
17|    render(
18|      <PrivacyProvider>
19|        <ZakatDisplayCard record={sampleRecord as any} />
20|      </PrivacyProvider>
21|    );
22|
23|    expect(screen.getByText(/Total Wealth:/)).toBeInTheDocument();
24|    expect(screen.getByText(/Zakatable Wealth:/)).toBeInTheDocument();
25|    expect(screen.getByText(/Zakat Amount/i)).toBeInTheDocument();
26|  });
27|});
28|