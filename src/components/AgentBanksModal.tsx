import React, { useState } from 'react';
import { AgentBank } from '../types';
import { StorageManager } from '../utils/storage';
import { cleanPersian, toPersianDigits } from '../utils/persianUtils';
import { Building2, Plus, Edit2, Trash2, Check, X, Search, AlertCircle } from 'lucide-react';

interface AgentBanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const AgentBanksModal: React.FC<AgentBanksModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const [banks, setBanks] = useState<AgentBank[]>(StorageManager.getAgentBanks());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    const list = StorageManager.getAgentBanks();
    setBanks(list);
    if (onUpdated) onUpdated();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setMessage({ text: 'لطفاً نام بانک عامل را وارد کنید.', type: 'error' });
      return;
    }

    StorageManager.addAgentBank(newName, newCode.trim() || undefined);
    setNewName('');
    setNewCode('');
    setMessage({ text: 'بانک عامل با موفقیت افزوده شد.', type: 'success' });
    refreshList();
    setTimeout(() => setMessage(null), 3000);
  };

  const startEdit = (bank: AgentBank) => {
    setEditingId(bank.id);
    setEditName(bank.name);
    setEditCode(bank.code || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      setMessage({ text: 'نام بانک نمی‌تواند خالی باشد.', type: 'error' });
      return;
    }

    StorageManager.updateAgentBank(id, editName, editCode.trim() || undefined);
    setEditingId(null);
    setMessage({ text: 'تغییرات با موفقیت ذخیره شد.', type: 'success' });
    refreshList();
    setTimeout(() => setMessage(null), 3000);
  };

  const [deleteBankTarget, setDeleteBankTarget] = useState<AgentBank | null>(null);

  const confirmDelete = () => {
    if (!deleteBankTarget) return;
    StorageManager.deleteAgentBank(deleteBankTarget.id);
    setMessage({ text: `بانک «${deleteBankTarget.name}» با موفقیت حذف شد.`, type: 'success' });
    setDeleteBankTarget(null);
    refreshList();
    setTimeout(() => setMessage(null), 3000);
  };

  const filtered = banks.filter((b) => {
    const term = cleanPersian(searchTerm.toLowerCase());
    return (
      cleanPersian(b.name).toLowerCase().includes(term) ||
      (b.code && b.code.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">مدیریت بانک‌های عامل تسهیلات</h3>
              <p className="text-xs text-slate-500">
                مشاهده، افزودن، ویرایش و حذف بانک‌های عامل مجاز جهت صدور گواهی و استعلام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Add Bank Form */}
        <form onSubmit={handleAdd} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>افزودن بانک عامل جدید</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="نام کامل بانک (مثلاً: بانک توسعه تعاون)..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="کد بانک (اختیاری)..."
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-[11px] text-slate-400">
              * بانک‌های تایپ‌شده حین صدور گواهی نیز به طور خودکار به این لیست اضافه می‌شوند.
            </span>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت بانک</span>
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجوی نام یا کد بانک..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Banks Table / List */}
        <div className="mt-3 flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">بانک عاملی یافت نشد.</div>
          ) : (
            filtered.map((bank) => {
              const isEditing = editingId === bank.id;

              return (
                <div
                  key={bank.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition text-xs"
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-blue-400 text-xs bg-white text-slate-800"
                        placeholder="نام بانک"
                      />
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-blue-400 text-xs bg-white text-slate-800"
                        placeholder="کد بانک"
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-800">{bank.name}</span>
                      {bank.code && (
                        <span className="mr-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono">
                          کد: {toPersianDigits(bank.code)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(bank.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="ذخیره"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="انصراف"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(bank)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteBankTarget(bank)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            تعداد کل بانک‌ها: {toPersianDigits(banks.length)} مورد
          </span>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            بستن
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteBankTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 text-rose-600">
                <Trash2 className="w-4 h-4" />
                <span>تأیید حذف بانک عامل</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                آیا از حذف بانک عامل «{deleteBankTarget.name}» از لیست اطمینان دارید؟
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteBankTarget(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  حذف قطعی
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
