import { useState } from 'react';
import './styles/App.css';
import { TestSharedImport } from './components/TestSharedImport';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">zakapp</h1>
        <p className="text-gray-600 mb-4">
          Zakat Calculator - Your personal Islamic finance assistant
        </p>
        <div className="flex items-center space-x-4 mb-6">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setCount(count => count + 1)}
          >
            Count: {count}
          </button>
        </div>

        <TestSharedImport />

        <p className="text-sm text-gray-500 mt-4">
          ✅ Frontend is running successfully!
          <br />
          ✅ Shared package integration working!
          <br />✅ Mono-repo structure is functional!
        </p>
      </div>
    </div>
  );
}

export default App;
