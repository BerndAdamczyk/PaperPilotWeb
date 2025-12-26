import React, { useEffect, useState } from 'react';
import { getDocs, getSplitSheetUrl, deleteDoc } from '../services/api';
import { FileText, Clock, Printer, Trash2 } from 'lucide-react';

const DocList = ({ onSelect }) => {
    const [docs, setDocs] = useState([]);

    const load = async () => {
        try {
            const data = await getDocs();
            setDocs(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 5000); // Poll every 5s for new scans
        return () => clearInterval(interval);
    }, []);

    const handlePrintSplitSheet = () => {
        window.open(getSplitSheetUrl(), '_blank');
    };

    const handleDelete = async (e, docId) => {
        e.stopPropagation(); // Prevent opening the doc
        if (!confirm("Are you sure you want to delete this document?")) return;
        
        try {
            await deleteDoc(docId);
            load(); // Reload list
        } catch (err) {
            console.error("Failed to delete doc", err);
            alert("Failed to delete document");
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">PaperPilot Inbox</h1>
                <button 
                    onClick={handlePrintSplitSheet}
                    className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 transition-colors w-full sm:w-auto justify-center"
                >
                    <Printer size={20} />
                    Get Split Sheet
                </button>
            </div>

            {docs.length === 0 ? (
                <div className="text-center py-12 md:py-20 text-gray-400">
                    <div className="flex justify-center mb-4">
                        <FileText size={48} className="md:w-16 md:h-16" strokeWidth={1} />
                    </div>
                    <p className="text-lg md:text-xl">No documents waiting.</p>
                    <p className="text-sm mt-2">Scan a PDF into the input folder to start.</p>
                </div>
            ) : (
                <div className="grid gap-3 md:gap-4">
                    {docs.map(doc => (
                        <div 
                            key={doc.id}
                            onClick={() => onSelect(doc.id)}
                            className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group"
                        >
                            <div className="flex items-start sm:items-center gap-3 md:gap-4 w-full">
                                <div className={`p-2 md:p-3 rounded-lg shrink-0 ${
                                    doc.status === 'ready' ? 'bg-blue-50 text-blue-600' : 
                                    doc.status === 'processing' ? 'bg-yellow-50 text-yellow-600' : 
                                    'bg-red-50 text-red-600'
                                }`}>
                                    <FileText size={20} className="md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-base md:text-lg text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                                        {doc.original_filename}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} className="md:w-3.5 md:h-3.5" />
                                            {new Date(doc.created_at * 1000).toLocaleString()}
                                        </span>
                                        <span className="capitalize px-1.5 py-0.5 rounded-full bg-gray-100">
                                            {doc.status}
                                        </span>
                                        {doc.pages.length > 0 && (
                                            <span>{doc.pages.length} Pages</span>
                                        )}
                                    </div>
                                </div>
                                
                                <button
                                    onClick={(e) => handleDelete(e, doc.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors self-start sm:self-center"
                                    title="Delete Document"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
};

export default DocList;
