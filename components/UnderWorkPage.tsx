export function UnderWorkPage({ featureName }: { featureName: string }) {
  const featureDisplayNames: Record<string, string> = {
    maps: "Maps & Locations",
    noticeboard: "Noticeboard",
    location: "Location Details",
    admin: "Admin Dashboard",
  };

  const displayName = featureDisplayNames[featureName] || featureName;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="text-6xl">🚧</div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Coming Soon
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {displayName} is under development
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We&apos;re working hard to bring you an even better experience.
            Please check back soon!
          </p>
        </div>

        <div className="pt-4">
          <a
            href="/profile"
            className="inline-flex items-center justify-center px-6 py-2 bg-white text-black hover:bg-gray-100 font-medium rounded-lg transition-colors"
          >
            Go Back
          </a>
        </div>
      </div>
    </div>
  );
}
