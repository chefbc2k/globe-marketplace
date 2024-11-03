import { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { VoiceTalent } from '@/types'
import { PaymentForm } from './PaymentForm'

interface VoiceTalentModalProps {
  talent: VoiceTalent
  isOpen: boolean
  onClose: () => void
}

export function VoiceTalentModal({ talent, isOpen, onClose }: VoiceTalentModalProps) {
  const [clientSecret, setClientSecret] = useState<string>()

  const handleBooking = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: talent.hourly_rate,
          talentId: talent.id,
        }),
      })
      
      const { clientSecret } = await response.json()
      setClientSecret(clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{talent.name}</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Language</p>
            <p>{talent.language?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p>{talent.category?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rate</p>
            <p>${talent.hourly_rate}/hour</p>
          </div>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onSuccess={onClose} />
          </Elements>
        ) : (
          <button
            onClick={handleBooking}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  )
} 