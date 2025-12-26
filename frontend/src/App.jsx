import React, { useState } from 'react';
import DocList from './components/DocList';
import GridEditor from './components/GridEditor';

function App() {
  const [selectedDocId, setSelectedDocId] = useState(null);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md z-20">
        <div className="container mx-auto flex items-center gap-3">
            <img src="/icon.png" className="w-8 h-8 rounded-md" alt="Logo" />
            <h1 className="text-xl font-bold tracking-tight">PaperPilot Web</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {selectedDocId ? (
            <GridEditor 
                docId={selectedDocId} 
                onBack={() => setSelectedDocId(null)} 
            />
        ) : (
            <DocList onSelect={setSelectedDocId} />
        )}
      </main>
    </div>
  );
}

export default App;