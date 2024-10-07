import { FaSpinner } from "react-icons/fa";

interface LoaderWrapperProps {
  loading: boolean;
}
export const LoaderWrapper: React.FC<LoaderWrapperProps> = ({ loading }) => {
  return loading ? (
    <div className="h-full w-full absolute top-0 left-0 flex items-center justify-center bg-gray-700 opacity-70">
      <FaSpinner className="animate-spin" />
    </div>
  ) : null;
};
