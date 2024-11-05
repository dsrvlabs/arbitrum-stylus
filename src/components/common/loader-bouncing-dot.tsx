import React from "react";

export const LoaderBouncingDot = () => {
  return (
    <div className="flex space-x-1 bouncing-loader">
      <div className="mt-2 w-1 h-1 bg-gray-400 rounded-full opacity-100 animate-bouncingLoader"></div>
      <div className="mt-2 w-1 h-1 bg-gray-400 rounded-full opacity-100 animate-bouncingLoader delay-200"></div>
      <div className="mt-2 w-1 h-1 bg-gray-400 rounded-full opacity-100 animate-bouncingLoader delay-300"></div>
    </div>
  );
};
