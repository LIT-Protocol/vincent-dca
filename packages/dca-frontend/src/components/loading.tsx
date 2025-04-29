export default function Loading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
