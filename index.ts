import axios from 'axios'
import { getEntities } from 'wikidata-sdk'

(async () => {
    // const r = await axios.get('https://www.wikidata.org/wiki/Q41812531')
    // const r = await getEntities('Q41812531', 'ja')
    const r = await axios.get('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q41812531&format=json&languages=ja')
    console.log(JSON.stringify(r.data))
})()
