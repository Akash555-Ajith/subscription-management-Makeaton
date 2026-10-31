if (location.pathname.startsWith('/legacy') || location.pathname.startsWith('/pay/')) { import('./LegacyWorkspace.jsx'); } else { import('./brightloop/entry.jsx'); }
