/**
 * Core data models for zakapp
 * These define the structure of our encrypted JSON data storage
 */

class User {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.username = data.username || '';
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.settings = data.settings || {
      preferredCalendar: 'lunar', // 'lunar' or 'solar'
      currency: 'USD',
      locale: 'en-US',
      timezone: 'UTC'
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  toJSON() {
    const { passwordHash, ...safeData } = this;
    return safeData;
  }
}

class AssetSnapshot {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId || '';
    this.snapshotDate = data.snapshotDate || new Date().toISOString();
    this.calendarType = data.calendarType || 'lunar'; // 'lunar' or 'solar'
    this.assets = data.assets || {};
    this.liabilities = data.liabilities || {};
    this.netWorth = data.netWorth || 0;
    this.zakatDue = data.zakatDue || 0;
    this.zakatCalculations = data.zakatCalculations || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class Asset {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.type = data.type || ''; // 'cash', 'savings', 'investment', 'gold', 'silver', 'property', etc.
    this.category = data.category || ''; // More specific categorization
    this.name = data.name || '';
    this.description = data.description || '';
    this.value = data.value || 0;
    this.currency = data.currency || 'USD';
    this.zakatEligible = data.zakatEligible !== undefined ? data.zakatEligible : true;
    this.zakatCalculationMethod = data.zakatCalculationMethod || 'standard';
    this.metadata = data.metadata || {}; // Additional asset-specific data
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class Liability {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.type = data.type || ''; // 'debt', 'loan', 'mortgage', etc.
    this.name = data.name || '';
    this.description = data.description || '';
    this.amount = data.amount || 0;
    this.currency = data.currency || 'USD';
    this.deductibleFromZakat = data.deductibleFromZakat !== undefined ? data.deductibleFromZakat : true;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class ZakatCalculation {
  constructor(data = {}) {
    this.assetType = data.assetType || '';
    this.totalValue = data.totalValue || 0;
    this.nisab = data.nisab || 0;
    this.zakatRate = data.zakatRate || 0.025; // 2.5% default
    this.zakatAmount = data.zakatAmount || 0;
    this.eligible = data.eligible || false;
    this.calculationMethod = data.calculationMethod || 'standard';
    this.notes = data.notes || '';
  }
}

class ZakatRecord {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId || '';
    this.year = data.year || new Date().getFullYear();
    this.snapshotId = data.snapshotId || '';
    this.totalZakatDue = data.totalZakatDue || 0;
    this.zakatPaid = data.zakatPaid || 0;
    this.zakatRemaining = data.zakatRemaining || 0;
    this.payments = data.payments || []; // Array of payment records
    this.status = data.status || 'calculated'; // 'calculated', 'partial', 'completed'
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class ZakatPayment {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.amount = data.amount || 0;
    this.currency = data.currency || 'USD';
    this.recipient = data.recipient || '';
    this.paymentDate = data.paymentDate || new Date().toISOString();
    this.notes = data.notes || '';
    this.paymentMethod = data.paymentMethod || '';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

module.exports = {
  User,
  AssetSnapshot,
  Asset,
  Liability,
  ZakatCalculation,
  ZakatRecord,
  ZakatPayment
};