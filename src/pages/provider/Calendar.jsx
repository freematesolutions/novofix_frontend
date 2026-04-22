import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/state/apiClient';
import Alert from '@/components/ui/Alert.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { CalendarSkeleton } from '@/components/ui/SkeletonLoader.jsx';
import { useAuth } from '@/state/AuthContext.jsx';
import { on as socketOn } from '@/state/socketClient.js';
import {
  HiCalendar, HiChevronLeft, HiChevronRight, HiClock, HiPlus, HiTrash,
  HiCog, HiCheckCircle, HiExclamation, HiUser, HiBriefcase, HiSparkles, HiLocationMarker
} from 'react-icons/hi';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// YYYY-MM-DD en huso horario local (coincide con <input type="date">)
function toLocalISODate(d) {
  const year = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${m}-${day}`;
}

function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function Calendar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { viewRole, clearError, isAuthenticated, isRoleSwitching } = useAuth();

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(today));

  const [monthData, setMonthData] = useState({ days: [] });
  const [dayData, setDayData] = useState(null);
  const [schedule, setSchedule] = useState({ workingHours: {}, exceptions: [] });
  const [upcoming, setUpcoming] = useState([]);

  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);

  useEffect(() => { clearError?.(); }, [clearError]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const loadMonth = useCallback(async (year, month) => {
    setError('');
    try {
      const { data } = await api.get('/provider/services/availability/month', {
        params: { year, month: month + 1 }
      });
      setMonthData(data?.data || { days: [] });
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.calendar.errorLoading'));
    }
  }, [t]);

  const loadDay = useCallback(async (iso) => {
    setLoadingDay(true);
    try {
      const { data } = await api.get('/provider/services/availability/day', { params: { date: iso } });
      setDayData(data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || t('provider.calendar.errorLoading'));
    } finally { setLoadingDay(false); }
  }, [t]);

  const loadSchedule = useCallback(async () => {
    try {
      const { data } = await api.get('/provider/services/availability/schedule');
      setSchedule({
        workingHours: data?.data?.workingHours || {},
        exceptions: data?.data?.exceptions || []
      });
    } catch (err) {
      console.error('loadSchedule error:', err);
    }
  }, []);

  const loadUpcoming = useCallback(async () => {
    setLoadingUpcoming(true);
    try {
      const { data } = await api.get('/provider/services/upcoming-jobs', { params: { days: 7 } });
      setUpcoming(data?.data?.items || []);
    } catch (err) {
      console.error('loadUpcoming error:', err);
    } finally {
      setLoadingUpcoming(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || viewRole !== 'provider') return;
    loadMonth(cursor.getFullYear(), cursor.getMonth());
    loadSchedule();
  }, [cursor, isAuthenticated, viewRole, loadMonth, loadSchedule]);

  useEffect(() => {
    if (!isAuthenticated || viewRole !== 'provider') return;
    loadUpcoming();
  }, [isAuthenticated, viewRole, loadUpcoming]);

  useEffect(() => {
    if (!isAuthenticated || viewRole !== 'provider') return;
    loadDay(selectedDate);
  }, [selectedDate, isAuthenticated, viewRole, loadDay]);

  useEffect(() => {
    if (!successMsg) return;
    const id = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(id);
  }, [successMsg]);

  // Escuchar notificaciones de calendario por socket para refrescar en vivo
  useEffect(() => {
    if (!isAuthenticated || viewRole !== 'provider') return;
    const off = socketOn('notification', (payload) => {
      const type = payload?.type;
      if (type === 'NEW_BOOKING_SCHEDULED' || type === 'BOOKING_REMINDER' || type === 'BOOKING_STATUS_UPDATE') {
        loadMonth(cursor.getFullYear(), cursor.getMonth());
        loadDay(selectedDate);
        loadUpcoming();
      }
    });
    return () => { if (typeof off === 'function') off(); };
  }, [isAuthenticated, viewRole, cursor, selectedDate, loadMonth, loadDay, loadUpcoming]);

  // Grid semanas (lunes como primer día) — debe declararse antes de early returns
  const daysGrid = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    const byDate = new Map((monthData.days || []).map(d => [d.date, d]));
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toLocalISODate(new Date(cursor.getFullYear(), cursor.getMonth(), d));
      cells.push({ day: d, iso, info: byDate.get(iso) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor, monthData]);

  if (!isAuthenticated) return null;
  if (isRoleSwitching) return null;
  if (viewRole !== 'provider') {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <Alert type="warning">{t('provider.calendar.providerOnly')}</Alert>
      </div>
    );
  }

  const monthLabel = cursor.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const goPrevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(toLocalISODate(d));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-linear-to-br from-dark-700 via-dark-800 to-dark-900 p-6 sm:p-8 text-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/25 shrink-0">
              <HiCalendar className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t('provider.calendar.title')}</h1>
              <p className="text-sm sm:text-base text-brand-100">{t('provider.calendar.subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-medium transition-all border border-white/20"
            >
              <HiCog className="w-4 h-4" />
              {t('provider.calendar.manageSchedule')}
            </button>
            <button
              onClick={() => setExceptionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-medium transition-all shadow-lg shadow-brand-500/25"
            >
              <HiPlus className="w-4 h-4" />
              {t('provider.calendar.addException')}
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert type="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendario mensual */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrevMonth}
                aria-label={t('provider.calendar.prevMonth')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              ><HiChevronLeft className="w-5 h-5" /></button>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 capitalize min-w-[11ch] text-center">
                {monthLabel}
              </h3>
              <button
                onClick={goNextMonth}
                aria-label={t('provider.calendar.nextMonth')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              ><HiChevronRight className="w-5 h-5" /></button>
            </div>
            <button
              onClick={goToday}
              className="text-xs sm:text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition"
            >{t('provider.calendar.today')}</button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase py-1">
                {t(`provider.calendar.weekdaysShort.${d}`)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {daysGrid.map((cell, idx) => {
              if (!cell) return <div key={idx} className="aspect-square" />;
              const isSelected = cell.iso === selectedDate;
              const isToday = cell.iso === toLocalISODate(today);
              const info = cell.info;
              const hasBookings = info?.bookingsCount > 0;
              const isWorking = !!info?.workingDay;
              const hasException = !!info?.hasException;
              const isHoliday = !!info?.isHoliday;

              const base = 'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40';
              let cls;
              if (isSelected) {
                cls = 'bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30';
              } else if (isHoliday) {
                cls = 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200';
              } else if (hasException) {
                cls = 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200';
              } else if (isWorking) {
                cls = 'bg-white text-gray-800 hover:bg-brand-50 border border-gray-200 hover:border-brand-300';
              } else {
                cls = 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cell.iso)}
                  className={`${base} ${cls}`}
                  aria-label={cell.iso + (isHoliday ? ` · ${info.holidayName}` : '')}
                  title={isHoliday ? info.holidayName : undefined}
                  aria-pressed={isSelected}
                >
                  <span className={`${isToday && !isSelected ? 'underline decoration-brand-500 decoration-2 underline-offset-2' : ''}`}>
                    {cell.day}
                  </span>
                  {(hasBookings || hasException || isHoliday) && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {hasBookings && (
                        <span className={`block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-500'}`} />
                      )}
                      {hasException && (
                        <span className={`block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                      )}
                      {isHoliday && (
                        <span className={`block w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white border border-gray-300" />
              {t('provider.calendar.legend.working')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
              {t('provider.calendar.legend.notWorking')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              {t('provider.calendar.legend.bookings')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t('provider.calendar.legend.exception')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {t('provider.calendar.legend.holiday')}
            </span>
          </div>
        </div>

        {/* Panel del día */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-200 text-brand-600 shrink-0">
              <HiClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {parseISODate(selectedDate).toLocaleDateString(i18n.language, {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </h3>
              {dayData?.workingHours?.available ? (
                <p className="text-xs text-gray-500">
                  {dayData.workingHours.start} – {dayData.workingHours.end}
                </p>
              ) : (
                <p className="text-xs text-gray-400">{t('provider.calendar.notWorkingDay')}</p>
              )}
            </div>
          </div>

          {loadingDay ? (
            <CalendarSkeleton />
          ) : (
            <>
              {/* Banner Feriado */}
              {dayData?.isHoliday && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-linear-to-br from-rose-50 to-rose-100/60 border border-rose-200">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-500 text-white shrink-0">
                    <HiSparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
                      {t('provider.calendar.holidayLabel')}
                    </p>
                    <p className="text-sm text-rose-900 font-medium truncate">
                      {dayData.holidayName}
                    </p>
                  </div>
                </div>
              )}

              {/* Bookings */}
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <HiBriefcase className="w-4 h-4 text-brand-500" />
                  {t('provider.calendar.dayBookings')}
                  {dayData?.bookings?.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-gray-500">
                      {dayData.bookings.length}
                    </span>
                  )}
                </h4>
                {dayData?.bookings?.length > 0 ? (
                  <ul className="space-y-2">
                    {dayData.bookings.map(b => (
                      <li key={b._id} className="flex items-start gap-3 p-3 rounded-xl bg-linear-to-br from-brand-50/50 to-white border border-brand-100">
                        <div className="flex flex-col items-center justify-center w-14 shrink-0 bg-white rounded-lg border border-brand-200 py-1">
                          <span className="text-[10px] font-medium text-brand-600 uppercase">{b.scheduledTime || '—'}</span>
                          <span className="text-[10px] text-gray-500">{b.estimatedDuration || 1}h</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {b.serviceTitle || t('provider.calendar.untitledService')}
                          </p>
                          {b.clientName && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                              <HiUser className="w-3 h-3" /> {b.clientName}
                            </p>
                          )}
                          <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            b.status === 'completed' ? 'bg-green-100 text-green-700' :
                            b.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            b.status === 'provider_en_route' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t(`provider.calendar.bookingStatus.${b.status}`, b.status)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">{t('provider.calendar.noBookingsDay')}</p>
                )}
              </section>

              {/* Excepciones del día */}
              {dayData?.exceptions?.length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <HiExclamation className="w-4 h-4 text-amber-500" />
                    {t('provider.calendar.dayExceptions')}
                  </h4>
                  <ul className="space-y-1.5">
                    {dayData.exceptions.map((ex, i) => (
                      <li key={i} className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <span className="font-medium">
                          {ex.allDay ? t('provider.calendar.allDay') : `${ex.startTime} – ${ex.endTime}`}
                        </span>
                        {ex.reason ? ` · ${ex.reason}` : ''}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Slots libres */}
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <HiCheckCircle className="w-4 h-4 text-green-500" />
                  {t('provider.calendar.availableSlots')}
                  {dayData?.slots?.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-gray-500">
                      {dayData.slots.length}
                    </span>
                  )}
                </h4>
                {dayData?.slots?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {dayData.slots.map((s, i) => (
                      <span key={i} className="text-xs text-center px-2 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {dayData?.workingHours?.available ? t('provider.calendar.allSlotsBooked') : t('provider.calendar.noSlotsDescription')}
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Próximos trabajos (7 días) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-brand-100 to-brand-200 text-brand-600 shrink-0">
              <HiBriefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {t('provider.calendar.upcomingTitle')}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {t('provider.calendar.upcomingSubtitle')}
              </p>
            </div>
          </div>
          {upcoming.length > 0 && (
            <button
              onClick={() => navigate('/reservas')}
              className="text-xs sm:text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition whitespace-nowrap"
            >
              {t('provider.calendar.upcomingViewAll')}
            </button>
          )}
        </div>

        {loadingUpcoming ? (
          <CalendarSkeleton />
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3">
              <HiCalendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700">{t('provider.calendar.upcomingEmpty')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('provider.calendar.upcomingEmptyDesc')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcoming.map(item => {
              const d = parseISODate(item.scheduledDate);
              const dateLabel = d.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <li
                  key={item._id}
                  className="group relative flex flex-col gap-2 p-3 rounded-xl bg-linear-to-br from-white to-brand-50/30 border border-gray-200 hover:border-brand-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center w-14 shrink-0 bg-linear-to-br from-brand-500 to-brand-600 text-white rounded-lg py-1.5">
                      <span className="text-[10px] font-medium uppercase leading-tight">{dateLabel.split(' ')[0]}</span>
                      <span className="text-base font-bold leading-tight">{d.getDate()}</span>
                      <span className="text-[10px] uppercase leading-tight">{item.scheduledTime || '—'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.serviceTitle || t('provider.calendar.untitledService')}
                      </p>
                      {item.clientName && (
                        <p className="text-xs text-gray-600 flex items-center gap-1 truncate mt-0.5">
                          <HiUser className="w-3 h-3 shrink-0" /> {item.clientName}
                        </p>
                      )}
                      {item.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate mt-0.5">
                          <HiLocationMarker className="w-3 h-3 shrink-0" /> {item.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'provider_en_route' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {t(`provider.calendar.bookingStatus.${item.status}`, item.status)}
                    </span>
                    <button
                      onClick={() => setSelectedDate(item.scheduledDate)}
                      className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      {t('provider.calendar.viewDay')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <WeeklyScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        initialHours={schedule.workingHours}
        onSaved={(newHours) => {
          setSchedule(prev => ({ ...prev, workingHours: newHours }));
          setSuccessMsg(t('provider.calendar.scheduleSaved'));
          loadMonth(cursor.getFullYear(), cursor.getMonth());
          loadDay(selectedDate);
        }}
      />

      <ExceptionsModal
        open={exceptionModalOpen}
        onClose={() => setExceptionModalOpen(false)}
        exceptions={schedule.exceptions}
        defaultDate={selectedDate}
        onAdded={(newList) => {
          setSchedule(prev => ({ ...prev, exceptions: newList }));
          setSuccessMsg(t('provider.calendar.exceptionAdded'));
          loadMonth(cursor.getFullYear(), cursor.getMonth());
          loadDay(selectedDate);
        }}
        onRemoved={(newList) => {
          setSchedule(prev => ({ ...prev, exceptions: newList }));
          setSuccessMsg(t('provider.calendar.exceptionRemoved'));
          loadMonth(cursor.getFullYear(), cursor.getMonth());
          loadDay(selectedDate);
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Modal: Horario semanal                      */
/* ──────────────────────────────────────────── */
function buildDefaultHours(src) {
  const out = {};
  for (const d of DAYS_OF_WEEK) {
    const s = src?.[d] || {};
    out[d] = {
      start: s.start || '09:00',
      end: s.end || '18:00',
      available: Boolean(s.available)
    };
  }
  return out;
}

function WeeklyScheduleModal({ open, onClose, initialHours, onSaved }) {
  const { t } = useTranslation();
  const [hours, setHours] = useState(() => buildDefaultHours(initialHours));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setHours(buildDefaultHours(initialHours));
      setErr('');
    }
  }, [open, initialHours]);

  const handleToggle = (day) => setHours(h => ({ ...h, [day]: { ...h[day], available: !h[day].available } }));
  const handleChange = (day, field, value) => setHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }));

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      for (const d of DAYS_OF_WEEK) {
        const { start, end, available } = hours[d];
        if (available && start >= end) {
          setErr(t('provider.calendar.errors.invalidRange', { day: t(`provider.calendar.weekdays.${d}`) }));
          setSaving(false);
          return;
        }
      }
      const { data } = await api.put('/provider/services/availability/schedule', { workingHours: hours });
      onSaved?.(data?.data?.workingHours || hours);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || t('provider.calendar.errors.saveFailed'));
    } finally { setSaving(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('provider.calendar.weeklyScheduleTitle')}
      size="lg"
      icon={HiCog}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('provider.calendar.cancel')}
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {t('provider.calendar.save')}
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600">{t('provider.calendar.weeklyScheduleDesc')}</p>
        {err && <Alert type="error">{err}</Alert>}
        <div className="space-y-2">
          {DAYS_OF_WEEK.map(day => {
            const h = hours[day];
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <label className="flex items-center gap-2 sm:w-32 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.available}
                    onChange={() => handleToggle(day)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {t(`provider.calendar.weekdays.${day}`)}
                  </span>
                </label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="time"
                    value={h.start}
                    disabled={!h.available}
                    onChange={(e) => handleChange(day, 'start', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="time"
                    value={h.end}
                    disabled={!h.available}
                    onChange={(e) => handleChange(day, 'end', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────────────────────── */
/*  Modal: Excepciones                          */
/* ──────────────────────────────────────────── */
function ExceptionsModal({ open, onClose, exceptions, defaultDate, onAdded, onRemoved }) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ date: defaultDate, allDay: true, startTime: '09:00', endTime: '13:00', reason: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ date: defaultDate, allDay: true, startTime: '09:00', endTime: '13:00', reason: '' });
      setErr('');
    }
  }, [open, defaultDate]);

  const handleAdd = async () => {
    setSaving(true); setErr('');
    try {
      if (!form.date) { setErr(t('provider.calendar.errors.dateRequired')); setSaving(false); return; }
      if (!form.allDay && form.startTime >= form.endTime) {
        setErr(t('provider.calendar.errors.invalidRange', { day: '' }));
        setSaving(false); return;
      }
      const payload = {
        date: form.date,
        reason: form.reason,
        allDay: form.allDay,
        ...(form.allDay ? {} : { startTime: form.startTime, endTime: form.endTime })
      };
      const { data } = await api.post('/provider/services/availability/exceptions', payload);
      onAdded?.(data?.data?.exceptions || []);
      setForm(f => ({ ...f, reason: '' }));
    } catch (e) {
      setErr(e?.response?.data?.message || t('provider.calendar.errors.saveFailed'));
    } finally { setSaving(false); }
  };

  const handleRemove = async (id) => {
    setDeletingId(id); setErr('');
    try {
      const { data } = await api.delete(`/provider/services/availability/exceptions/${id}`);
      onRemoved?.(data?.data?.exceptions || []);
    } catch (e) {
      setErr(e?.response?.data?.message || t('provider.calendar.errors.saveFailed'));
    } finally { setDeletingId(null); }
  };

  const sorted = useMemo(() => [...(exceptions || [])].sort((a, b) => new Date(a.date) - new Date(b.date)), [exceptions]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('provider.calendar.exceptionsTitle')}
      size="lg"
      icon={HiExclamation}
      actions={<Button variant="secondary" onClick={onClose}>{t('provider.calendar.close')}</Button>}
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600">{t('provider.calendar.exceptionsDesc')}</p>
        {err && <Alert type="error">{err}</Alert>}

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">{t('provider.calendar.addException')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('provider.calendar.date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm(f => ({ ...f, allDay: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{t('provider.calendar.allDay')}</span>
              </label>
            </div>
            {!form.allDay && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('provider.calendar.startTime')}</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('provider.calendar.endTime')}</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('provider.calendar.reason')}</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder={t('provider.calendar.reasonPlaceholder')}
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} loading={saving}>
              <HiPlus className="w-4 h-4" />
              {t('provider.calendar.add')}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {t('provider.calendar.currentExceptions')} ({sorted.length})
          </h4>
          {sorted.length === 0 ? (
            <p className="text-xs text-gray-400 italic">{t('provider.calendar.noExceptions')}</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sorted.map((ex) => (
                <li key={ex._id || ex.date} className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
                  <HiExclamation className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      {new Date(ex.date).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {ex.allDay ? t('provider.calendar.allDay') : `${ex.startTime} – ${ex.endTime}`}
                    </p>
                    {ex.reason && <p className="text-xs text-amber-800 truncate">{ex.reason}</p>}
                  </div>
                  <button
                    onClick={() => handleRemove(ex._id)}
                    disabled={deletingId === ex._id || !ex._id}
                    aria-label={t('provider.calendar.removeException')}
                    className="p-2 rounded-lg text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
                  >
                    {deletingId === ex._id
                      ? <span className="inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                      : <HiTrash className="w-4 h-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
