import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, KeyRound, ArrowRight, UserCheck, AlertCircle, Globe } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('maker_pune');
  const [password, setPassword] = useState('Maker@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || (language === 'mr' ? 'लॉगिन अयशस्वी झाले. कृपया क्रेडेंशियल्स तपासा.' : 'Login failed. Please check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Right Floating Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center bg-slate-800/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            language === 'en'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('mr')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            language === 'mr'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          मराठी
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-900/30">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
          {t('institution.name')}
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <div className="mb-6 text-center border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">{t('login.title')}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('login.dualControlNotice')}</p>
          </div>

          {error && (
            <div className="mb-5 bg-rose-50 border-l-4 border-rose-500 p-3.5 rounded text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('login.username')}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="e.g. maker_pune"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('login.password')}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 mt-6"
            >
              {isSubmitting ? t('login.submitting') : t('login.submit')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Select Demo Roles */}
          <div className="mt-8 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              {t('login.quickDemo')}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('maker_pune', 'Maker@123')}
                className="p-2 border border-emerald-200 bg-emerald-50/60 rounded-lg text-left hover:bg-emerald-100/60 transition-colors text-emerald-900"
              >
                <div className="font-semibold text-emerald-800">{language === 'mr' ? 'मेकर / लिपिक' : 'Maker / Operator'}</div>
                <div className="text-[10px] text-emerald-600">{language === 'mr' ? 'नोंदणी व दस्तऐवज' : 'Enter Records & Docs'}</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('checker_pune', 'Checker@123')}
                className="p-2 border border-indigo-200 bg-indigo-50/60 rounded-lg text-left hover:bg-indigo-100/60 transition-colors text-indigo-900"
              >
                <div className="font-semibold text-indigo-800">{language === 'mr' ? 'चेकर / अधिकारी' : 'Checker / Authorizer'}</div>
                <div className="text-[10px] text-indigo-600">{language === 'mr' ? 'केवायसी व मंजुरी' : 'Approve KYC & Queues'}</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('bm_pune', 'Manager@123')}
                className="p-2 border border-amber-200 bg-amber-50/60 rounded-lg text-left hover:bg-amber-100/60 transition-colors text-amber-900"
              >
                <div className="font-semibold text-amber-800">{language === 'mr' ? 'शाखा व्यवस्थापक' : 'Branch Manager'}</div>
                <div className="text-[10px] text-amber-600">{language === 'mr' ? 'व्यवहार तारीख व देखरेख' : 'Business Date & Branch'}</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('superadmin', 'Admin@123')}
                className="p-2 border border-rose-200 bg-rose-50/60 rounded-lg text-left hover:bg-rose-100/60 transition-colors text-rose-900"
              >
                <div className="font-semibold text-rose-800">{language === 'mr' ? 'मुख्य प्रशासक' : 'Head Office Admin'}</div>
                <div className="text-[10px] text-rose-600">{language === 'mr' ? 'सर्व प्रणाली नियंत्रणे' : 'Full CBS Controls'}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
