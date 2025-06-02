

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
    return (
        <div id="noticeboard" className={`antialiased relative min-h-screen`}>
          <div className="relative z-0">
            {children}
          </div>
        </div>
  );
}