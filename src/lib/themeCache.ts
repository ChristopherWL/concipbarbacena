export type ThemeSnapshot = {
  dark: boolean;
  vars: Record<string, string>;
  classes?: string[];
};

const THEME_CACHE_KEY = 'lovable_theme_snapshot_v1';

export function loadThemeSnapshotFromSession(): ThemeSnapshot | null {
  try {
    const raw = sessionStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeSnapshot;
  } catch {
    return null;
  }
}

export function saveThemeSnapshotToSession(snapshot: ThemeSnapshot) {
  try {
    sessionStorage.setItem(THEME_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function clearThemeSnapshotFromSession() {
  try {
    sessionStorage.removeItem(THEME_CACHE_KEY);
  } catch {
    // ignore
  }
}

function removeMenuThemeClasses() {
  document.documentElement.classList.forEach((cls) => {
    if (cls.startsWith('menu-theme-')) document.documentElement.classList.remove(cls);
  });
}

/**
 * Clears previously applied inline CSS variables/classes from the last cached snapshot.
 * This avoids “leaking” colors between different users/tenants.
 */
export function resetInlineThemeFromCachedSnapshot() {
  const prev = loadThemeSnapshotFromSession();

  // Remove inline vars we previously set
  Object.keys(prev?.vars || {}).forEach((k) => {
    document.documentElement.style.removeProperty(k);
  });

  // Remove menu-theme-* classes
  removeMenuThemeClasses();
}

export function applyThemeSnapshot(snapshot: ThemeSnapshot | null) {
  if (!snapshot) return;

  // Theme mode first
  if (snapshot.dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Apply CSS vars
  Object.entries(snapshot.vars || {}).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });

  // Optional extra classes (e.g. menu-theme-custom)
  if (snapshot.classes?.length) {
    snapshot.classes.forEach((cls) => document.documentElement.classList.add(cls));
  }
}

export function applyThemeSnapshotFromSession() {
  applyThemeSnapshot(loadThemeSnapshotFromSession());
}

