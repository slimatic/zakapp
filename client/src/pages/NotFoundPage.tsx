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
 className="px-4 py-2 rounded bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90"
 >
 Go to Dashboard
 </Link>
 <Link
 to="/nisab-records"
 className="px-4 py-2 rounded border border-border-strong text-foreground/80 text-sm font-medium hover:bg-muted :bg-muted"
 >
 Nisab Records
 </Link>
 <Link
 to="/calculator"
 className="px-4 py-2 rounded border border-border-strong text-foreground/80 text-sm font-medium hover:bg-muted :bg-muted"
 >
 Quick Calculator
 </Link>
 </nav>
 </div>
 );
}

export default NotFoundPage;