import React, { useEffect, useState } from 'react';
import { getDoc, updatePage, exportDoc, updateDocMetadata, getEventSourceUrl } from '../services/api';
import PageCard from './PageCard';
import { Save, ArrowLeft, Loader2, Edit2 } from 'lucide-react';

const GridEditor = ({ docId, onBack }) => {
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filename, setFilename] = useState("");

    const fetchDoc = async () => {
        try {
            const data = await getDoc(docId);
            setDoc(data);
            setFilename(data.user_filename || data.original_filename.replace(/\.[^/.]+$/, ""));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoc();
        
        // Connect to SSE for real-time updates
        const evtSource = new EventSource(getEventSourceUrl());
        
        evtSource.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'doc_update' && msg.data.id === docId && !exporting) {
                     setDoc(prev => {
                        // Merge or replace. 
                        // Note: msg.data is the full DocumentState
                        return msg.data;
                     });
                }
            } catch (e) {
                console.error("SSE Parse Error", e);
            }
        };

        evtSource.onerror = (err) => {
            console.error("SSE Error", err);
            // EventSource automatically retries
        };

        return () => {
            evtSource.close();
        };
    }, [docId, exporting]);

    const handleUpdatePage = async (pageNum, status, rotation) => {
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
            fetchDoc(); 
        }
    };

    const handleRename = async () => {
        try {
            await updateDocMetadata(docId, filename);
        } catch (err) {
            console.error("Failed to rename", err);
        }
    };

    const handleExport = async () => {
        if (!confirm("Confirm export? This will process the file and remove it from the list.")) return;
        setExporting(true);
        try {
            // Ensure filename is saved before export
            await updateDocMetadata(docId, filename);
            await exportDoc(docId);
            onBack(); 
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
            <div className="bg-white border-b p-2 md:p-4 shadow-sm sticky top-0 z-10 flex flex-col md:flex-row gap-3 md:gap-4 md:items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4 flex-1 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full shrink-0">
                        <ArrowLeft />
                    </button>
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 border-b border-transparent hover:border-gray-300 transition-colors focus-within:border-blue-500">
                            <input 
                                type="text" 
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                onBlur={handleRename}
                                className="text-lg md:text-xl font-bold text-gray-800 outline-none bg-transparent w-full py-1"
                                placeholder="Document Name"
                            />
                            <Edit2 size={16} className="text-gray-400 shrink-0" />
                        </div>
                        <span className="text-xs md:text-sm text-gray-500 mt-0.5">{doc.pages.length} Pages</span>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button 
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 md:flex-none justify-center items-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base font-medium shadow-sm active:scale-95 transition-all"
                    >
                        {exporting ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-2 md:p-4 bg-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
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
