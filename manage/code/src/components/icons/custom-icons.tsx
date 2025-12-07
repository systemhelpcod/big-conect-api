import type { SVGProps } from 'react';

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.75 13.96c.25.25.25.66 0 .91l-1.5 1.5c-.25.25-.66.25-.91 0s-.25-.66 0-.91l1.5-1.5c.25-.25.66-.25.91 0zM19 12c0 3.87-3.13 7-7 7-1.88 0-3.62-.74-4.94-2.06l-4.06 1.01 1.01-4.06C2.74 15.62 2 13.88 2 12c0-3.87 3.13-7 7-7s7 3.13 7 7zm-2 0c0-2.76-2.24-5-5-5s-5 2.24-5 5c0 1.38.56 2.63 1.46 3.54l-1.41 1.41.62 2.48 2.48.62 1.41-1.41C10.37 19.44 11.62 20 13 20c2.76 0 5-2.24 5-5z"/>
    </svg>
  );
}

export function MySQLIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M12 5v9" />
      <path d="M15.5 8.5C15.5 9.32843 13.933 10 12 10C10.067 10 8.5 9.32843 8.5 8.5" />
    </svg>
  );
}

export function PostgreSQLIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 9.5V21m0-11.5L6 6v12.5" />
      <path d="M12 9.5L18 6v12.5" />
      <path d="M12 21a2.5 2.5 0 000-5 2.5 2.5 0 000 5zm0-11.5a2.5 2.5 0 000-5 2.5 2.5 0 000 5z" />
      <path d="M6 18.5a2.5 2.5 0 000-5 2.5 2.5 0 000 5zM18 18.5a2.5 2.5 0 000-5 2.5 2.5 0 000 5z" />
      <path d="M6 6a2.5 2.5 0 000-5 2.5 2.5_0 000 5zM18 6a2.5 2.5 0 000-5 2.5 2.5 0 000 5z" />
    </svg>
  );
}

export function MongoDBIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M15.96 17.5c.68 1.1 1.63 1.95 2.54 2.5M12 2c-1.92 1.3-3 3.32-3 5.5v.55c0 .54.1.98.22 1.45M12 2c1.92 1.3 3 3.32 3 5.5v.55c0 .54-.1.98-.22 1.45M12 2v20M9.22 9.55c.34-.16.7-.27 1.1-.35C11.16 12.3 12 15.55 12 18c0 .87-.1 1.6-.2 2.5M14.78 9.55c-.34-.16-.7-.27-1.1-.35C12.84 12.3 12 15.55 12 18c0 .87.1 1.6.2 2.5M5.5 10.5c-2.42.33-4.5 2.35-4.5 4.5 0 1.54.84 3.03 2.5 4.5M18.5 10.5c2.42.33 4.5 2.35 4.5 4.5 0 1.54-.84 3.03-2.5 4.5"/>
    </svg>
  );
}

export function SQLiteIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 5h16" />
        <path d="M4 12h16" />
        <path d="M4 19h16" />
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M12 3v18" />
      </svg>
    );
}
