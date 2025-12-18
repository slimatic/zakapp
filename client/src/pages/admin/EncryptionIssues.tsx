import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

export const EncryptionIssues: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [keyInput, setKeyInput] = useState('');

  async function loadIssues() {
    setLoading(true);
    try {
      const res = await apiService.get('/admin/encryption/issues');
      if (res.success) setIssues((res.data as any)?.issues || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIssues(); }, []);

  async function handleScan() {
    setLoading(true);
    try {
      const res = await apiService.post('/admin/encryption/scan');
      if (res.success) await loadIssues();
    } finally { setLoading(false); }
  }

  async function handleRetry(issueId: string) {
    if (!keyInput) return alert('Provide previous key to retry');
    const res = await apiService.post(`/admin/encryption/${issueId}/retry`, { key: keyInput });
    if (res.success) {
      toast.success('Retry succeeded');
      setKeyInput('');
      loadIssues();
    } else {
      toast.error('Retry failed: ' + (res.message || res.error));
    }
  }

  async function markUnrecoverable(issueId: string) {
    const note = prompt('Add a short note (reason for unrecoverable):') || undefined;
    const res = await apiService.post(`/admin/encryption/${issueId}/unrecoverable`, { note });
    if (res.success) {
      alert('Marked unrecoverable');
      loadIssues();
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Encryption Issues</h1>
        <div>
          <button className="btn" onClick={handleScan} disabled={loading}>Scan</button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      <div className="grid gap-3">
        {issues.length === 0 && !loading && <div>No issues found.</div>}
        {issues.map(i => (
          <div key={i.id} className="p-4 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-600">{i.targetType} • {i.targetId}</div>
                <div className="font-medium">Status: {i.status}</div>
                <div className="text-xs mt-2"><pre className="whitespace-pre-wrap">{i.sampleData}</pre></div>
                <div className="text-xs text-gray-500 mt-1">{i.note}</div>
              </div>
              <div className="space-y-2 text-right">
                <button className="btn btn-sm" onClick={() => { setSelected(i); }}>Actions</button>
                <button className="btn btn-sm" onClick={() => markUnrecoverable(i.id)}>Mark Unrecoverable</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="font-semibold">Actions for {selected.targetType} / {selected.targetId}</h2>
            <div className="mt-3">
              <label className="block text-sm">Previous key</label>
              <input type="text" className="input" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="base64 previous key" />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="btn" onClick={() => { setSelected(null); setKeyInput(''); }}>Close</button>
              <button className="btn btn-primary" onClick={() => handleRetry(selected.id)}>Retry with key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncryptionIssues;