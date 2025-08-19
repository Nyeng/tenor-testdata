import { generateAccessToken } from '../src/maskinporten/maskinporten.js';
import http from 'k6/http';

function hentTestdata() {
  const scopes = 'skatteetaten:testnorge/testdata.read';
  const token = generateAccessToken(scopes);
  console.log(token);

  const url =
    // eslint-disable-next-line max-len
    'https://testdata.api.skatteetaten.no/api/testnorge/v2/soek/brreg-er-fr?kql=organisasjonsform.kode:AS&highlight=true&vis=navn,visningnavn,tenorMetadata';
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  let res;

  try {
    res = http.get(url, { headers });
  } catch (err) {
    console.error('HTTP request failed:', JSON.stringify(err, null, 2));
    return;
  }

  if (!res) {
    console.error('Response is null');
    return;
  }
}

export default function () {
  hentTestdata();
}
