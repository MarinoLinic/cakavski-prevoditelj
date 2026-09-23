# Prevoditelj narječja

Statička aplikacija za prijevod između standardnog hrvatskog, čakavskog govora Kvarnera i dalmatinske ikavice. Dalmatinski je mali mješoviti beta profil, a ne prikaz jednog autentičnog mjesnog govora. Prijevod je vođen rječnikom i pravilima, pa rezultat služi kao prijedlog za doradu.

## Pokretanje

```bash
npm test
npm run serve
```

Poslužitelj otvara stranicu na `http://localhost:4173`. Potreban je statički poslužitelj jer se podaci dohvaćaju kao JSON. Aplikacija nema vanjskih biblioteka ni mrežnih zahtjeva za fontove.

## Aktivne datoteke

| Putanja | Uloga |
| --- | --- |
| `index.html`, `styles.css` | sučelje, teme i responzivni prikaz |
| `js/app.js` | povezivanje sučelja, URL-a, prijevoda, primjera, modala i kopiranja |
| `js/translator.js` | rječnički i frazni indeksi, morfologija, pivot i segmenti izlaza |
| `js/alphabets.js` | transliteracija latinice, glagoljice i ćirilice |
| `js/url-state.js` | čitanje i zapis trajnog stanja u adresi |
| `data/cakavian.json` | kanonski čakavski parovi |
| `data/dalmatian.json` | kanonski dalmatinski parovi beta profila |
| `data/samples.json` | dvadeset standardnohrvatskih primjera |
| `tests/*.test.mjs` | testovi kanonskih podataka, prijevoda, URL-a, pisama i primjera |

Oba aktivna rječnika su JSON nizovi istog kanonskog oblika. Svaki red ima točno pet tekstnih polja ovim redom:

```json
[
  { "dialect": "barkun", "standard": "prozor", "note": "", "type": "", "origin": "original" }
]
```

`dialect` i `standard` sadrže po jednu natuknicu, a ne niz inačica. Opisi i dodatne napomene ostaju u `note`. `type` je prazan dok se vrsta riječi ne označi; zasad se koristi samo `particle`. `origin` je `original` za izvorni materijal ili `synthetic` za autorski odnosno kurirani redak. Kad nema sigurnog kratkog standardnog ekvivalenta, `standard` je prazan. Takav redak ostaje vidljiv u rječniku, ali se ne indeksira za prijevod. Aktivni JSON nizovi služe kao kanonski izvori aplikacije.

## Izvori i čišćenje podataka

