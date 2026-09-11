export type Language = 'en' | 'mr';

export interface Translations {
  [key: string]: {
    en: string;
    mr: string;
  };
}

export const translations: Translations = {
  // Brand & Institution
  'brand.name': {
    en: 'SAMRUDDHI CBS',
    mr: 'समृद्धी सीबीएस'
  },
  'brand.tagline': {
    en: 'Pat Sanstha & Co-op Bank',
    mr: 'नागरी सहकारी पतसंस्था व बँक'
  },
  'institution.name': {
    en: 'Samruddhi Co-operative Bank',
    mr: 'समृद्धी नागरी सहकारी बँक'
  },
  'institution.headOffice': {
    en: 'Head Office',
    mr: 'मुख्य कार्यालय'
  },

  // Navigation Items
  'nav.dashboard': {
    en: 'Dashboard',
    mr: 'डॅशबोर्ड'
  },
  'nav.customers': {
    en: 'Customer & Member',
    mr: 'ग्राहक व सभासद'
  },
  'nav.kyc': {
    en: 'KYC & Approvals',
    mr: 'केवायसी व मंजुरी'
  },
  'nav.branches': {
    en: 'Branch & Business Date',
    mr: 'शाखा व कामकाज तारीख'
  },
  'nav.audit': {
    en: 'Audit Trail',
    mr: 'ऑडिट नोंदवही'
  },
  'nav.settings': {
    en: 'System Settings',
    mr: 'प्रणाली सेटिंग्ज'
  },
  'nav.accounts': {
    en: 'Accounts & Deposits',
    mr: 'खाती व ठेवी'
  },
  'nav.teller': {
    en: 'Teller & Cash Counter',
    mr: 'खजिनदार व रोख काऊंटर'
  },
  'nav.transfers': {
    en: 'Fund Transfers',
    mr: 'निधी हस्तांतरण'
  },
  'nav.loans': {
    en: 'Loans & Advances (LOS)',
    mr: 'कर्ज व अग्रिम (एलओएस)'
  },
  'nav.collections': {
    en: 'Collections & NPA Hub',
    mr: 'वसुली व एनपीए केंद्र'
  },
  'nav.gl': {
    en: 'General Ledger & COA',
    mr: 'सामान्य खातावही व ताळेबंद'
  },
  'nav.reports': {
    en: 'Reports & Regulatory MIS',
    mr: 'नियामक अहवाल व एमआयएस'
  },
  'nav.digital': {
    en: 'Digital Channels & Portal',
    mr: 'डिजिटल चॅनेल्स व पोर्टल'
  },

  // Navigation Group Headers
  'nav.group.phase1': {
    en: 'Phase 1 - Foundation',
    mr: 'टप्पा १ - पायाभूत सुविधा'
  },
  'nav.group.phase2': {
    en: 'Phase 2 - Accounts & CASA',
    mr: 'टप्पा २ - खाती व ठेवी'
  },
  'nav.group.phase3': {
    en: 'Phase 3 - Loans & Advances',
    mr: 'टप्पा ३ - कर्ज व अग्रिम'
  },
  'nav.group.phase4': {
    en: 'Phase 4 - Collections & NPA',
    mr: 'टप्पा ४ - वसुली व एनपीए'
  },
  'nav.group.phase5': {
    en: 'Phase 5 - General Ledger',
    mr: 'टप्पा ५ - सामान्य खातावही'
  },
  'nav.group.phase6': {
    en: 'Phase 6 - Regulatory MIS',
    mr: 'टप्पा ६ - नियामक अहवाल'
  },
  'nav.group.phase7': {
    en: 'Phase 7 - Digital Channels',
    mr: 'टप्पा ७ - डिजिटल चॅनेल्स'
  },

  // Header
  'header.businessDate': {
    en: 'Business Date',
    mr: 'कामकाज तारीख'
  },
  'header.status.open': {
    en: 'OPEN',
    mr: 'सुरू'
  },
  'header.status.cutoff': {
    en: 'CUTOFF',
    mr: 'कटऑफ'
  },
  'header.status.closed': {
    en: 'CLOSED',
    mr: 'बंद'
  },
  'header.testAs': {
    en: 'Test As:',
    mr: 'भूमिका चाचणी:'
  },
  'header.logout': {
    en: 'Logout',
    mr: 'बाहेर पडा'
  },

  // Login Page
  'login.title': {
    en: 'Institutional Sign In',
    mr: 'संस्थात्मक लॉगिन'
  },
  'login.subtitle': {
    en: 'Urban Co-operative Bank & Pat Sanstha CBS Platform',
    mr: 'नागरी सहकारी बँक व पतसंस्था कोअर बँकिंग प्रणाली'
  },
  'login.username': {
    en: 'Username',
    mr: 'वापरकर्ता नाव'
  },
  'login.password': {
    en: 'Password',
    mr: 'पासवर्ड'
  },
  'login.submit': {
    en: 'Sign In to Banking Terminal',
    mr: 'बँकिंग टर्मिनलवर लॉगिन करा'
  },
  'login.submitting': {
    en: 'Authenticating Credentials...',
    mr: 'प्रमाणीकरण करत आहे...'
  },
  'login.quickDemo': {
    en: 'Quick Demo Access Roles',
    mr: 'जलद चाचणी भूमिका'
  },
  'login.dualControlNotice': {
    en: 'Dual-control Maker-Checker security protocol active.',
    mr: 'मेकर-चेकर दुहेरी नियंत्रण सुरक्षा प्रणाली सक्रिय आहे.'
  },

  // Dashboard Metrics & Headings
  'dashboard.title': {
    en: 'Branch Operations & Performance Overview',
    mr: 'शाखा कामकाज आणि कार्यप्रदर्शन आढावा'
  },
  'dashboard.totalDeposits': {
    en: 'Total Deposit Liability',
    mr: 'एकूण ठेवी दायित्व'
  },
  'dashboard.totalAdvances': {
    en: 'Total Advances Outstanding',
    mr: 'एकूण वितरित कर्ज शिल्लक'
  },
  'dashboard.cdRatio': {
    en: 'Credit-Deposit Ratio',
    mr: 'कर्ज-ठेव गुणोत्तर (CD Ratio)'
  },
  'dashboard.tillCash': {
    en: 'Teller Cash In Hand',
    mr: 'काऊंटर रोख शिल्लक'
  },
  'dashboard.totalMembers': {
    en: 'Active Members / Shareholders',
    mr: 'सक्रिय सभासद / भागधारक'
  },
  'dashboard.totalCustomers': {
    en: 'Total Verified Customers',
    mr: 'एकूण पडताळणी झालेले ग्राहक'
  },
  'dashboard.pendingApprovals': {
    en: 'Pending Maker-Checker Queue',
    mr: 'प्रलंबित मेकर-चेकर मंजुऱ्या'
  },
  'dashboard.quickActions': {
    en: 'Operational Shortcuts',
    mr: 'दैनिक कामकाज पर्याय'
  },
  'dashboard.recentActivity': {
    en: 'Recent Institutional Audit Activity',
    mr: 'अलीकडील संस्थात्मक ऑडिट नोंदी'
  },
  'dashboard.action.newCustomer': {
    en: 'Enroll Customer',
    mr: 'नवीन ग्राहक नोंदणी'
  },
  'dashboard.action.openAccount': {
    en: 'Open Deposit Account',
    mr: 'नवीन ठेव खाते उघडा'
  },
  'dashboard.action.cashCounter': {
    en: 'Cash Counter (Till)',
    mr: 'रोख काऊंटर (खजिनदार)'
  },
  'dashboard.action.applyLoan': {
    en: 'Loan Application',
    mr: 'नवीन कर्ज अर्ज'
  },
  'dashboard.action.recoveryDesk': {
    en: 'NPA Recovery Desk',
    mr: 'थकबाकी व एनपीए वसुली'
  },
  'dashboard.action.digitalPortal': {
    en: 'Member Digital Self-Service',
    mr: 'सभासद डिजिटल सेवा'
  },
  'dashboard.action.trialBalance': {
    en: 'Daily Trial Balance',
    mr: 'दैनिक कच्चा ताळेबंद'
  },
  'dashboard.action.regulatoryMis': {
    en: 'Regulatory Returns (Form I/IX)',
    mr: 'नियामक अहवाल (फॉर्म १/९)'
  },

  // Common Financial Terms & Actions
  'common.search': {
    en: 'Search...',
    mr: 'शोधा...'
  },
  'common.filter': {
    en: 'Filter',
    mr: 'फिल्टर'
  },
  'common.view': {
    en: 'View Details',
    mr: 'तपशील पहा'
  },
  'common.actions': {
    en: 'Actions',
    mr: 'कृती'
  },
  'common.status': {
    en: 'Status',
    mr: 'स्थिती'
  },
  'common.balance': {
    en: 'Balance',
    mr: 'शिल्लक'
  },
  'common.amount': {
    en: 'Amount',
    mr: 'रक्कम'
  },
  'common.debit': {
    en: 'Debit',
    mr: 'नावे'
  },
  'common.credit': {
    en: 'Credit',
    mr: 'जमा'
  },
  'common.save': {
    en: 'Save',
    mr: 'जतन करा'
  },
  'common.cancel': {
    en: 'Cancel',
    mr: 'रद्द करा'
  },
  'common.submit': {
    en: 'Submit',
    mr: 'सादर करा'
  },
  'common.approve': {
    en: 'Approve',
    mr: 'मंजूर करा'
  },
  'common.reject': {
    en: 'Reject',
    mr: 'नाकारा'
  },
  'common.exportCsv': {
    en: 'Export CSV',
    mr: 'सीएसव्ही निर्यात करा'
  },
  'common.print': {
    en: 'Print',
    mr: 'मुद्रित करा'
  },
  'common.close': {
    en: 'Close',
    mr: 'बंद करा'
  },
  'common.loading': {
    en: 'Loading data...',
    mr: 'माहिती लोड होत आहे...'
  },
  'common.noRecords': {
    en: 'No records found.',
    mr: 'कोणतीही नोंद आढळली नाही.'
  },
  'common.allBranches': {
    en: 'All Branches',
    mr: 'सर्व शाखा'
  },
  'common.language': {
    en: 'Language',
    mr: 'भाषा'
  },
  'common.lang.en': {
    en: 'English',
    mr: 'English'
  },
  'common.lang.mr': {
    en: 'मराठी',
    mr: 'मराठी'
  }
};
