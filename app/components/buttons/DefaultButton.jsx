"use client";
import { useRouter } from "next/navigation";

export default function DefaultButton({ type, url, label }) {
  const router = useRouter();

  const buttonHandler = () => {
    if (type === "link") {
      router.push(url);
    }
  };

  return (
    <button onClick={buttonHandler} className="px-4 py-2 m-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700">
      {label}
    </button>
  );
}
