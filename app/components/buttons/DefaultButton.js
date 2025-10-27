import React from 'react'

function DefaultButton({ label,onClick }) {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-green-700">
      {label}
    </button>
  )
}

export default DefaultButton