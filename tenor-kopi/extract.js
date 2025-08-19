import { check } from 'k6';

/**
 * Extracts the first organisasjonsnummer from a parsed Tenor response for a given role
 *
 * @param {object} responseJson - Response from `searchTenor`
 * @param {string} role - Rollekode (e.g. 'REVI')
 * @returns {string|null} - 9-digit organisasjonsnummer or null
 */
export function hentOrgnummerForRolle(responseJson, role = 'REVI') {
  const dokument = responseJson?.dokumentListe?.[0];
  if (!dokument) {
    console.warn('Ingen dokumenter funnet');
    return null;
  }

  const kildedata = JSON.parse(dokument.tenorMetadata.kildedata);
  const rollegrupper = kildedata.rollegrupper || [];

  for (const gruppe of rollegrupper) {
    if (gruppe.type?.kode === role) {
      for (const rolle of gruppe.roller || []) {
        const raw = JSON.stringify(rolle.virksomhet || {});
        const match = raw.match(/\b\d{9}\b/);
        if (match) {
          const orgnummer = match[0];
          check(orgnummer, {
            [`Fant 9-sifret orgnummer for ${role}`]: (v) => /^\d{9}$/.test(v),
          });
          return orgnummer;
        }
      }
    }
  }

  console.warn(`Ingen organisasjonsnummer funnet for rolle: ${role}`);
  return null;
}

/**
 * Extracts the fødselsnummer for the DAGL (daglig leder) role
 *
 * @param {object} responseJson - Response from `searchTenor`
 * @param maxAntall
 * @returns {*[]} - Fødselsnummer or null
 */
export function hentFoedselsnummerForDagligLeder(responseJson, maxAntall = 1) {
  const dokumentListe = responseJson?.dokumentListe || [];
  const fnrListe = [];

  for (const dokument of dokumentListe) {
    let kildedata;
    try {
      kildedata = JSON.parse(dokument.tenorMetadata.kildedata);
    } catch (err) {
      console.warn('Ugyldig kildedata i dokument, hopper over', err);
      continue;
    }

    const rollegrupper = kildedata.rollegrupper || [];

    for (const gruppe of rollegrupper) {
      if (gruppe.type?.kode === 'DAGL') {
        for (const rolle of gruppe.roller || []) {
          const fnr = rolle.person?.foedselsnummer;
          if (fnr) {
            fnrListe.push(fnr);
            if (fnrListe.length >= maxAntall) {
              return fnrListe;
            }
          }
        }
      }
    }
  }

  if (fnrListe.length === 0) {
    console.log('Ingen fødselsnummer for DAGL funnet');
  }

  return fnrListe;
}

/**
 * Extracts organisasjonsnummer og navn fra alle dokumenter i Tenor-responsen.
 *
 * @param {object} responseJson - Response from `searchTenor`
 * @returns {Array<{ organisasjonsnummer: string, navn: string }>}
 */
export function hentVirksomheterFraKildedata(responseJson) {
  const dokumenter = responseJson?.dokumentListe || [];
  const resultater = [];

  for (const dokument of dokumenter) {
    try {
      const kildedata = JSON.parse(dokument.tenorMetadata.kildedata);
      const orgnr = kildedata.organisasjonsnummer;
      const navn = kildedata.navn;

      if (/^\d{9}$/.test(orgnr) && typeof navn === 'string') {
        resultater.push({ organisasjonsnummer: orgnr, navn });
      } else {
        console.warn(
          'Ugyldig eller manglende organisasjonsnummer/navn i ett dokument',
        );
      }
    } catch (err) {
      console.warn('Feil ved parsing av kildedata i ett dokument:', err);
    }
  }

  return resultater;
}