Čakavski izvor je spremljena kopija stranice [Čakavski rječnik Kvarnera](https://lokalpatrioti-rijeka.com/cakavski-rjecnik/). Uvozna kopija imala je 2080 redaka popisa, od kojih je jedan imao praznu natuknicu. Uključeno je 2079 natuknica; 175 redaka iz četiri fiumanska i talijanska bloka isključeno je, a dodane su 22 stare glave koje ne postoje na novoj stranici. Stari sirovi JSON čuva se zasebno radi podrijetla.

Jednokratne skripte `graveyard/scripts/import-cakavian-html.mjs`, `graveyard/scripts/normalize-dictionary.mjs` i `graveyard/scripts/build-clean-dictionaries.mjs`, izvori `graveyard/data/source-cakavian.json` i `graveyard/data/source-cakavian-legacy.json` te stari test `graveyard/tests/normalize.test.mjs` nalaze se u arhivi. `graveyard/` služi za podrijetlo i provjeru; njegove datoteke nisu dio runtimea. Aktivni skup sadrži 2330 čakavskih redaka, od kojih 290 nema sažet standardni ekvivalent, te 51 dalmatinski redak.

Čišćenje radi NFC normalizaciju, uklanja doslovne `rn` prijelomne artefakte, poveznice i adrese e-pošte, izdvaja uravnotežene zagrade u bilješke te razlaže opise na kratke standardne ekvivalente. Standardne natuknice imaju najviše tri riječi. Ako početni dio tumačenja opisuje predmet ili pojavu umjesto da daje ekvivalent, ni kasniji dijelovi popisa ne postaju prijevodni parovi; cijeli opis ostaje bilješka, a natuknica se prikazuje samo u rječniku. Od čakavskih redaka, 290 nema sažet standardni ekvivalent, 488 imaju bilješku, a najdulja bilješka ima 318 znakova. Duplikata parova nema. Od 2330 čakavskih redaka, 2323 su izvorni, a 7 su kurirane sintetičke dopune. Jedini redak vrste `particle` jest `ši` / `da`. Svih 51 dalmatinskih redaka imaju `origin: "synthetic"`.

Čakavski redci koje je izvor naveo bez strojno čitljive licence ostaju uz navođenje izvora. Dalmatinski beta popis sadrži točno 51 unaprijed naveden par i tri istraživačka izvora navedena u njegovoj povijesti razvoja:

- https://hrcak.srce.hr/file/226040
- https://hrcak.srce.hr/file/51943
- https://testmorepress.unizd.hr/journals/index.php/csi/en/article/view/638

Jezične napomene:

- https://enciklopedija.hr/clanak/cakavsko-narjecje
- https://hrcak.srce.hr/161752

## Prijevod

Jezici su označeni kao `standard`, `cakavian` i `dalmatian`. Prijevod između regionalnih profila prolazi kroz standardni hrvatski. Za dvosmislene čakavske i dalmatinske točne natuknice te fraze indeks pri pokretanju izabire jednu od različitih mogućnosti nasumično. Izbor je stabilan tijekom te sesije, ali se može promijeniti nakon ponovnog učitavanja. Isti ciljni oblik ne bira se dvaput.

Oznaka `type: "particle"` zasad se koristi za afirmativnu česticu `ši` uz standardno `da`. Ona se prevodi samo kada je cijeli unos jedna riječ okružena razmacima ili interpunkcijom. Tako se `da` u rečenici `Mislim da dolazi.` ne prevodi kao čestica.

Čakavski smjer koristi najdulje frazno podudaranje, točne natuknice, ograničene padežne i glagolske paradigme te nekoliko rezervnih nastavaka. Morfologija stvara samo privremene oblike u pregledniku; ne dodaje sintetičke retke u JSON. Gradi se samo za jednočlane zapise bez opisa ili s točnom oznakom kurirane dopune. Kada ista čakavska natuknica ima više standardnih ekvivalenata, njihovi nekurirani oblici ne stvaraju paradigme jer se vrsta riječi i značenje mogu razlikovati. Zatvorene gramatičke riječi, očiti pridjevski parovi i vrlo kratke osnove također se izostavljaju iz imeničkih indeksa. Pravila pokrivaju samo dio pravilnih oblika; glagoli poput `razjaditi se` zasad nedostaju. Buduće dopune mogu poboljšati pravila ili dodati pregledane sintetičke paradigme. Bulk generiranje sintetičkih oblika nije rađeno.

Dalmatinski smjer daje prednost točnim parovima. Ako ih nema, standardno-dalmatinski smjer primjenjuje ograničena pravila za `ije`, `io`, `ao`, `am` i duže infinitive na `-ti`. Kratki oblici na `-ti` ostaju nepromijenjeni kako se česti pridjevi ne bi zamijenili infinitivima. Dalmatinski povratni smjer koristi samo točne parove. Pravila ne razrješavaju u potpunosti padežnu višeznačnost, sintaksu, mjesni izbor riječi ni naglasak. Skupovi nisu akademski validirani.

`inspect` vraća tekst, broj promijenjenih riječi, broj podudaranja i niz segmenata koji pokrivaju cijeli rezultat. Sučelje označuje promijenjene segmente i kopira običan tekst. Rječnički prozori daju pretraživ popis izabranog profila; standardni popis spaja natuknice obaju profila.

## Pisma

Latinica, ćirilica i glagoljica biraju se neovisno na obje strane. Ulaz se prije prijevoda svodi na latinicu, a izlaz se zatim transliterira u odabrano pismo. Glagoljica je prozirna moderna transliteracija, ne povijesni pravopis.

## Adresa i postavke

Stanje prevoditelja uvijek je zapisano u adresi ovim redom:

```text
?from=standard&to=cakavian&fromAlphabet=latin&toAlphabet=latin&theme=dark
```

Valjani jezici su `standard`, `cakavian` i `dalmatian`; valjana pisma su `latin`, `glagolitic` i `cyrillic`; tema je `dark` ili `light`. Nedostajuće ili nevaljane vrijednosti zamjenjuju se zadanim vrijednostima, a pri učitavanju se adresa kanonizira bez promjene putanje ili sidra. Valjana tema u adresi ima prednost pred `localStorage`; bez nje se koriste spremljena tema, postavka sustava, a zatim tamna tema. Povijest preglednika vraća prijašnji odabir jezika, pisma i teme. Tekst i primjer ne spremaju se u adresu.

Postavka označavanja promijenjenih riječi sprema se u `localStorage` pod `prevoditelj-narjecja-highlight` kao `true` ili `false`. Ona se zadržava pri promjeni teksta, jezika, pisma, primjera, teme ili pri kretanju kroz povijest. Ako se trenutno ne mijenja nijedna riječ, gumb se skriva, ali postavka ostaje sačuvana.

## Sučelje, SEO i pristupačnost

Primjeri se biraju jednim središnjim izbornikom ispod naslova. Dva panela dijele glavni prostor; izbornici pisama i jezika otvaraju pristupačan modal. Tema poštuje smanjeno kretanje, a fokusni obrubi su suptilni, ali vidljivi. Broj promijenjenih riječi i oznake rezultata koriste istu boju naglaska.

Stranica ima `lang="hr"`, naslov, opis, Open Graph metapodatke, plavu ikonu, preskočnu poveznicu, oznake obrazaca i `aria-live` status. Kanonski URL namjerno je izostavljen dok domena nije poznata. Statički HTML, CSS i JavaScript izbjegavaju alatni lanac i runtime ovisnosti za malu aplikaciju.
