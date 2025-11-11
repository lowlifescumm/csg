// Temporarily remove global CSS to rule out PostCSS/Tailwind issues during isolation

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
