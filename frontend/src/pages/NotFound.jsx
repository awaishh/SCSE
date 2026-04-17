import { Link } from "react-router-dom";
import { MoveLeft } from "lucide-react";
import Button from "../components/UI/Button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-gray-200 dark:text-gray-800">404</h1>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Page not found</p>
        <p className="text-gray-500 mt-2 mb-8">Sorry, we couldn't find the page you're looking for.</p>
        
        <Link to="/">
          <Button variant="primary" className="w-auto mx-auto inline-flex">
            <MoveLeft size={20} className="mr-2" />
            Go back home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
