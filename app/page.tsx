import Image from "next/image";
import React from "react";
import Header from "./components/header/Header.jsx";
import Body from "./components/body/Body.jsx";
import DefaultButton from "./components/buttons/DefaultButton.jsx";
export default function Home() {
  const content = (
    <>
      <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-4xl text-center mx-auto my-8">
        <img src="logo.svg" alt="HiveFinder Logo" className="mx-auto w-100 h-auto" />
        <p className="text-2xl font-bold">A one-stop shop for clubs and organizations.</p>
      </div>
       <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-4xl text-center mx-auto my-8">
        <p className="text-2xl font-bold">Want to find a friend?</p>
        <p className="text-lg text-gray-500 font-bold">Click the button below to head to our friend finder page where you can find friends with the same interest!</p>
        <DefaultButton label="Buddy Finder" onClick="/friendFinder" />
      </div>
      <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-4xl text-center mx-auto my-8">
        <p className="text-2xl font-bold">Want to find a friend?</p>
        <p className="text-lg text-gray-500 font-bold">Click the button below to head to our club page where you will see a list of our clubs offered at CSU Sacramento.</p>
        <DefaultButton label="Club Listings" onClick="/clubPage" />
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
