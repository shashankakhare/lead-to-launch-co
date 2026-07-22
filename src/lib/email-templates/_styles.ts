// Shared styling for auth emails — Apple-inspired cinematic dark card on a
// white body (Body must remain #ffffff for max client compatibility).

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
}

export const container = {
  backgroundColor: '#0a0a0a',
  backgroundImage:
    'linear-gradient(160deg, #111113 0%, #0a0a0a 55%, #050505 100%)',
  borderRadius: '20px',
  padding: '40px 36px',
  maxWidth: '520px',
  margin: '0 auto',
  border: '1px solid #1f1f22',
}

export const brand = {
  fontSize: '13px',
  fontWeight: 600 as const,
  color: '#8a8a8f',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  margin: '0 0 28px',
}

export const h1 = {
  fontSize: '28px',
  lineHeight: '1.15',
  fontWeight: 700 as const,
  color: '#ffffff',
  letterSpacing: '-0.02em',
  margin: '0 0 18px',
}

export const text = {
  fontSize: '15px',
  color: '#c7c7cc',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

export const link = {
  color: '#ffffff',
  textDecoration: 'underline',
}

export const button = {
  backgroundColor: '#ffffff',
  color: '#0a0a0a',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '-0.01em',
}

export const codeStyle = {
  fontFamily:
    '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '32px',
  letterSpacing: '0.35em',
  fontWeight: 700 as const,
  color: '#ffffff',
  backgroundColor: '#141416',
  border: '1px solid #26262a',
  borderRadius: '12px',
  padding: '18px 24px',
  textAlign: 'center' as const,
  margin: '0 0 28px',
}

export const divider = {
  borderColor: '#1f1f22',
  margin: '32px 0 20px',
}

export const footer = {
  fontSize: '12px',
  color: '#6e6e73',
  lineHeight: '1.5',
  margin: '0',
}
