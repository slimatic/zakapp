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
import { Link } from 'react-router-dom';

/**
 * Catch-all 404 page. Rendered for any URL that doesn't match a route, so
 * users never hit a silent blank page (previously only the skip-link
 * rendered — see issue #377).
 */
export function NotFoundPage() {
 return (
 <div
 className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
 data-testid="not-found-page"
 >
 <h1 className="text-6xl font-bold text-foreground mb-4">
 404
 </h1>
 <h2 className="text-xl font-semibold text-foreground/80 mb-2">
 Page not found
 </h2>
 <p className="text-muted-foreground mb-6 max-w-md">
 The page you're looking for doesn't exist or may have moved. Your
 saved data is safe — use the links below to get back on track.
 </p>
 <nav className="flex flex-wrap gap-3 justify-center" aria-label="Helpful links">
 <Link
 to="/dashboard"
 className="inline-flex min-h-[44px] items-center rounded bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
 >
 Go to Dashboard
 </Link>
 <Link
 to="/nisab-records"
 className="inline-flex min-h-[44px] items-center rounded border border-border-strong px-4 text-sm font-medium text-foreground/80 hover:bg-muted"
 >
 Nisab Records
 </Link>
 <Link
 to="/calculator"
 className="inline-flex min-h-[44px] items-center rounded border border-border-strong px-4 text-sm font-medium text-foreground/80 hover:bg-muted"
 >
 Quick Calculator
 </Link>
 </nav>
 </div>
 );
}

export default NotFoundPage;