import React from 'react'
import { Wallet, Hourglass } from 'lucide-react'

type Props = {
  earned: number
  toCollect: number
  currency?: string
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount)

const EarningsCards: React.FC<Props> = ({ earned, toCollect, currency = 'EUR' }) => {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Argent gagné</p>
          <p className="text-2xl font-bold text-emerald-600">{formatMoney(earned, currency)}</p>
        </div>
        <div className="bg-emerald-100 text-emerald-600 rounded-full p-3">
          <Wallet className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Argent à encaisser</p>
          <p className="text-2xl font-bold text-orange-600">{formatMoney(toCollect, currency)}</p>
        </div>
        <div className="bg-orange-100 text-orange-600 rounded-full p-3">
          <Hourglass className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

export default EarningsCards