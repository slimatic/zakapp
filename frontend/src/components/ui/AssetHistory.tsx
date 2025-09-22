import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash2, ArrowUpRight, ArrowDownRight, Eye, Search } from 'lucide-react';

interface HistoryEntry {
  historyId: string;
  assetId: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
  newData: any;
  oldData?: any;
}

interface AssetHistoryProps {
  onNavigate?: (view: 'dashboard' | 'assets' | 'calculate' | 'history') => void;
}

const AssetHistory: React.FC<AssetHistoryProps> = ({ onNavigate }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/assets/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'updated':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 border-green-200';
      case 'updated':
        return 'bg-blue-100 border-blue-200';
      case 'deleted':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getValueChange = (entry: HistoryEntry) => {
    if (entry.action === 'created') {
      return {
        type: 'new',
        amount: entry.newData.value,
        currency: entry.newData.currency,
      };
    }
    
    if (entry.action === 'deleted') {
      return {
        type: 'removed',
        amount: entry.newData.value,
        currency: entry.newData.currency,
      };
    }

    if (entry.action === 'updated' && entry.oldData) {
      const oldValue = entry.oldData.value || 0;
      const newValue = entry.newData.value || 0;
      const difference = newValue - oldValue;
      
      return {
        type: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'unchanged',
        amount: Math.abs(difference),
        oldValue,
        newValue,
        currency: entry.newData.currency,
      };
    }

    return null;
  };

  const filteredHistory = history.filter(entry => {
    const matchesSearch = entry.newData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.newData.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || entry.action === selectedAction;
    const matchesAsset = selectedAssetId === 'all' || entry.assetId === selectedAssetId;
    
    return matchesSearch && matchesAction && matchesAsset;
  });

  const uniqueAssets = Array.from(new Set(history.map(entry => entry.assetId)))
    .map(id => {
      const entry = history.find(h => h.assetId === id);
      return { id, name: entry?.newData.name || 'Unknown Asset' };
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading asset history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error Loading History</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Asset History</h1>
          <p className="text-neutral-600">Track changes to your assets over time</p>
        </div>
        <button
          onClick={() => onNavigate?.('assets')}
          className="btn-primary flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Manage Assets
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
            </select>

            {/* Asset Filter */}
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Assets</option>
              {uniqueAssets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No History Found</h3>
              <p className="text-neutral-600 mb-4">
                {history.length === 0 
                  ? "You haven't made any changes to your assets yet."
                  : "No entries match your current filters."
                }
              </p>
              {history.length === 0 && (
                <button
                  onClick={() => onNavigate?.('assets')}
                  className="btn-primary"
                >
                  Add Your First Asset
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((entry) => {
              const valueChange = getValueChange(entry);
              
              return (
                <div key={entry.historyId} className="card">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-full border-2 ${getActionColor(entry.action)}`}>
                        {getActionIcon(entry.action)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-neutral-900">
                              {entry.newData.name}
                            </h3>
                            <p className="text-sm text-neutral-600 capitalize">
                              {entry.action} • {entry.newData.category}
                              {entry.newData.subCategory && ` • ${entry.newData.subCategory}`}
                            </p>
                          </div>
                          <time className="text-sm text-neutral-500 whitespace-nowrap">
                            {formatTimestamp(entry.timestamp)}
                          </time>
                        </div>

                        {/* Value Changes */}
                        {valueChange && (
                          <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                            {valueChange.type === 'new' && (
                              <div className="flex items-center gap-2 text-green-700">
                                <ArrowUpRight className="w-4 h-4" />
                                <span className="font-medium">
                                  Added {formatCurrency(valueChange.amount, valueChange.currency)}
                                </span>
                              </div>
                            )}
                            
                            {valueChange.type === 'removed' && (
                              <div className="flex items-center gap-2 text-red-700">
                                <ArrowDownRight className="w-4 h-4" />
                                <span className="font-medium">
                                  Removed {formatCurrency(valueChange.amount, valueChange.currency)}
                                </span>
                              </div>
                            )}

                            {valueChange.type === 'increase' && (
                              <div className="flex items-center gap-2 text-green-700">
                                <ArrowUpRight className="w-4 h-4" />
                                <span className="font-medium">
                                  Increased by {formatCurrency(valueChange.amount, valueChange.currency)}
                                </span>
                                <span className="text-sm text-neutral-600">
                                  ({formatCurrency(valueChange.oldValue!, valueChange.currency)} → {formatCurrency(valueChange.newValue!, valueChange.currency)})
                                </span>
                              </div>
                            )}

                            {valueChange.type === 'decrease' && (
                              <div className="flex items-center gap-2 text-red-700">
                                <ArrowDownRight className="w-4 h-4" />
                                <span className="font-medium">
                                  Decreased by {formatCurrency(valueChange.amount, valueChange.currency)}
                                </span>
                                <span className="text-sm text-neutral-600">
                                  ({formatCurrency(valueChange.oldValue!, valueChange.currency)} → {formatCurrency(valueChange.newValue!, valueChange.currency)})
                                </span>
                              </div>
                            )}

                            {valueChange.type === 'unchanged' && (
                              <div className="flex items-center gap-2 text-neutral-700">
                                <span className="font-medium">
                                  Value unchanged: {formatCurrency(valueChange.newValue!, valueChange.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        {entry.newData.description && (
                          <p className="mt-2 text-sm text-neutral-600">
                            {entry.newData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredHistory.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {filteredHistory.filter(h => h.action === 'created').length}
                </div>
                <div className="text-sm text-green-700">Assets Created</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredHistory.filter(h => h.action === 'updated').length}
                </div>
                <div className="text-sm text-blue-700">Assets Updated</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {filteredHistory.filter(h => h.action === 'deleted').length}
                </div>
                <div className="text-sm text-red-700">Assets Deleted</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetHistory;