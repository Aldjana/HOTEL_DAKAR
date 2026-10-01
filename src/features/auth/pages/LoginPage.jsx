import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getErrorMessage } from '../../../services/api/client';
import { settingsApi } from '../../../services/api/settingsApi';
import { homeFor } from '../../../utils/permissions';
import { User, Lock, Eye, EyeOff, ArrowRight, CalendarDays, BedDouble, BarChart3, Hotel, Globe, ShieldCheck, Check } from 'lucide-react';
import { useT } from '../../../i18n';
import { tokens } from '../../../services/storage/authTokens';

const LoginPage = () => {
  const { t, lang, setLang } = useT('login');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, loading: sessionLoading, sessionMessage } = useAuth();
  const [brand, setBrand] = useState({ name: 'Hôtel', logo_url: '' });
  const [showHelp, setShowHelp] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    settingsApi.publicInfo().then((b) => setBrand(b)).catch(() => {});
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      tokens.setRemember(remember);
      const u = await login(formData.email.trim(), formData.password);
      const target = location.state?.from && location.state.from !== '/login' ? location.state.from : homeFor(u.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('failed')));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionLoading && isAuthenticated) return <Navigate to={homeFor(user.role)} replace />;

  const features = [
    { Icon: CalendarDays, title: t('f1'), text: t('f1t') },
    { Icon: BedDouble, title: t('f2'), text: t('f2t') },
    { Icon: BarChart3, title: t('f3'), text: t('f3t') },
  ];
  const field = 'flex h-[clamp(46px,6.8vh,62px)] items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-[#1e4fbf] focus-within:ring-2 focus-within:ring-[#1e4fbf]/20';
  const iconCell = 'flex w-[54px] shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-[#0f2a5c]';

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Panneau gauche : photo + voile bleu nuit */}
      <div className="relative hidden w-1/2 lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-[position:45%_center]"
          style={{ backgroundImage: 'url("/login-hotel.jpg"), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1d45]/55 via-[#0b1d45]/65 to-[#0b1d45]/90" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between px-[8%] py-[clamp(24px,7vh,100px)] text-white xl:px-[130px]">
          <div className="flex items-center gap-4">
            <Hotel className="h-[clamp(40px,6vh,60px)] w-[clamp(40px,6vh,60px)]" strokeWidth={1.6} />
            <div>
              <h1 className="m-0 text-[clamp(20px,3vh,28px)] font-semibold leading-tight">{brand.name}</h1>
              <p className="m-0 text-[clamp(15px,2.2vh,20px)] font-medium leading-tight text-blue-400">PMS</p>
            </div>
          </div>

          <div>
            <h2 className="m-0 text-[clamp(28px,4.4vh,40px)] font-bold leading-tight">{t('welcome')}</h2>
            <p className="mt-[1.5vh] max-w-[420px] text-[clamp(15px,2.1vh,19px)] font-light leading-snug text-slate-100">
              {t('welcomeText')}
            </p>
          </div>

          <div className="flex flex-col gap-[clamp(10px,2.6vh,24px)]">
            {features.map(({ Icon, title, text }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-[clamp(40px,6.2vh,58px)] w-[clamp(40px,6.2vh,58px)] shrink-0 items-center justify-center rounded-xl bg-[#1b3a78]/90">
                  <Icon className="h-[clamp(20px,3vh,28px)] w-[clamp(20px,3vh,28px)]" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="m-0 text-[clamp(14px,1.9vh,17px)] font-medium">{title}</p>
                  <p className="m-0 mt-0.5 text-[clamp(12px,1.6vh,14px)] text-slate-300">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[14px] text-slate-200">© {new Date().getFullYear()} {brand.name}. {t('rights')}</div>
        </div>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-[#f8fafc] px-6 py-[clamp(12px,3vh,40px)] lg:w-1/2">
        <div className="mb-[1.5vh] flex w-full max-w-[518px] justify-end lg:absolute lg:right-[46px] lg:top-[42px] lg:mb-0 lg:max-w-none">
          <button type="button" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} aria-label={t('language')} title={lang === 'fr' ? 'English' : 'Français'} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[14px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Globe className="h-5 w-5" />
            {lang === 'fr' ? 'FR' : 'EN'}
          </button>
        </div>

        <div className="w-full max-w-[518px]">
          <div className="mb-[clamp(12px,4vh,56px)] flex items-center gap-4">
            {brand.logo_url ? <img src={brand.logo_url} alt="" className="h-[clamp(44px,8vh,72px)] w-[clamp(44px,8vh,72px)] rounded object-contain" /> : <Hotel className="h-[clamp(44px,8vh,72px)] w-[clamp(44px,8vh,72px)] text-[#0f2a5c]" strokeWidth={1.6} />}
            <div>
              <h1 className="m-0 text-[clamp(22px,3.8vh,32px)] font-bold leading-tight text-[#1b3a78]">{brand.name}</h1>
              <p className="m-0 text-[clamp(16px,2.8vh,24px)] font-medium leading-tight text-[#2563eb]">PMS</p>
            </div>
          </div>

          <div className="mb-[clamp(14px,4vh,36px)]">
            <h2 className="m-0 text-[clamp(24px,4.2vh,34px)] font-bold leading-tight text-[#0b1d45]">{t('title')}</h2>
            <p className="mt-1 text-[clamp(13px,2.1vh,18px)] text-slate-500">{t('subtitle')}</p>
          </div>

          {!error && sessionMessage && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{sessionMessage}</div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[clamp(10px,2.4vh,22px)]">
            <div className={field}>
              <span className={iconCell}><User className="h-5 w-5" fill="currentColor" /></span>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder={t('email')}
                className="min-w-0 flex-1 border-0 bg-transparent px-4 text-[17px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className={field}>
              <span className={iconCell}><Lock className="h-5 w-5" fill="currentColor" /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder={t('password')}
                className="min-w-0 flex-1 border-0 bg-transparent px-4 text-[17px] text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t('hide') : t('show')} className="border-0 bg-transparent px-4 text-[#0f2a5c]">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-[14px] text-slate-800 sm:gap-3 sm:text-[15px]">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border ${remember ? 'border-[#1e4fbf] bg-[#1e4fbf]' : 'border-slate-300 bg-white'}`}>
                  {remember && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </span>
                {t('remember')}
              </label>
              <button type="button" onClick={() => setShowHelp((v) => !v)} className="border-0 bg-transparent p-0 text-[14px] text-[#1e4fbf] underline sm:text-[15px]">{t('forgot')}</button>
            </div>
            {showHelp && <p className="m-0 text-left text-xs text-slate-500">{t('forgotHelp')}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex h-[clamp(48px,7vh,67px)] w-full items-center justify-center gap-3 rounded-xl border-0 bg-[#0f2d6b] text-[18px] font-semibold text-white shadow-md transition-colors hover:bg-[#0b2457] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t('loading') : t('submit')}
              {!loading && <ArrowRight className="h-6 w-6" />}
            </button>
          </form>

          <div className="my-[clamp(10px,2.4vh,24px)] flex items-center gap-4 text-[clamp(12px,1.8vh,15px)] text-slate-500">
            <span className="h-px flex-1 bg-slate-200" /> {t('or')} <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={() => setShowSecurity((v) => !v)} className="flex h-[clamp(44px,6.4vh,60px)] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-[16px] font-medium text-[#0b1d45] shadow-sm">
            <ShieldCheck className="h-6 w-6" /> {t('secure')}
          </button>
          {showSecurity && (
            <p className="mt-3 text-xs text-slate-500">{t('secureHelp')}</p>
          )}

          <div className="mt-[clamp(12px,4.5vh,72px)] flex items-center gap-3 text-[13px] text-slate-500">
            <ShieldCheck className="h-5 w-5 shrink-0" /> {t('restricted')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
