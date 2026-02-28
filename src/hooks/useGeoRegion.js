import { useState, useEffect } from 'react'

// Country code → continent slug mapping
const CONTINENTS = {
  africa: ['DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'],
  asia:   ['AF','AM','AZ','BH','BD','BT','BN','MM','KH','CN','CY','GE','HK','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MO','MY','MV','MN','NP','KP','OM','PK','PS','PH','QA','SA','SG','KR','LK','SY','TW','TJ','TH','TL','TM','AE','UZ','VN','YE'],
  europe: ['AL','AD','AT','BY','BE','BA','BG','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','XK','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE','CH','UA','GB','VA'],
  'north-america': ['AG','BS','BB','BZ','CA','CR','CU','DM','DO','SV','GD','GT','HT','HN','JM','MX','NI','PA','KN','LC','VC','TT','US'],
  'south-america': ['AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE'],
  oceania: ['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU'],
}

// Map country code to { region (header tab), continent (for geo posts), label, country }
function mapCountry(code) {
  if (!code) return { region: null, continent: null, label: null }
  let continent = null
  for (const [c, codes] of Object.entries(CONTINENTS)) {
    if (codes.includes(code)) { continent = c; break }
  }
  // Header tab region (fine-grained for US/China, otherwise null)
  const region = code === 'US' ? 'us' : ['CN','HK','TW','MO'].includes(code) ? 'china' : null
  const label = continent
    ? continent.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null
  return { region, continent, label }
}

export function useGeoRegion() {
  const [geo, setGeo] = useState({ detected: false, region: null, continent: null, label: null, country: null })

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('yup_geo')
      if (cached) { setGeo({ ...JSON.parse(cached), detected: true }); return }
    } catch {}

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const { region, continent, label } = mapCountry(d.country_code)
        const data = { detected: true, region, continent, label, country: d.country_name, countryCode: d.country_code }
        try { sessionStorage.setItem('yup_geo', JSON.stringify(data)) } catch {}
        setGeo(data)
      })
      .catch(() => setGeo({ detected: true, region: null, continent: null, label: null, country: null }))
  }, [])

  return geo
}
