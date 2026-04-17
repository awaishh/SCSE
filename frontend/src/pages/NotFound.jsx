import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-blue-600 dark:text-blue-500">404</h1>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Page not found</p>
        <p className="text-gray-500 mt-2 mb-8">Sorry, we couldn't find the page you're looking for.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
