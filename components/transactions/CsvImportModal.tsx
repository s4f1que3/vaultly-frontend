'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { CsvImportPreview, CsvImportRow, TransactionCategory } from '@/types';
import { CATEGORY_LABELS, formatCurrency } from '@/lib/utils/formatters';
import api from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CsvImportModal({ isOpen, onClose }: Props) {
  const { fetchTransactions } = useTransactionStore();
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [editedRows, setEditedRows] = useState<CsvImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file'); return; }
    setIsLoading(true); setError('');
    try {
      const csv = await file.text();
      const data = await api.post<CsvImportPreview>('/transactions/import/preview', { csv });
      setPreview(data);
      setEditedRows(data.rows.filter((r) => r._valid));
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse CSV');
    } finally { setIsLoading(false); }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onConfirm = async () => {
    setIsLoading(true);
    try {
      const res = await api.post<{ imported: number; total: number }>('/transactions/import/confirm', {
        rows: editedRows.filter((r) => r._valid),
      });
      setResult(res);
      setStep('done');
      await fetchTransactions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally { setIsLoading(false); }
  };

  const reset = () => {
    setStep('upload'); setPreview(null); setEditedRows([]); setResult(null); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const updateRow = (i: number, field: keyof CsvImportRow, value: string | number) => {
    setEditedRows((prev) => prev.map((r, j) => j === i ? { ...r, [field]: value } : r));
  };

  const removeRow = (i: number) => setEditedRows((prev) => prev.filter((_, j) => j !== i));

  const allCategories = Object.keys(CATEGORY_LABELS) as TransactionCategory[];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Transactions">
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Upload a CSV export from your bank. We support most formats — date, description, amount columns are detected automatically.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'}`}
          >
            <Upload size={32} className="mx-auto mb-3 text-[var(--color-text-secondary)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Drop your CSV here</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">or click to browse</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>

          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Supported column names:</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              <span className="font-mono">date, amount, description, merchant, type, category</span>
              <br />Also works with: <span className="font-mono">memo, payee, debit, credit, transaction_date</span>
            </p>
          </div>

          {isLoading && <p className="text-sm text-center text-[var(--color-text-secondary)]">Parsing…</p>}
          {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertTriangle size={14} />{error}</p>}
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={14} />{preview.validRows} valid</div>
            {preview.invalidRows > 0 && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertTriangle size={14} />{preview.invalidRows} skipped</div>}
            <div className="ml-auto flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><FileText size={13} />{preview.totalRows} total rows</div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--color-bg-secondary)] sticky top-0">
                <tr>
                  {['Date', 'Description', 'Amount', 'Type', 'Category', ''].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editedRows.map((row, i) => (
                  <tr key={i} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2 max-w-28 truncate">{row.description}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-2">
                      <select value={row.type} onChange={(e) => updateRow(i, 'type', e.target.value)}
                        className="bg-transparent text-xs border border-[var(--color-border)] rounded px-1 py-0.5">
                        <option value="expense">expense</option>
                        <option value="income">income</option>
                        <option value="transfer">transfer</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={row.category} onChange={(e) => updateRow(i, 'category', e.target.value)}
                        className="bg-transparent text-xs border border-[var(--color-border)] rounded px-1 py-0.5">
                        {allCategories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeRow(i)} className="text-[var(--color-text-secondary)] hover:text-red-400"><X size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 border border-[var(--color-border)] text-sm rounded-lg py-2 hover:bg-[var(--color-bg-secondary)]">Back</button>
            <button onClick={onConfirm} disabled={isLoading || editedRows.length === 0}
              className="flex-1 bg-[var(--color-accent)] text-white text-sm rounded-lg py-2 font-medium hover:opacity-90 disabled:opacity-50">
              {isLoading ? 'Importing…' : `Import ${editedRows.length} transactions`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-8 space-y-4">
          <CheckCircle size={48} className="mx-auto text-green-400" />
          <p className="text-xl font-semibold text-[var(--color-text-primary)]">{result.imported} transactions imported</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Your transaction history has been updated.</p>
          <button onClick={handleClose} className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90">Done</button>
        </div>
      )}
    </Modal>
  );
}
