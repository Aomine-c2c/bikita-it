/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { employeesApi, type Employee } from "@/lib/api";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee | null;
}

export function EmployeeFormModal({ isOpen, onClose, onSuccess, employeeToEdit }: EmployeeFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    office: "",
    role: "USER",
  });

  useEffect(() => {
    if (employeeToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: employeeToEdit.name || "",
        email: employeeToEdit.email || "",
        department: employeeToEdit.department || "",
        position: employeeToEdit.position || "",
        office: employeeToEdit.office || "",
        role: employeeToEdit.role || "USER",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        department: "",
        position: "",
        office: "",
        role: "USER",
      });
    }
  }, [employeeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (employeeToEdit) {
        await employeesApi.update(employeeToEdit.id, formData);
      } else {
        await employeesApi.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err.message || `Failed to ${employeeToEdit ? 'update' : 'create'} employee`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">{employeeToEdit ? "Edit Employee" : "Add Employee"}</h2>
                <p className="text-sm text-muted-foreground mt-1">{employeeToEdit ? "Update employee details." : "Add a new employee to the system."}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Email *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emp-department" className="block text-sm font-semibold text-foreground mb-1.5">Department</label>
                    <input id="emp-department" list="departments-list" type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. Engineering" />
                    <datalist id="departments-list">
                      {taxonomies.departments?.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Position</label>
                    <input type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. Senior Developer" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Office/Location</label>
                    <input type="text" value={formData.office} onChange={e => setFormData({...formData, office: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. HQ - Floor 3" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="TECHNICIAN">Technician</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-3 border-t border-border/40 bg-white shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {employeeToEdit ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}