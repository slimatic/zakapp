# Pull Request Checklist

Thank you for contributing to ZakApp! Please ensure your PR adheres to our core pillars.

## 🏗 Architect (@architect)
- [ ] **Zero-Knowledge**: No unencrypted financial data leaves the client. `window.crypto` is used for all sensitive operations.
- [ ] **Local-First**: Logic works offline. Database access is via `RxDB`/`sqlite-wasm`, not direct server calls.
- [ ] **Type Safety**: Strictly typed TypeScript (no `any`). Google Style Guide followed.
- [ ] **Performance**: No heavy computations on the main thread (use Workers if needed).

## 🎨 Designer (@designer)
- [ ] **Privacy UI**: "Encrypted on Device" indicators are present for sensitive inputs.
- [ ] **Accessibility**: WCAG 2.2 AA compliant. 4.5:1 contrast, 44px targets, proper Aria labels.
- [ ] **Trust**: No dark patterns. Clear "Just-in-Time" permission requests.
- [ ] **Responsiveness**: Mobile-first design verified.

## ⚖️ Faqih (@faqih)
- [ ] **Fiqh Precision**: Calculations use `BigNumber` (no floating point errors).
- [ ] **Madhab Compliance**: Logic respects selected Madhab rules (e.g. Jewelry exemption).
- [ ] **Precaution**: "Safer/Precautionary" view taken where ambiguity exists.
- [ ] **Verification**: Unit tests exist for specific Fiqh rules invoked by this PR.

## 📝 Description
Please include a summary of the changes and the related issue.

## 📸 Screenshots (if UI related)
