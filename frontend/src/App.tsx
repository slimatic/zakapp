import { useState } from 'react';
import './styles/App.css';
import { Header, Dashboard } from './components/ui';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement actual dark mode functionality
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Dashboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3">zakapp</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Your trusted companion for Islamic financial obligations. 
                Calculate and manage your Zakat with confidence and ease.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-900 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#help" className="hover:text-primary-600 transition-colors">Help & Guide</a></li>
                <li><a href="#about" className="hover:text-primary-600 transition-colors">About Zakat</a></li>
                <li><a href="#privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#security" className="hover:text-primary-600 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-neutral-900 mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>📊 Comprehensive Asset Tracking</li>
                <li>🔒 Privacy-First Architecture</li>
                <li>📱 Mobile-Responsive Design</li>
                <li>🌙 Multiple Calculation Methods</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 pt-6 mt-8 text-center">
            <p className="text-sm text-neutral-500">
              © 2024 zakapp. Built with care for the Muslim community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
