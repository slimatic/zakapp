// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
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
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		})
	});
}

// Mock jsPDF and autotable used by pdfGenerator unit tests
// Provide minimal implementations for methods used in tests
/* eslint-disable @typescript-eslint/no-var-requires */
try {
	// Register module mocks for jest
	// Export both default and named `jsPDF` so tests can mock either import style
	jest.mock('jspdf', () => {
		const mockJsPDF = jest.fn().mockImplementation(() => ({
			internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
			setFontSize: jest.fn(),
			setFont: jest.fn(),
			text: jest.fn(),
			splitTextToSize: jest.fn((text: any) => (Array.isArray(text) ? text : [String(text)])),
			getNumberOfPages: jest.fn(() => 1),
			setPage: jest.fn(),
			addPage: jest.fn(),
			save: jest.fn(),
			output: jest.fn(() => new Blob())
		}));
		return { __esModule: true, jsPDF: mockJsPDF, default: mockJsPDF };
	});

	jest.mock('jspdf-autotable', () => {
		function autoTable(doc: any) {
			(doc as any).lastAutoTable = { finalY: ((doc as any).lastAutoTable?.finalY || 0) + 50 };
			return doc;
		}
		return { __esModule: true, default: autoTable };
	});

	// Global stub for PrivacyContext hooks to avoid provider-related errors in many component tests
	try {
		// Resolve the local module path and mock it so imports using relative paths are intercepted
		const privacyModule = require.resolve('./contexts/PrivacyContext');
		jest.mock(privacyModule, () => ({
			__esModule: true,
			PrivacyProvider: ({ children }: any) => children,
			usePrivacy: () => ({ privacyMode: false, togglePrivacyMode: () => {}, setPrivacyMode: () => {} }),
			useMaskedCurrency: () => ((v: string) => v)
		}));
	} catch (e) {
		// ignore when running outside jest or when module path differs
	}

	// Also mock absolute/alias import path if tests import from 'src/contexts/PrivacyContext'
	try {
		jest.mock('src/contexts/PrivacyContext', () => ({
			__esModule: true,
			PrivacyProvider: ({ children }: any) => children,
			usePrivacy: () => ({ privacyMode: false, togglePrivacyMode: () => {}, setPrivacyMode: () => {} }),
			useMaskedCurrency: () => ((v: string) => v)
		}));
	} catch (e) {
		// ignore
	}
} catch (e) {
	// ignore when running outside jest
}

import '@testing-library/jest-dom';

// Ensure a safe default for useNavigate across tests to avoid Router context errors
try {
  const reactRouter = require('react-router-dom');
  if (reactRouter && reactRouter.useNavigate) {
    jest.spyOn(reactRouter, 'useNavigate').mockImplementation(() => jest.fn());
  }
} catch (e) {
  // ignore when running outside jest or if require fails
}
