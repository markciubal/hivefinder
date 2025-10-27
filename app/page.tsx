import Image from "next/image";
import React from "react";
import Header from "./components/header/Header.jsx";
import Body from "./components/body/Body.jsx";
export default function Home() {
  const content = (
    <>
      <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-4xl text-center mx-auto my-8">
        <img src="logo.svg" alt="HiveFinder Logo" className="mx-auto mb-0 w-100 h-auto" />
        <h1>A one-stop shop for clubs and organizations.</h1>
      </div>
      <div>

      </div>
    </>
  )
  return (
    <>
      <Header />
      <Body content={content} />
    </>
  );
}
