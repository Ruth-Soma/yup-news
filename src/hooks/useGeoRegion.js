import { useState, useEffect } from 'react'

const CHINA_CODES = ['CN', 'HK', 'TW', 'MO']

function mapCode(code) {
  if (!code) return { region: null, label: null }
  if (code === 'US') return { region: 'us', label: 'United States' }
  if (CHINA_CODES.includes(code)) return { region: 'china', label: 'China' }
  return { region: null, label: null }
}

export function useGeoRegion() {
  // detected: false = pending, true = done (region may be null)
  const [geo, setGeo] = useState({ detected: false, region: null, label: null })

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('yup_geo')
      if (cached) {
        setGeo({ ...JSON.parse(cached), detected: true })
        return
      }
    } catch {}

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const { region, label } = mapCode(d.country_code)
        const data = { detected: true, region, label, country: d.country_name }
        try { sessionStorage.setItem('yup_geo', JSON.stringify(data)) } catch {}
        setGeo(data)
      })
      .catch(() => setGeo({ detected: true, region: null, label: null }))
  }, [])

  return geo
}
