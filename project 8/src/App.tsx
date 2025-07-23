import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { PipelinePage } from './components/PipelinePage';
import { SalesPage } from './components/SalesPage';
import { SaleDetailsPage } from './components/SaleDetailsPage';
import { IssuancePage } from './components/IssuancePage';
import { CommissionsPage } from './components/CommissionsPage';
import { RecoveryPage } from './components/RecoveryPage';
import { ReportsPage } from './components/ReportsPage';
import { SalesReportPage } from './components/SalesReportPage';
import { AIPerformancePage } from './components/AIPerformancePage';
import { UsersPage } from './components/UsersPage';
import { CompliancePage } from './components/CompliancePage';
import { ConfigurationPage } from './components/ConfigurationPage';
import { ProfilePage } from './components/ProfilePage';
import { WelcomeKitPage } from './components/WelcomeKitPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showAIPerformance, setShowAIPerformance] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWelcomeKit, setShowWelcomeKit] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleViewSale = (saleId: string) => {
    setSelectedSaleId(saleId);
  };

  const handleBackToSales = () => {
    setSelectedSaleId(null);
  };

  const handleViewSalesReport = () => {
    setShowSalesReport(true);
  };

  const handleViewAIPerformance = () => {
    setShowAIPerformance(true);
  };

  const handleViewCompliance = () => {
    setShowCompliance(true);
  };

  const handleBackToReports = () => {
    setShowSalesReport(false);
    setShowAIPerformance(false);
    setShowCompliance(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowProfile(false);
    if (tab !== 'sales') {
      setSelectedSaleId(null);
    }
    if (tab !== 'reports') {
      setShowSalesReport(false);
      setShowAIPerformance(false);
      setShowCompliance(false);
    }
    // Reset para pipeline quando clicar no logo
    if (tab === 'pipeline') {
      setSelectedSaleId(null);
      setShowSalesReport(false);
      setShowAIPerformance(false);
      setShowCompliance(false);
    }
  };

  const handleBackFromConfig = () => {
    setActiveTab('pipeline');
  };

  const handleOpenConfig = () => {
    setActiveTab('config');
    setShowProfile(false);
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  const handleBackFromProfile = () => {
    setShowProfile(false);
  };

  const handleOpenWelcomeKit = () => {
    setShowWelcomeKit(true);
    setActiveTab('issuance'); // Manter contexto da emissão
  };

  const handleBackFromWelcomeKit = () => {
    setShowWelcomeKit(false);
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (showProfile) {
      return <ProfilePage onBack={handleBackFromProfile} />;
    }

    if (showWelcomeKit) {
      return <WelcomeKitPage onBack={handleBackFromWelcomeKit} />;
    }

    if (showSalesReport) {
      return <SalesReportPage onBack={handleBackToReports} />;
    }

    if (showAIPerformance) {
      return <AIPerformancePage onBack={handleBackToReports} />;
    }

    if (showCompliance) {
      return <CompliancePage />;
    }

    if (selectedSaleId) {
      return <SaleDetailsPage onBack={handleBackToSales} />;
    }

    switch (activeTab) {
      case 'sales':
        return <SalesPage onViewSale={handleViewSale} />;
      case 'issuance':
        return <IssuancePage onOpenWelcomeKit={handleOpenWelcomeKit} />;
      case 'commissions':
        return <CommissionsPage />;
      case 'recovery':
        return <RecoveryPage />;
      case 'reports':
        return <ReportsPage onViewSalesReport={handleViewSalesReport} onViewAIPerformance={handleViewAIPerformance} onViewCompliance={handleViewCompliance} />;
      case 'users':
        return <UsersPage />;
      case 'config':
        return <ConfigurationPage onBack={handleBackFromConfig} />;
      case 'pipeline':
      default:
        return <PipelinePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!showSalesReport && !showAIPerformance && !showCompliance && !selectedSaleId && activeTab !== 'config' && !showProfile && (
        <Header 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          onOpenConfig={handleOpenConfig}
          onOpenProfile={handleOpenProfile}
        />
      )}
      {renderContent()}
    </div>
  );
}

export default App;