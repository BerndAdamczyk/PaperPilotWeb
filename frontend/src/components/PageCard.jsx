import React from 'react';
import { RefreshCw, Trash2, Scissors, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const PageCard = ({ page, onUpdate }) => {
    // page: { page_number, image_path, status, rotation }
    
    const imageUrl = `http://localhost:8000/static/${page.image_path}`;
    
    const statusColors = {
        'valid': 'border-green-500 bg-green-50',
        'delete': 'border-red-500 bg-red-50',
        'split': 'border-purple-500 bg-purple-50'
    };

    const handleRotate = (e) => {
        e.stopPropagation();
        const newRotation = (page.rotation + 90) % 360;
        onUpdate(page.page_number, null, newRotation);
    };

    const toggleStatus = () => {
        let newStatus = 'valid';
        if (page.status === 'valid') newStatus = 'delete';
        else if (page.status === 'delete') newStatus = 'split'; // Cycle through? Or just Valid/Delete?
        // User requirement: "mark a page for deletion(empty page /red border) or for export(valid page /green boder)"
        // Original PaperPilot also has SPLIT (violet). Usually auto-detected.
        // Let's implement a cycle: Valid -> Delete -> Split -> Valid for manual correction.
        else if (page.status === 'split') newStatus = 'valid';
        
        onUpdate(page.page_number, newStatus, null);
    };

    return (
        <div 
            className={twMerge(
                "relative border-4 rounded-lg overflow-hidden cursor-pointer transition-all shadow-md hover:shadow-xl",
                statusColors[page.status]
            )}
            onClick={toggleStatus}
        >
            <div className="relative aspect-[210/297] w-full bg-gray-200">
                <img 
                    src={imageUrl} 
                    alt={`Page ${page.page_number}`}
                    className="w-full h-full object-contain transition-transform duration-300"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                />
            </div>
            
            {/* Overlay Controls */}
            <div className="absolute top-2 right-2 flex gap-2">
                <button 
                    onClick={handleRotate}
                    className="p-2 bg-white/80 rounded-full hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm"
                    title="Rotate 90°"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Status Indicator Icon */}
            <div className="absolute top-2 left-2">
                 {page.status === 'delete' && <Trash2 className="text-red-600 bg-white/80 rounded-full p-1" size={28} />}
                 {page.status === 'split' && <Scissors className="text-purple-600 bg-white/80 rounded-full p-1" size={28} />}
                 {page.status === 'valid' && <CheckCircle className="text-green-600 bg-white/80 rounded-full p-1" size={28} />}
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 text-center">
                Page {page.page_number + 1}
            </div>
        </div>
    );
};

export default PageCard;
