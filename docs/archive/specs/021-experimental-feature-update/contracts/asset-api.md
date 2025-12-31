# API Contract: Asset endpoints (partial)

## GET /api/assets/:id
Response 200

```json
{
  "success": true,
  "asset": {
    "assetId": "string",
    "name": "string",
    "category": "string",
    "subCategory": "string",
    "value": 10000,
    "currency": "USD",
    "acquisitionDate": "2025-12-13T00:00:00.000Z",
    "description": "string",
    "zakatEligible": true,
    "calculationModifier": 0.3,
    "isPassiveInvestment": true,
    "isRestrictedAccount": false,
    "suggestedPassiveDefault": true,
    "createdAt": "2025-12-12T00:00:00.000Z",
    "updatedAt": "2025-12-12T00:00:00.000Z"
  }
}
```

Notes:
- `suggestedPassiveDefault` is a server-supplied boolean suggestion for the UI to pre-check the Passive checkbox. It does not indicate persisted state.

## PUT /api/assets/:id
Request Body (partial)

```json
{
  "name": "string",
  "value": 10000,
  "currency": "USD",
  "acquisitionDate": "2025-12-13",
  "isPassiveInvestment": true,
  "isRestrictedAccount": false
}
```

Response 200: returns the saved `asset` object matching GET shape.

Server-side rules (enforced):
- `isPassiveInvestment` must be false when `isRestrictedAccount` is true.
- `calculationModifier` is derived server-side from flags: restricted → 0.0, passive → 0.3, else 1.0.
