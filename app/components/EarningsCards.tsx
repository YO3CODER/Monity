import React from 'react'

type Props = {
  earned: number
  toCollect: number
}

const EarningsCards: React.FC<Props> = ({ earned, toCollect }) => {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="bg-base-200 rounded-2xl shadow-md p-5 flex justify-between items-center">
        <span className="font-bold text-lg">Argent gagné :</span>
        <span className="font-bold text-2xl text-accent whitespace-nowrap">
          {earned.toFixed(0)} FCFA
        </span>
      </div>

      <div className="bg-base-200 rounded-2xl shadow-md p-5 flex justify-between items-center">
        <span className="font-bold text-lg">Argent à encaisser :</span>
        <span className="font-bold text-2xl text-error whitespace-nowrap">
          {toCollect.toFixed(0)} FCFA
        </span>
      </div>
    </div>
  )
}

export default EarningsCards