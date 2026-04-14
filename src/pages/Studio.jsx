// Studio.jsx — Huisstijlen en visuele identiteit per project beheren
import PageWrapper from '../components/PageWrapper'
import { Palette } from 'lucide-react'

export default function Studio() {
  return (
    <PageWrapper
      title="Studio"
      description="Huisstijlen, kleurpaletten, typografie en logo's per project."
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-10 text-center">
          <Palette size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm font-medium">Selecteer een project</p>
          <p className="text-gray-400 text-xs mt-1">
            Kies een project om de bijhorende huisstijl te bekijken of aan te passen.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}
