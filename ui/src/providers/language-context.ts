import { createContext, useContext } from "react";

export type SupportedLanguage = "en-IN" | "hi-IN";

export type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
};

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  "en-IN": {
    "app.title": "SSD-SDG Portal",
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.framework": "Framework setup",
    "nav.indicators": "Indicator management",
    "nav.masters": "Masters",
    "nav.dimensions": "Dimensions",
    "nav.templates": "Templates",
    "nav.requests": "Requests",
    "nav.dataEntry": "Data entry",
    "nav.ingestion": "Ingestion",
    "nav.validation": "Validation",
    "nav.validationRules": "Validation rules",
    "nav.review": "Review",
    "nav.invitationAccess": "Invitation access",
    "nav.applicationSetup": "Application setup",
    "nav.logsMonitor": "Logs & monitor",
    "nav.objectCoverage": "Object coverage",
    "nav.accessibility": "Accessibility",
    "top.dashboardSuper": "Dashboard: Super Admin",
    "top.dashboardUnit": "Dashboard: Unit Admin",
    "top.dashboardSnapshot": "Dashboard: Submitted Snapshot",
    "top.unit": "Unit",
    "top.language": "Language",
    "top.reminders": "Reminders",
    "top.notifications": "Notifications",
    "top.viewAll": "View all",
    "top.tour": "Tour",
    "top.profile": "Profile",
    "top.preferences": "Preferences",
    "top.logout": "Logout",
    "common.search": "Search",
    "common.open": "Open",
    "common.close": "Close",
    "common.save": "Save",
    "common.submit": "Submit",
    "common.visualOnly": "Visual state only",
    "nav.groupOverview": "Overview",
    "nav.groupSetup": "Setup & masters",
    "nav.groupCollection": "Collection workflow",
    "nav.groupAdministration": "Administration",
    "nav.groupGovernance": "Governance",
  },
  "hi-IN": {
    "app.title": "एसएसडी-एसडीजी पोर्टल",
    "nav.home": "होम",
    "nav.dashboard": "डैशबोर्ड",
    "nav.framework": "फ्रेमवर्क सेटअप",
    "nav.indicators": "इंडिकेटर प्रबंधन",
    "nav.masters": "मास्टर्स",
    "nav.dimensions": "डाइमेंशन",
    "nav.templates": "टेम्पलेट",
    "nav.requests": "अनुरोध",
    "nav.dataEntry": "डेटा एंट्री",
    "nav.ingestion": "इंजेशन",
    "nav.validation": "वैलिडेशन",
    "nav.validationRules": "वैलिडेशन नियम",
    "nav.review": "रिव्यू",
    "nav.invitationAccess": "इनविटेशन एक्सेस",
    "nav.applicationSetup": "एप्लिकेशन सेटअप",
    "nav.logsMonitor": "लॉग और मॉनिटर",
    "nav.objectCoverage": "ऑब्जेक्ट कवरेज",
    "nav.accessibility": "एक्सेसिबिलिटी",
    "top.dashboardSuper": "डैशबोर्ड: सुपर एडमिन",
    "top.dashboardUnit": "डैशबोर्ड: यूनिट एडमिन",
    "top.dashboardSnapshot": "डैशबोर्ड: सबमिटेड स्नैपशॉट",
    "top.unit": "यूनिट",
    "top.language": "भाषा",
    "top.reminders": "रिमाइंडर",
    "top.notifications": "नोटिफिकेशन",
    "top.viewAll": "सभी देखें",
    "top.tour": "टूर",
    "top.profile": "प्रोफाइल",
    "top.preferences": "प्राथमिकताएं",
    "top.logout": "लॉगआउट",
    "common.search": "खोजें",
    "common.open": "खोलें",
    "common.close": "बंद करें",
    "common.save": "सेव करें",
    "common.submit": "सबमिट करें",
    "common.visualOnly": "केवल दृश्य स्थिति",
    "nav.groupOverview": "अवलोकन",
    "nav.groupSetup": "सेटअप और मास्टर्स",
    "nav.groupCollection": "कलेक्शन वर्कफ्लो",
    "nav.groupAdministration": "प्रशासन",
    "nav.groupGovernance": "गवर्नेंस",
  },
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
