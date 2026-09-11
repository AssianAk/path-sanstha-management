export type Language = 'en' | 'mr' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    mr: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Brand & Institution
  'brand.name': {
    en: 'SAMRUDDHI CBS',
    mr: 'समृद्धी सीबीएस',
    hi: 'समृद्धि सीबीएस'
  },
  'brand.tagline': {
    en: 'Pat Sanstha & Co-op Bank',
    mr: 'नागरी सहकारी पतसंस्था व बँक',
    hi: 'नागरी सहकारी पतसंस्था एवं बैंक'
  },
  'institution.name': {
    en: 'Samruddhi Co-operative Bank',
    mr: 'समृद्धी नागरी सहकारी बँक',
    hi: 'समृद्धि नागरी सहकारी बैंक'
  },
  'institution.headOffice': {
    en: 'Head Office',
    mr: 'मुख्य कार्यालय',
    hi: 'प्रधान कार्यालय'
  },

  // Navigation Items
  'nav.dashboard': {
    en: 'Dashboard',
    mr: 'डॅशबोर्ड',
    hi: 'डैशबोर्ड'
  },
  'nav.customers': {
    en: 'Customer & Member',
    mr: 'ग्राहक व सभासद',
    hi: 'ग्राहक एवं सदस्य'
  },
  'nav.kyc': {
    en: 'KYC & Approvals',
    mr: 'केवायसी व मंजुरी',
    hi: 'केवाईसी एवं अनुमोदन'
  },
  'nav.branches': {
    en: 'Branch & Business Date',
    mr: 'शाखा व कामकाज तारीख',
    hi: 'शाखा एवं कार्य दिवस'
  },
  'nav.audit': {
    en: 'Audit Trail',
    mr: 'ऑडिट नोंदवही',
    hi: 'ऑडिट लॉग'
  },
  'nav.settings': {
    en: 'System Settings',
    mr: 'प्रणाली सेटिंग्ज',
    hi: 'सिस्टम सेटिंग्स'
  },
  'nav.accounts': {
    en: 'Accounts & Deposits',
    mr: 'खाती व ठेवी',
    hi: 'खाते एवं जमा'
  },
  'nav.teller': {
    en: 'Teller & Cash Counter',
    mr: 'खजिनदार व रोख काऊंटर',
    hi: 'रोकड़ काउंटर (टेलर)'
  },
  'nav.transfers': {
    en: 'Fund Transfers',
    mr: 'निधी हस्तांतरण',
    hi: 'फंड ट्रांसफर'
  },
  'nav.loans': {
    en: 'Loans & Advances (LOS)',
    mr: 'कर्ज व अग्रिम (एलओएस)',
    hi: 'ऋण एवं अग्रिम (एलओएस)'
  },
  'nav.collections': {
    en: 'Collections & NPA Hub',
    mr: 'वसुली व एनपीए केंद्र',
    hi: 'वसूली एवं एनपीए केंद्र'
  },
  'nav.gl': {
    en: 'General Ledger & COA',
    mr: 'सामान्य खातावही व ताळेबंद',
    hi: 'सामान्य बहीखाता एवं तलपट'
  },
  'nav.reports': {
    en: 'Reports & Regulatory MIS',
    mr: 'नियामक अहवाल व एमआयएस',
    hi: 'नियामक रिपोर्ट एवं एमआईएस'
  },
  'nav.digital': {
    en: 'Digital Channels & Portal',
    mr: 'डिजिटल चॅनेल्स व पोर्टल',
    hi: 'डिजिटल चैनल एवं पोर्टल'
  },

  // Navigation Group Headers
  'nav.group.phase1': {
    en: 'Phase 1 - Foundation',
    mr: 'टप्पा १ - पायाभूत सुविधा',
    hi: 'चरण 1 - आधारशिला'
  },
  'nav.group.phase2': {
    en: 'Phase 2 - Accounts & CASA',
    mr: 'टप्पा २ - खाती व ठेवी',
    hi: 'चरण 2 - खाते एवं कासा'
  },
  'nav.group.phase3': {
    en: 'Phase 3 - Loans & Advances',
    mr: 'टप्पा ३ - कर्ज व अग्रिम',
    hi: 'चरण 3 - ऋण एवं अग्रिम'
  },
  'nav.group.phase4': {
    en: 'Phase 4 - Collections & NPA',
    mr: 'टप्पा ४ - वसुली व एनपीए',
    hi: 'चरण 4 - वसूली एवं एनपीए'
  },
  'nav.group.phase5': {
    en: 'Phase 5 - General Ledger',
    mr: 'टप्पा ५ - सामान्य खातावही',
    hi: 'चरण 5 - सामान्य बहीखाता'
  },
  'nav.group.phase6': {
    en: 'Phase 6 - Regulatory MIS',
    mr: 'टप्पा ६ - नियामक अहवाल',
    hi: 'चरण 6 - नियामक रिपोर्ट'
  },
  'nav.group.phase7': {
    en: 'Phase 7 - Digital Channels',
    mr: 'टप्पा ७ - डिजिटल चॅनेल्स',
    hi: 'चरण 7 - डिजिटल चैनल'
  },

  // Header
  'header.businessDate': {
    en: 'Business Date',
    mr: 'कामकाज तारीख',
    hi: 'कामकाज तिथि'
  },
  'header.status.open': {
    en: 'OPEN',
    mr: 'सुरू',
    hi: 'सक्रिय'
  },
  'header.status.cutoff': {
    en: 'CUTOFF',
    mr: 'कटऑफ',
    hi: 'कटऑफ'
  },
  'header.status.closed': {
    en: 'CLOSED',
    mr: 'बंद',
    hi: 'बंद'
  },
  'header.testAs': {
    en: 'Test As:',
    mr: 'भूमिका चाचणी:',
    hi: 'भूमिका परीक्षण:'
  },
  'header.logout': {
    en: 'Logout',
    mr: 'बाहेर पडा',
    hi: 'लॉगआउट'
  },

  // Login Page
  'login.title': {
    en: 'Institutional Sign In',
    mr: 'संस्थात्मक लॉगिन',
    hi: 'संस्थागत लॉगिन'
  },
  'login.subtitle': {
    en: 'Urban Co-operative Bank & Pat Sanstha CBS Platform',
    mr: 'नागरी सहकारी बँक व पतसंस्था कोअर बँकिंग प्रणाली',
    hi: 'नागरी सहकारी बैंक एवं पतसंस्था कोर बैंकिंग प्लेटफॉर्म'
  },
  'login.username': {
    en: 'Username',
    mr: 'वापरकर्ता नाव',
    hi: 'उपयोगकर्ता नाम'
  },
  'login.password': {
    en: 'Password',
    mr: 'पासवर्ड',
    hi: 'पासवर्ड'
  },
  'login.submit': {
    en: 'Sign In to Banking Terminal',
    mr: 'बँकिंग टर्मिनलवर लॉगिन करा',
    hi: 'बैंकिंग टर्मिनल में लॉगिन करें'
  },
  'login.submitting': {
    en: 'Authenticating Credentials...',
    mr: 'प्रमाणीकरण करत आहे...',
    hi: 'प्रमाणीकरण हो रहा है...'
  },
  'login.quickDemo': {
    en: 'Quick Demo Access Roles',
    mr: 'जलद चाचणी भूमिका',
    hi: 'त्वरित परीक्षण भूमिकाएं'
  },
  'login.dualControlNotice': {
    en: 'Dual-control Maker-Checker security protocol active.',
    mr: 'मेकर-चेकर दुहेरी नियंत्रण सुरक्षा प्रणाली सक्रिय आहे.',
    hi: 'मेकर-चेकर दोहरा नियंत्रण सुरक्षा प्रोटोकॉल सक्रिय है।'
  },

  // Dashboard Metrics & Headings
  'dashboard.title': {
    en: 'Branch Operations & Performance Overview',
    mr: 'शाखा कामकाज आणि कार्यप्रदर्शन आढावा',
    hi: 'शाखा परिचालन एवं कार्यप्रणाली समीक्षा'
  },
  'dashboard.totalDeposits': {
    en: 'Total Deposit Liability',
    mr: 'एकूण ठेवी दायित्व',
    hi: 'कुल जमा दायित्व'
  },
  'dashboard.totalAdvances': {
    en: 'Total Advances Outstanding',
    mr: 'एकूण वितरित कर्ज शिल्लक',
    hi: 'कुल वितरित ऋण शेष'
  },
  'dashboard.cdRatio': {
    en: 'Credit-Deposit Ratio',
    mr: 'कर्ज-ठेव गुणोत्तर (CD Ratio)',
    hi: 'ऋण-जमा अनुपात (CD Ratio)'
  },
  'dashboard.tillCash': {
    en: 'Teller Cash In Hand',
    mr: 'काऊंटर रोख शिल्लक',
    hi: 'काउंटर रोकड़ शेष'
  },
  'dashboard.totalMembers': {
    en: 'Active Members / Shareholders',
    mr: 'सक्रिय सभासद / भागधारक',
    hi: 'सक्रिय सदस्य / शेयरधारक'
  },
  'dashboard.totalCustomers': {
    en: 'Total Verified Customers',
    mr: 'एकूण पडताळणी झालेले ग्राहक',
    hi: 'कुल सत्यापित ग्राहक'
  },
  'dashboard.pendingApprovals': {
    en: 'Pending Maker-Checker Queue',
    mr: 'प्रलंबित मेकर-चेकर मंजुऱ्या',
    hi: 'लंबित मेकर-चेकर अनुमोदन'
  },
  'dashboard.quickActions': {
    en: 'Operational Shortcuts',
    mr: 'दैनिक कामकाज पर्याय',
    hi: 'त्वरित कार्य'
  },
  'dashboard.recentActivity': {
    en: 'Recent Institutional Audit Activity',
    mr: 'अलीकडील संस्थात्मक ऑडिट नोंदी',
    hi: 'हालिया ऑडिट गतिविधियां'
  },
  'dashboard.action.newCustomer': {
    en: 'Enroll Customer',
    mr: 'नवीन ग्राहक नोंदणी',
    hi: 'नया ग्राहक नामांकन'
  },
  'dashboard.action.openAccount': {
    en: 'Open Deposit Account',
    mr: 'नवीन ठेव खाते उघडा',
    hi: 'नया जमा खाता खोलें'
  },
  'dashboard.action.cashCounter': {
    en: 'Cash Counter (Till)',
    mr: 'रोख काऊंटर (खजिनदार)',
    hi: 'रोकड़ काउंटर (खजांची)'
  },
  'dashboard.action.applyLoan': {
    en: 'Loan Application',
    mr: 'नवीन कर्ज अर्ज',
    hi: 'ऋण आवेदन'
  },
  'dashboard.action.recoveryDesk': {
    en: 'NPA Recovery Desk',
    mr: 'थकबाकी व एनपीए वसुली',
    hi: 'एनपीए वसूली डेस्क'
  },
  'dashboard.action.digitalPortal': {
    en: 'Member Digital Self-Service',
    mr: 'सभासद डिजिटल सेवा',
    hi: 'सदस्य डिजिटल सेवा'
  },
  'dashboard.action.trialBalance': {
    en: 'Daily Trial Balance',
    mr: 'दैनिक कच्चा ताळेबंद',
    hi: 'दैनिक तलपट (ट्रायल बैलेंस)'
  },
  'dashboard.action.regulatoryMis': {
    en: 'Regulatory Returns (Form I/IX)',
    mr: 'नियामक अहवाल (फॉर्म १/९)',
    hi: 'नियामक रिटर्न (फॉर्म 1/9)'
  },

  // Common Financial Terms & Actions
  'common.search': {
    en: 'Search...',
    mr: 'शोधा...',
    hi: 'खोजें...'
  },
  'common.filter': {
    en: 'Filter',
    mr: 'फिल्टर',
    hi: 'फ़िल्टर'
  },
  'common.view': {
    en: 'View Details',
    mr: 'तपशील पहा',
    hi: 'विवरण देखें'
  },
  'common.actions': {
    en: 'Actions',
    mr: 'कृती',
    hi: 'क्रियाएं'
  },
  'common.status': {
    en: 'Status',
    mr: 'स्थिती',
    hi: 'स्थिति'
  },
  'common.balance': {
    en: 'Balance',
    mr: 'शिल्लक',
    hi: 'शेष'
  },
  'common.amount': {
    en: 'Amount',
    mr: 'रक्कम',
    hi: 'राशि'
  },
  'common.debit': {
    en: 'Debit',
    mr: 'नावे',
    hi: 'नामे (डेबिट)'
  },
  'common.credit': {
    en: 'Credit',
    mr: 'जमा',
    hi: 'जमा (क्रेडिट)'
  },
  'common.save': {
    en: 'Save',
    mr: 'जतन करा',
    hi: 'सहेजें'
  },
  'common.cancel': {
    en: 'Cancel',
    mr: 'रद्द करा',
    hi: 'रद्द करें'
  },
  'common.submit': {
    en: 'Submit',
    mr: 'सादर करा',
    hi: 'प्रस्तुत करें'
  },
  'common.approve': {
    en: 'Approve',
    mr: 'मंजूर करा',
    hi: 'स्वीकृत करें'
  },
  'common.reject': {
    en: 'Reject',
    mr: 'नाकारा',
    hi: 'अस्वीकृत करें'
  },
  'common.exportCsv': {
    en: 'Export CSV',
    mr: 'सीएसव्ही निर्यात करा',
    hi: 'सीएसवी निर्यात करें'
  },
  'common.print': {
    en: 'Print',
    mr: 'मुद्रित करा',
    hi: 'प्रिंट करें'
  },
  'common.close': {
    en: 'Close',
    mr: 'बंद करा',
    hi: 'बंद करें'
  },
  'common.loading': {
    en: 'Loading data...',
    mr: 'माहिती लोड होत आहे...',
    hi: 'डेटा लोड हो रहा है...'
  },
  'common.noRecords': {
    en: 'No records found.',
    mr: 'कोणतीही नोंद आढळली नाही.',
    hi: 'कोई रिकॉर्ड नहीं मिला।'
  },
  'common.allBranches': {
    en: 'All Branches',
    mr: 'सर्व शाखा',
    hi: 'सभी शाखाएं'
  },
  'common.language': {
    en: 'Language',
    mr: 'भाषा',
    hi: 'भाषा'
  },
  'common.lang.en': {
    en: 'English',
    mr: 'English',
    hi: 'English'
  },
  'common.lang.mr': {
    en: 'मराठी',
    mr: 'मराठी',
    hi: 'मराठी'
  },
  'common.lang.hi': {
    en: 'हिंदी',
    mr: 'हिंदी',
    hi: 'हिंदी'
  }
};
