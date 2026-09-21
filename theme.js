// Runs before styles load so a saved dark appearance never flashes a light page.
(() => {
  const KEY = 'zhushi-daji-appearance-v1';
  const defaults = {mode: 'auto', dayStart: '07:00', nightStart: '19:00'};
  const modes = ['auto', 'light', 'dark'];
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  function normalize(value) {
    const result = {...defaults};
    if (value && modes.includes(value.mode)) result.mode = value.mode;
    if (validTime(value?.dayStart) && validTime(value?.nightStart) && value.dayStart !== value.nightStart) {
      result.dayStart = value.dayStart;
      result.nightStart = value.nightStart;
    }
    return result;
  }
  function parse(value) { try { return normalize(JSON.parse(value)); } catch { return {...defaults}; } }
  let settings;
  try { settings = parse(localStorage.getItem(KEY)); } catch { settings = {...defaults}; }
  let saveFailed = false;
  const root = document.documentElement;
  function resolvedTheme(now) {
    if (settings.mode !== 'auto') return settings.mode;
    const current = now.getHours() * 60 + now.getMinutes();
    const start = minutes(settings.dayStart), end = minutes(settings.nightStart);
    const daytime = start < end ? current >= start && current < end : current >= start || current < end;
    return daytime ? 'light' : 'dark';
  }
  function apply() {
    const theme = resolvedTheme(new Date());
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#1c211f' : '#f8f6ef';
    const label = theme === 'dark' ? '深色' : '浅色';
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute('aria-label', `外观设置，当前${settings.mode === 'auto' ? '自动 · ' : ''}${label}`);
      toggle.title = `外观：${settings.mode === 'auto' ? '自动 · ' : ''}${label}`;
    }
    document.querySelectorAll('[data-theme-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeMode === settings.mode));
    });
    const schedule = document.getElementById('theme-schedule');
    if (schedule) schedule.hidden = settings.mode !== 'auto';
    const status = document.getElementById('theme-status');
    if (status) status.textContent = saveFailed ? '本次已生效，但浏览器未能记住设置。' : settings.mode === 'auto'
      ? `当前为${label} · ${theme === 'light' ? settings.nightStart + ' 转为深色' : settings.dayStart + ' 转为浅色'}`
      : `${label}外观 · 保持到你再次更改`;
  }
  function syncInputs() {
    for (const name of ['dayStart', 'nightStart']) {
      const input = document.getElementById('theme-' + name);
      if (input) { input.value = settings[name]; input.removeAttribute('aria-invalid'); }
    }
    const error = document.getElementById('theme-error');
    if (error) error.textContent = '';
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); saveFailed = false; }
    catch { saveFailed = true; }
    apply();
  }
  apply();
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'theme-toggle') {
      syncInputs(); apply();
      document.getElementById('appearance-dialog').showModal();
    } else if (button.hasAttribute('data-theme-close')) {
      document.getElementById('appearance-dialog').close();
    } else if (modes.includes(button.dataset.themeMode)) {
      settings.mode = button.dataset.themeMode;
      syncInputs(); save();
    }
  });
  document.addEventListener('change', event => {
    if (!['theme-dayStart', 'theme-nightStart'].includes(event.target.id)) return;
    const day = document.getElementById('theme-dayStart'), night = document.getElementById('theme-nightStart');
    const valid = validTime(day.value) && validTime(night.value) && day.value !== night.value;
    document.getElementById('theme-error').textContent = valid ? '' : '请设置两个不同的有效时间。';
    [day, night].forEach(input => valid ? input.removeAttribute('aria-invalid') : input.setAttribute('aria-invalid', 'true'));
    if (valid) { settings.dayStart = day.value; settings.nightStart = night.value; save(); }
  });
  document.addEventListener('DOMContentLoaded', () => { syncInputs(); apply(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
  window.addEventListener('focus', apply);
  window.addEventListener('pageshow', apply);
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    settings = parse(event.newValue); saveFailed = false; syncInputs(); apply();
  });
  function tick() {
    apply();
    const now = new Date();
    setTimeout(tick, 60000 - now.getSeconds() * 1000 - now.getMilliseconds());
  }
  tick();
})();
