import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "ar", label: "Arabic",  native: "العربية", flag: "🇸🇦", dir: "rtl" },
];

const LanguagePicker = ({ onDone }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("en");

  const handleContinue = () => {
    changeLanguage(selected);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🎓</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          {t("langPicker.title")}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {t("langPicker.subtitle")}
        </p>

        <div className="flex flex-col gap-3 mb-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                selected === lang.code
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div>
                <div className="font-bold text-gray-900 text-base">{lang.native}</div>
                <div className="text-gray-400 text-xs">{lang.label}</div>
              </div>
              {selected === lang.code && (
                <span className="ml-auto text-blue-500 text-lg">✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition shadow"
        >
          {t("langPicker.continue")}
        </button>
      </div>
    </div>
  );
};

export default LanguagePicker;
