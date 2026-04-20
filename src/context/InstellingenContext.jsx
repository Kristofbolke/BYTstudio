// src/context/InstellingenContext.jsx — Gedeelde app-instellingen
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const InstellingenContext = createContext(null)

const STANDAARD = {
  bedrijfsnaam: 'Build Your Tools',
  eigenaar_naam: '',
  btw_nummer: '',
  adres: '',
  email: '',
  telefoon: '',
  website: '',
  iban: '',
  bic: '',
  logo_url: '',
  uurtarief: 75,
  btw_percentage: 21,
  marge_percentage: 15,
  betalingstermijn: 30,
  offerte_geldigheid: 30,
  offerte_voorwaarden: '',
  factuur_voorwaarden: '',
  rechtbank: 'arrondissement Gent',
  nalatigheidsintrest: 10,
  forfait_schadevergoeding: 40,
  banner_zichtbaar: true,
  banner_titel: 'Welkom bij Build Your Tools',
  banner_subtitel: 'Slimme apps voor slimme bedrijven',
  standaard_projectstatus: 'intake',
  standaard_handleiding_versie: 'v1.0',
  standaard_auteur_handleiding: 'Build Your Tools',
}

export function InstellingenProvider({ children }) {
  const [instellingen, setInstellingen] = useState(STANDAARD)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    laadInstellingen()
  }, [])

  const laadInstellingen = async () => {
    const { data } = await supabase
      .from('instellingen')
      .select('*')
      .limit(1)
      .single()
    if (data) setInstellingen({ ...STANDAARD, ...data })
    setLaden(false)
  }

  const updateInstelling = async (veld, waarde) => {
    setInstellingen(prev => ({ ...prev, [veld]: waarde }))
    if (instellingen.id) {
      await supabase
        .from('instellingen')
        .update({ [veld]: waarde, bijgewerkt_op: new Date().toISOString() })
        .eq('id', instellingen.id)
    }
  }

  return (
    <InstellingenContext.Provider value={{
      instellingen,
      laden,
      updateInstelling,
      herlaad: laadInstellingen,
    }}>
      {children}
    </InstellingenContext.Provider>
  )
}

export const useInstellingen = () => useContext(InstellingenContext)
