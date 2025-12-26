import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfills for test environment
// Provide TextEncoder/TextDecoder for libraries like jspdf
import { TextEncoder, TextDecoder } from 'util';

if (typeof (global as any).TextEncoder === 'undefined') {
	(global as any).TextEncoder = TextEncoder as any;
}

if (typeof (global as any).TextDecoder === 'undefined') {
	(global as any).TextDecoder = TextDecoder as any;
}

// Provide a simple matchMedia mock for components that use it
if (typeof window.matchMedia === 'undefined') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => { },
			removeListener: () => { },
			addEventListener: () => { },
			removeEventListener: () => { },
			dispatchEvent: () => false
		})
	});
}

// Mock jsPDF and autotable
/* eslint-disable @typescript-eslint/no-var-requires */
try {
	vi.mock('jspdf', () => {
		const mockJsPDF = vi.fn().mockImplementation(() => ({
			internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
			setFontSize: vi.fn(),
			setFont: vi.fn(),
			text: vi.fn(),
			splitTextToSize: vi.fn((text: any) => (Array.isArray(text) ? text : [String(text)])),
			getNumberOfPages: vi.fn(() => 1),
			setPage: vi.fn(),
			addPage: vi.fn(),
			save: vi.fn(),
			output: vi.fn(() => new Blob())
		}));
		return { __esModule: true, jsPDF: mockJsPDF, default: mockJsPDF };
	});

	vi.mock('jspdf-autotable', () => {
		function autoTable(doc: any) {
			(doc as any).lastAutoTable = { finalY: ((doc as any).lastAutoTable?.finalY || 0) + 50 };
			return doc;
		}
		return { __esModule: true, default: autoTable };
	});

	// Global stub for PrivacyContext
	// Note: Vitest handles module mocking slightly differently, but vi.mock works for paths too if aliases align
	// We will verify if this block is needed or if we should rely on individual test mocks
} catch (e) {
	// ignore
}

// Ensure a safe default for useNavigate
try {
	//   const reactRouter = require('react-router-dom');
	//   if (reactRouter && reactRouter.useNavigate) {
	//     vi.spyOn(reactRouter, 'useNavigate').mockImplementation(() => vi.fn());
	//   }
	// Better approach: Mock the module directly
	vi.mock('react-router-dom', async () => {
		const actual = await vi.importActual('react-router-dom');
		return {
			...actual,
			useNavigate: () => vi.fn(),
		};
	});
} catch (e) {
	// ignore
}

// Shim jest for legacy code if needed
// Shim jest for legacy code if needed
const jestShim = {
	...vi,
	fn: vi.fn,
	mock: vi.mock,
	spyOn: vi.spyOn,
	clearAllMocks: vi.clearAllMocks,
	resetAllMocks: vi.resetAllMocks,
	restoreAllMocks: vi.restoreAllMocks,
	isMockFunction: vi.isMockFunction,
};
(global as any).jest = jestShim;
(window as any).jest = jestShim;

import { resetDb } from './db';
import { afterEach } from 'vitest';

// Reset Database after each test to ensure isolation
afterEach(async () => {
	await resetDb();
});

