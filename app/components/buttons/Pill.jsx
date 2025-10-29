import React from 'react'

function Pill({ label, onClick }) {
  return (
    <button className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-green-800" onClick={onClick}>
      {label}
    </button>
  )
}

export default Pill