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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ZakatDisplayCard from '../../src/components/tracking/ZakatDisplayCard';
import { PrivacyProvider } from '../../src/contexts/PrivacyContext';

const sampleRecord = {
  id: 'r1',
  status: 'DRAFT',
  totalWealth: '8100',
  zakatableWealth: '3900',
  zakatAmount: '97.5',
};

describe('ZakatDisplayCard', () => {
  it('shows total wealth and zakatable wealth and calculated zakat', () => {
    render(
      <PrivacyProvider>
        <ZakatDisplayCard record={sampleRecord as any} />
      </PrivacyProvider>
    );

    expect(screen.getByText(/Total Wealth:/)).toBeInTheDocument();
    expect(screen.getByText(/Zakatable Wealth:/)).toBeInTheDocument();
    expect(screen.getByText(/Zakat Amount/i)).toBeInTheDocument();
  });
});
