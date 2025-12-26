import React, { useEffect, useState } from 'react';
import { getDoc, updatePage, exportDoc } from '../services/api';
import PageCard from './PageCard';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

const GridEditor = ({ docId, onBack }) => {
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchDoc = async () => {
        try {
            const data = await getDoc(docId);
            setDoc(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoc();
        // Poll for updates if processing? 
        // For now just load once.
    }, [docId]);

    const handleUpdatePage = async (pageNum, status, rotation) => {
        // Optimistic update
        setDoc(prev => {
            const newPages = [...prev.pages];
            const p = { ...newPages[pageNum] };
            if (status) p.status = status;
            if (rotation !== null) p.rotation = rotation;
            newPages[pageNum] = p;
            return { ...prev, pages: newPages };
        });

        try {
            await updatePage(docId, pageNum, status, rotation);
        } catch (err) {
            console.error("Failed to update page", err);
            fetchDoc(); // Revert on error
        }
    };

    const handleExport = async () => {
        if (!confirm("Confirm export? This will process the file and remove it from the list.")) return;
        setExporting(true);
        try {
            await exportDoc(docId);
            onBack(); // Go back to list on success
        } catch (err) {
            alert("Export failed: " + err.message);
            setExporting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>;
    if (!doc) return <div>Document not found</div>;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold truncate max-w-md">{doc.original_filename}</h2>
                        <span className="text-sm text-gray-500">{doc.pages.length} Pages</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="animate-spin" /> : <Save />}
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {doc.pages.map((page) => (
                        <PageCard 
                            key={page.page_number} 
                            page={page} 
                            onUpdate={handleUpdatePage} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GridEditor;
