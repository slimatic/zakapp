import React from 'react';
import { TrendingUp, DollarSign, Calendar, Users, Calculator, Plus, ArrowRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, trend, className = '' }) => {
  return (
    <div className={`card animate-scale-in ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1.5 bg-primary-100 rounded-lg">
                {icon}
              </div>
              <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
              <p className="text-sm text-neutral-500">{subtitle}</p>
            </div>
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive 
                ? 'bg-success-50 text-success-700' 
                : 'bg-error-50 text-error-700'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  onClick: () => void;
  className?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, buttonText, onClick, className = '' }) => {
  return (
    <div className={`card hover:shadow-medium transition-all duration-300 cursor-pointer group ${className}`} onClick={onClick}>
      <div className="card-body">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
              {title}
            </h3>
            <p className="text-neutral-600 text-sm mb-3">{description}</p>
            <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700 transition-colors">
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type AppView = 'dashboard' | 'assets' | 'calculate' | 'history';

interface DashboardProps {
  onNavigate?: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();
  
  const handleCalculateZakat = () => {
    onNavigate?.('calculate');
  };

  const handleManageAssets = () => {
    onNavigate?.('assets');
  };

  const handleViewHistory = () => {
    onNavigate?.('history');
  };

  const handleAddAsset = () => {
    onNavigate?.('assets');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="gradient-bg rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            Assalamu Alaikum! 👋
          </h1>
          <p className="text-lg text-neutral-700 mb-4">
            Welcome to your personal Zakat calculator. Manage your Islamic financial obligations with ease and confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleCalculateZakat}
              className="btn-primary text-base px-6 py-3"
            >
              Calculate Zakat Now
            </button>
            <button 
              onClick={handleManageAssets}
              className="btn-secondary text-base px-6 py-3"
            >
              Manage Assets
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assets"
          value="$24,580"
          subtitle="Across all categories"
          icon={<DollarSign className="w-4 h-4 text-primary-600" />}
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <StatsCard
          title="Zakat Due"
          value="$615"
          subtitle={`For ${currentYear}`}
          icon={<Calculator className="w-4 h-4 text-primary-600" />}
        />
        <StatsCard
          title="Last Calculation"
          value="Oct 15"
          subtitle="3 days ago"
          icon={<Calendar className="w-4 h-4 text-primary-600" />}
        />
        <StatsCard
          title="Asset Categories"
          value="5"
          subtitle="Active categories"
          icon={<Users className="w-4 h-4 text-primary-600" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionCard
          title="Calculate Zakat"
          description="Get an accurate calculation of your Zakat obligation based on current assets"
          icon={<Calculator className="w-6 h-6" />}
          buttonText="Start Calculation"
          onClick={handleCalculateZakat}
        />
        <ActionCard
          title="Add New Asset"
          description="Add cash, gold, property, or other assets to your portfolio"
          icon={<Plus className="w-6 h-6" />}
          buttonText="Add Asset"
          onClick={handleAddAsset}
        />
        <ActionCard
          title="View History"
          description="Review your past Zakat calculations and payment records"
          icon={<Calendar className="w-6 h-6" />}
          buttonText="View History"
          onClick={handleViewHistory}
        />
      </div>

      {/* Asset Categories Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-neutral-900">Asset Categories</h2>
          <p className="text-sm text-neutral-600 mt-1">Overview of your Zakat-eligible assets</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Cash & Bank Accounts', amount: '$8,450', percentage: 34 },
              { name: 'Gold', amount: '$6,200', percentage: 25 },
              { name: 'Silver', amount: '$1,800', percentage: 7 },
              { name: 'Business Assets', amount: '$5,500', percentage: 22 },
              { name: 'Investment Property', amount: '$2,100', percentage: 9 },
              { name: 'Stocks & Securities', amount: '$530', percentage: 3 },
            ].map((category) => (
              <div key={category.name} className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-neutral-900 text-sm">{category.name}</h4>
                  <span className="text-xs text-neutral-500">{category.percentage}%</span>
                </div>
                <p className="text-lg font-semibold text-primary-600">{category.amount}</p>
                <div className="mt-2 bg-neutral-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};