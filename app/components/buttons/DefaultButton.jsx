import React from 'react'

function DefaultButton({ label,onClick }) {
  return (
    <button onClick={onClick} className="px-4 py-2 m-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
      {label}
    </button>
  )
}

export default DefaultButton