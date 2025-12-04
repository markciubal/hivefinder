import React from "react";
import DefaultButton from "../buttons/DefaultButton.jsx";

export default function Body() {
  return (
    <>
      <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-3xl text-center mx-auto my-8">
        <img src="/logo.png" alt="HiveFinder Logo" className="mx-auto mb-3 w-full max-w-[300px] h-auto" />
        <p className="text-2xl font-bold">A one-stop shop for clubs and organizations.</p>
      </div>

      <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-3xl text-center mx-auto my-8">
        <p className="text-2xl font-bold">Want to find a club?</p>
        <p className="text-lg text-gray-600 font-semibold">
          Click the button below to head to our club page where you will see a list of our clubs offered at CSU Sacramento.
        </p>
        <DefaultButton type="link" label="Club Page" url="/clubPage" />
      </div>

      <div className="bg-[#c4ceb2] p-4 w-3/4 rounded-3xl text-center mx-auto my-8">
        <p className="text-2xl font-bold">Want to find a friend?</p>
        <p className="text-lg text-gray-600 font-semibold">
          Click the button below to head to our friend finder page where you can find friends with the same interest!
        </p>
        <DefaultButton type="link" label="Friend Finder" url="/friendFinder" />
      </div>
    </>
  );
}
