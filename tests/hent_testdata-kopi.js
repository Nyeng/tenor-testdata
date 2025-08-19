import {searchTenor} from '../src/tenor/search.js';
import {
    hentFoedselsnummerForDagligLeder,
    hentOrgnummerForRolle,
    hentVirksomheterFraKildedata,
} from '../src/tenor/extract.js';

const roleMapper = {
    forretningsfoerer: {
        name: 'forretningsfoerer',
        code: 'FFØR',
        customertype: 'forretningsfoerer',
    },
    revisor: {name: 'revisor', code: 'REVI', customertype: 'revisorer'},
    regnskapsfoerere: {name: 'regnskapsfoerere', code: 'REGN', customertype: 'regnskapsfoerere'},
  
};

function buildQuery(base, orgTypeCode) {
    if (orgTypeCode?.trim()) {
        return encodeURIComponent(
            `${base} AND organisasjonsform.kode:${orgTypeCode.trim()}`,
        );
    }
    return encodeURIComponent(base);
}

function fetchTestdataForOrganisasjonsformkode(
    roleKey,
    organisasjonsform = null,
    antallKunder = 1,
) {
    const type = roleMapper[roleKey];
    if (!type) {
        throw new Error(`Unknown role: ${roleKey}`);
    }
    // 1. Søk etter rolle
    const roleQuery = buildQuery(`${type.name}:*`, organisasjonsform);
    const json = searchTenor({query: roleQuery});
    const orgnummer = hentOrgnummerForRolle(json, type.code);

    // 2. Slå opp orgnummer for å hente daglig leder
    const orgSearch = searchTenor({
        query: `organisasjonsnummer:${orgnummer}`,
        queryIsEncoded: false,
    });

    const foedselsnummer = hentFoedselsnummerForDagligLeder(orgSearch);
    console.log(`Daglig leder: ${foedselsnummer},${orgnummer}`);

    // 3. Søk etter kunder
    const customerQuery = buildQuery(`${type.customertype}:${orgnummer}`);
    const getCustomers = searchTenor({
        query: customerQuery,
        antall: antallKunder,
        includeTenorMetadata: true,
    });

    const virksomheter = hentVirksomheterFraKildedata(getCustomers);
    
    
    for (const v of virksomheter) {
        console.log(`${v.navn}, ${v.navn}, ${v.organisasjonsnummer}`);
    }
}

export function hentListeFoedselsnummerForDagligLeder(responseJson) {
    const dagligeLedere = [];

    for (const dokument of responseJson?.dokumentListe || []) {
        const orgnr = dokument?.tenorMetadata?.id;
        const kildedataStr = dokument?.tenorMetadata?.kildedata;
        if (!orgnr || !kildedataStr) continue;

        let kildedata;
        try {
            kildedata = JSON.parse(kildedataStr);
        } catch (e) {
            console.warn(`Feil ved parsing av kildedata for ${orgnr}:`, e);
            continue;
        }

        const organisasjonsnavn = kildedata?.navn;
        const rollegrupper = kildedata?.rollegrupper || [];

        for (const gruppe of rollegrupper) {
            if (gruppe.type?.kode === 'DAGL') {
                for (const rolle of gruppe.roller || []) {
                    const fnr = rolle.person?.foedselsnummer;
                    if (fnr) {
                        dagligeLedere.push({
                            organisasjonsnummer: orgnr,
                            organisasjonsnavn: organisasjonsnavn,
                            foedselsnummer: fnr,
                        });
                    }
                }
            }
        }
    }

    return dagligeLedere;
}

function hentDagligLeder(antall) {
    const query = buildQuery('dagligLeder:*');
    //AND organisasjonsform.beskrivelse: Enkeltpersonforetak
    const dagligeLedere = searchTenor({
        query: query,
        queryIsEncoded: false,
        antall: antall,
    });
    return hentListeFoedselsnummerForDagligLeder(dagligeLedere);
}

export default function () {
    fetchTestdataForOrganisasjonsformkode('forretningsfoerer', 'BRL', 5);
    // const dagligLeder = hentDagligLeder(1);
    // console.log(dagligLeder);
}
