import React, { useEffect, useState } from 'react';
import { getDocs, getSplitSheetUrl } from '../services/api';
import { FileText, Clock, Printer } from 'lucide-react';

const DocList = ({ onSelect }) => {
    const [docs, setDocs] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getDocs();
                setDocs(data);
            } catch (err) {
                console.error(err);
            }
        };
        load();
        const interval = setInterval(load, 5000); // Poll every 5s for new scans
        return () => clearInterval(interval);
    }, []);

    const handlePrintSplitSheet = () => {
        window.open(getSplitSheetUrl(), '_blank');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">PaperPilot Inbox</h1>
                <button 
                    onClick={handlePrintSplitSheet}
                    className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 transition-colors"
                >
                    <Printer size={20} />
                    Get Split Sheet
                </button>
            </div>

            {docs.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <div className="flex justify-center mb-4">
                        <FileText size={64} strokeWidth={1} />
                    </div>
                    <p className="text-xl">No documents waiting.</p>
                    <p className="text-sm mt-2">Scan a PDF into the input folder to start.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {docs.map(doc => (
                        <div 
                            key={doc.id}
                            onClick={() => onSelect(doc.id)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${
                                    doc.status === 'ready' ? 'bg-blue-50 text-blue-600' : 
                                    doc.status === 'processing' ? 'bg-yellow-50 text-yellow-600' : 
                                    'bg-red-50 text-red-600'
                                }`}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                                        {doc.original_filename}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(doc.created_at * 1000).toLocaleString()}
                                        </span>
                                        <span className="capitalize px-2 py-0.5 rounded-full text-xs bg-gray-100">
                                            {doc.status}
                                        </span>
                                        {doc.pages.length > 0 && (
                                            <span>{doc.pages.length} Pages</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocList;
