import SearchableSelect from '../packages/searchable-select.js'

declare global {
  interface Window {
    CountrySelectInput: SearchableSelect
    SetCountryNameOptions: (defaultValue: string, language: string) => void
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const CountrySelectInput = new SearchableSelect({
    elements: {
      container: 'country-container',
      select: 'country-select-input',
      input: 'country-search-input',
      suggestions: 'country-suggestions',
      clearButton: 'clear-button',
    },
  })

  window.CountrySelectInput = CountrySelectInput

  // SetCountryNameOptions fonksiyonunu yeniden tanımla
  window.SetCountryNameOptions = (defaultValue, language) => {
    const codes = language.toLowerCase() === 'tr' ? trCodes : enCodes

    // Ülke seçeneklerini güncelle
    window.CountrySelectInput.updateOptions(
      codes.map(code => ({ text: code.name, value: code.value })),
    )

    window.CountrySelectInput.setValue(defaultValue.toUpperCase())
  }

  // CountrySelectInput hazır olduğunda özel bir event tetikle
  window.dispatchEvent(new CustomEvent('CountrySelectReady'))
})

const enCodes = [
  { name: 'Afghanistan', value: 'AF' },
  { name: 'Åland Islands', value: 'AX' },
  { name: 'Albania', value: 'AL' },
  { name: 'Algeria', value: 'DZ' },
  { name: 'American Samoa', value: 'AS' },
  { name: 'Andorra', value: 'AD' },
  { name: 'Angola', value: 'AO' },
  { name: 'Anguilla', value: 'AI' },
  { name: 'Antarctica', value: 'AQ' },
  { name: 'Antigua and Barbuda', value: 'AG' },
  { name: 'Argentina', value: 'AR' },
  { name: 'Armenia', value: 'AM' },
  { name: 'Aruba', value: 'AW' },
  { name: 'Australia', value: 'AU' },
  { name: 'Austria', value: 'AT' },
  { name: 'Azerbaijan', value: 'AZ' },
  { name: 'Bahamas', value: 'BS' },
  { name: 'Bahrain', value: 'BH' },
  { name: 'Bangladesh', value: 'BD' },
  { name: 'Barbados', value: 'BB' },
  { name: 'Belarus', value: 'BY' },
  { name: 'Belgium', value: 'BE' },
  { name: 'Belize', value: 'BZ' },
  { name: 'Benin', value: 'BJ' },
  { name: 'Bermuda', value: 'BM' },
  { name: 'Bhutan', value: 'BT' },
  { name: 'Bolivia', value: 'BO' },
  { name: 'Bosnia and Herzegovina', value: 'BA' },
  { name: 'Botswana', value: 'BW' },
  { name: 'Bouvet Island', value: 'BV' },
  { name: 'Brazil', value: 'BR' },
  { name: 'British Indian Ocean Territory', value: 'IO' },
  { name: 'Brunei Darussalam', value: 'BN' },
  { name: 'Bulgaria', value: 'BG' },
  { name: 'Burkina Faso', value: 'BF' },
  { name: 'Burundi', value: 'BI' },
  { name: 'Cambodia', value: 'KH' },
  { name: 'Cameroon', value: 'CM' },
  { name: 'Canada', value: 'CA' },
  { name: 'Cape Verde', value: 'CV' },
  { name: 'Cayman Islands', value: 'KY' },
  { name: 'Central African Republic', value: 'CF' },
  { name: 'Chad', value: 'TD' },
  { name: 'Chile', value: 'CL' },
  { name: 'China', value: 'CN' },
  { name: 'Christmas Island', value: 'CX' },
  { name: 'Cocos (Keeling) Islands', value: 'CC' },
  { name: 'Colombia', value: 'CO' },
  { name: 'Comoros', value: 'KM' },
  { name: 'Congo', value: 'CG' },
  { name: 'Congo, The Democratic Republic of the', value: 'CD' },
  { name: 'Cook Islands', value: 'CK' },
  { name: 'Costa Rica', value: 'CR' },
  { name: "Cote D'Ivoire", value: 'CI' },
  { name: 'Croatia', value: 'HR' },
  { name: 'Cuba', value: 'CU' },
  { name: 'Cyprus', value: 'CY' },
  { name: 'Czech Republic', value: 'CZ' },
  { name: 'Denmark', value: 'DK' },
  { name: 'Djibouti', value: 'DJ' },
  { name: 'Dominica', value: 'DM' },
  { name: 'Dominican Republic', value: 'DO' },
  { name: 'Ecuador', value: 'EC' },
  { name: 'Egypt', value: 'EG' },
  { name: 'El Salvador', value: 'SV' },
  { name: 'Equatorial Guinea', value: 'GQ' },
  { name: 'Eritrea', value: 'ER' },
  { name: 'Estonia', value: 'EE' },
  { name: 'Ethiopia', value: 'ET' },
  { name: 'Falkland Islands (Malvinas)', value: 'FK' },
  { name: 'Faroe Islands', value: 'FO' },
  { name: 'Fiji', value: 'FJ' },
  { name: 'Finland', value: 'FI' },
  { name: 'France', value: 'FR' },
  { name: 'French Guiana', value: 'GF' },
  { name: 'French Polynesia', value: 'PF' },
  { name: 'French Southern Territories', value: 'TF' },
  { name: 'Gabon', value: 'GA' },
  { name: 'Gambia', value: 'GM' },
  { name: 'Georgia', value: 'GE' },
  { name: 'Germany', value: 'DE' },
  { name: 'Ghana', value: 'GH' },
  { name: 'Gibraltar', value: 'GI' },
  { name: 'Greece', value: 'GR' },
  { name: 'Greenland', value: 'GL' },
  { name: 'Grenada', value: 'GD' },
  { name: 'Guadeloupe', value: 'GP' },
  { name: 'Guam', value: 'GU' },
  { name: 'Guatemala', value: 'GT' },
  { name: 'Guernsey', value: 'GG' },
  { name: 'Guinea', value: 'GN' },
  { name: 'Guinea-Bissau', value: 'GW' },
  { name: 'Guyana', value: 'GY' },
  { name: 'Haiti', value: 'HT' },
  { name: 'Heard Island and Mcdonald Islands', value: 'HM' },
  { name: 'Holy See (Vatican City State)', value: 'VA' },
  { name: 'Honduras', value: 'HN' },
  { name: 'Hong Kong', value: 'HK' },
  { name: 'Hungary', value: 'HU' },
  { name: 'Iceland', value: 'IS' },
  { name: 'India', value: 'IN' },
  { name: 'Indonesia', value: 'ID' },
  { name: 'Iran, Islamic Republic Of', value: 'IR' },
  { name: 'Iraq', value: 'IQ' },
  { name: 'Ireland', value: 'IE' },
  { name: 'Isle of Man', value: 'IM' },
  { name: 'Israel', value: 'IL' },
  { name: 'Italy', value: 'IT' },
  { name: 'Jamaica', value: 'JM' },
  { name: 'Japan', value: 'JP' },
  { name: 'Jersey', value: 'JE' },
  { name: 'Jordan', value: 'JO' },
  { name: 'Kazakhstan', value: 'KZ' },
  { name: 'Kenya', value: 'KE' },
  { name: 'Kiribati', value: 'KI' },
  { name: "Korea, Democratic People'S Republic of", value: 'KP' },
  { name: 'Korea, Republic of', value: 'KR' },
  { name: 'Kuwait', value: 'KW' },
  { name: 'Kyrgyzstan', value: 'KG' },
  { name: "Lao People'S Democratic Republic", value: 'LA' },
  { name: 'Latvia', value: 'LV' },
  { name: 'Lebanon', value: 'LB' },
  { name: 'Lesotho', value: 'LS' },
  { name: 'Liberia', value: 'LR' },
  { name: 'Libyan Arab Jamahiriya', value: 'LY' },
  { name: 'Liechtenstein', value: 'LI' },
  { name: 'Lithuania', value: 'LT' },
  { name: 'Luxembourg', value: 'LU' },
  { name: 'Macao', value: 'MO' },
  { name: 'Macedonia, The Former Yugoslav Republic of', value: 'MK' },
  { name: 'Madagascar', value: 'MG' },
  { name: 'Malawi', value: 'MW' },
  { name: 'Malaysia', value: 'MY' },
  { name: 'Maldives', value: 'MV' },
  { name: 'Mali', value: 'ML' },
  { name: 'Malta', value: 'MT' },
  { name: 'Marshall Islands', value: 'MH' },
  { name: 'Martinique', value: 'MQ' },
  { name: 'Mauritania', value: 'MR' },
  { name: 'Mauritius', value: 'MU' },
  { name: 'Mayotte', value: 'YT' },
  { name: 'Mexico', value: 'MX' },
  { name: 'Micronesia, Federated States of', value: 'FM' },
  { name: 'Moldova, Republic of', value: 'MD' },
  { name: 'Monaco', value: 'MC' },
  { name: 'Mongolia', value: 'MN' },
  { name: 'Montserrat', value: 'MS' },
  { name: 'Morocco', value: 'MA' },
  { name: 'Mozambique', value: 'MZ' },
  { name: 'Myanmar', value: 'MM' },
  { name: 'Namibia', value: 'NA' },
  { name: 'Nauru', value: 'NR' },
  { name: 'Nepal', value: 'NP' },
  { name: 'Netherlands', value: 'NL' },
  { name: 'Netherlands Antilles', value: 'AN' },
  { name: 'New Caledonia', value: 'NC' },
  { name: 'New Zealand', value: 'NZ' },
  { name: 'Nicaragua', value: 'NI' },
  { name: 'Niger', value: 'NE' },
  { name: 'Nigeria', value: 'NG' },
  { name: 'Niue', value: 'NU' },
  { name: 'Norfolk Island', value: 'NF' },
  { name: 'Northern Mariana Islands', value: 'MP' },
  { name: 'Norway', value: 'NO' },
  { name: 'Oman', value: 'OM' },
  { name: 'Pakistan', value: 'PK' },
  { name: 'Palau', value: 'PW' },
  { name: 'Palestinian Territory, Occupied', value: 'PS' },
  { name: 'Panama', value: 'PA' },
  { name: 'Papua New Guinea', value: 'PG' },
  { name: 'Paraguay', value: 'PY' },
  { name: 'Peru', value: 'PE' },
  { name: 'Philippines', value: 'PH' },
  { name: 'Pitcairn', value: 'PN' },
  { name: 'Poland', value: 'PL' },
  { name: 'Portugal', value: 'PT' },
  { name: 'Puerto Rico', value: 'PR' },
  { name: 'Qatar', value: 'QA' },
  { name: 'Reunion', value: 'RE' },
  { name: 'Romania', value: 'RO' },
  { name: 'Russian Federation', value: 'RU' },
  { name: 'RWANDA', value: 'RW' },
  { name: 'Saint Helena', value: 'SH' },
  { name: 'Saint Kitts and Nevis', value: 'KN' },
  { name: 'Saint Lucia', value: 'LC' },
  { name: 'Saint Pierre and Miquelon', value: 'PM' },
  { name: 'Saint Vincent and the Grenadines', value: 'VC' },
  { name: 'Samoa', value: 'WS' },
  { name: 'San Marino', value: 'SM' },
  { name: 'Sao Tome and Principe', value: 'ST' },
  { name: 'Saudi Arabia', value: 'SA' },
  { name: 'Senegal', value: 'SN' },
  { name: 'Serbia and Montenegro', value: 'CS' },
  { name: 'Seychelles', value: 'SC' },
  { name: 'Sierra Leone', value: 'SL' },
  { name: 'Singapore', value: 'SG' },
  { name: 'Slovakia', value: 'SK' },
  { name: 'Slovenia', value: 'SI' },
  { name: 'Solomon Islands', value: 'SB' },
  { name: 'Somalia', value: 'SO' },
  { name: 'South Africa', value: 'ZA' },
  { name: 'South Georgia and the South Sandwich Islands', value: 'GS' },
  { name: 'Spain', value: 'ES' },
  { name: 'Sri Lanka', value: 'LK' },
  { name: 'Sudan', value: 'SD' },
  { name: 'Suriname', value: 'SR' },
  { name: 'Svalbard and Jan Mayen', value: 'SJ' },
  { name: 'Swaziland', value: 'SZ' },
  { name: 'Sweden', value: 'SE' },
  { name: 'Switzerland', value: 'CH' },
  { name: 'Syrian Arab Republic', value: 'SY' },
  { name: 'Taiwan, Province of China', value: 'TW' },
  { name: 'Tajikistan', value: 'TJ' },
  { name: 'Tanzania, United Republic of', value: 'TZ' },
  { name: 'Thailand', value: 'TH' },
  { name: 'Timor-Leste', value: 'TL' },
  { name: 'Togo', value: 'TG' },
  { name: 'Tokelau', value: 'TK' },
  { name: 'Tonga', value: 'TO' },
  { name: 'Trinidad and Tobago', value: 'TT' },
  { name: 'Tunisia', value: 'TN' },
  { name: 'Turkey', value: 'TR' },
  { name: 'Turkmenistan', value: 'TM' },
  { name: 'Turks and Caicos Islands', value: 'TC' },
  { name: 'Tuvalu', value: 'TV' },
  { name: 'Uganda', value: 'UG' },
  { name: 'Ukraine', value: 'UA' },
  { name: 'United Arab Emirates', value: 'AE' },
  { name: 'United Kingdom', value: 'GB' },
  { name: 'United States', value: 'US' },
  { name: 'United States Minor Outlying Islands', value: 'UM' },
  { name: 'Uruguay', value: 'UY' },
  { name: 'Uzbekistan', value: 'UZ' },
  { name: 'Vanuatu', value: 'VU' },
  { name: 'Venezuela', value: 'VE' },
  { name: 'Viet Nam', value: 'VN' },
  { name: 'Virgin Islands, British', value: 'VG' },
  { name: 'Virgin Islands, U.S.', value: 'VI' },
  { name: 'Wallis and Futuna', value: 'WF' },
  { name: 'Western Sahara', value: 'EH' },
  { name: 'Yemen', value: 'YE' },
  { name: 'Zambia', value: 'ZM' },
  { name: 'Zimbabwe', value: 'ZW' },
]

const trCodes = [
  {
    name: 'ABD Virgin Adaları',
    value: 'VI',
  },
  {
    name: 'Aland Adaları',
    value: 'AX',
  },
  {
    name: 'Almanya',
    value: 'DE',
  },
  {
    name: 'Amerika Birleşik Devletleri',
    value: 'US',
  },
  {
    name: 'Andora',
    value: 'AD',
  },
  {
    name: 'Angola',
    value: 'AO',
  },
  {
    name: 'Anguilla',
    value: 'AI',
  },
  {
    name: 'Antarktika',
    value: 'AQ',
  },
  {
    name: 'Antigua ve Barbuda',
    value: 'AG',
  },
  {
    name: 'Arjantin',
    value: 'AR',
  },
  {
    name: 'Arnavutluk',
    value: 'AL',
  },
  {
    name: 'Aruba',
    value: 'AW',
  },
  {
    name: 'Avustralya',
    value: 'AU',
  },
  {
    name: 'Avusturya',
    value: 'AT',
  },
  {
    name: 'Azerbaycan',
    value: 'AZ',
  },
  {
    name: 'Bahamalar',
    value: 'BS',
  },
  {
    name: 'Bahreyn',
    value: 'BH',
  },
  {
    name: 'Bangladeş',
    value: 'BD',
  },
  {
    name: 'Barbados',
    value: 'BB',
  },
  {
    name: 'Belize',
    value: 'BZ',
  },
  {
    name: 'Belçika',
    value: 'BE',
  },
  {
    name: 'Benin',
    value: 'BJ',
  },
  {
    name: 'Bermuda',
    value: 'BM',
  },
  {
    name: 'Beyaz Rusya',
    value: 'BY',
  },
  {
    name: 'Bhutan',
    value: 'BT',
  },
  {
    name: 'Birleşik Arap Emirlikleri',
    value: 'AE',
  },
  {
    name: 'Birleşik Krallık',
    value: 'GB',
  },
  {
    name: 'Bolivya',
    value: 'BO',
  },
  {
    name: 'Bosna Hersek',
    value: 'BA',
  },
  {
    name: 'Botsvana',
    value: 'BW',
  },
  {
    name: 'Brezilya',
    value: 'BR',
  },
  {
    name: 'Brunei',
    value: 'BN',
  },
  {
    name: 'Bulgaristan',
    value: 'BG',
  },
  {
    name: 'Burkina Faso',
    value: 'BF',
  },
  {
    name: 'Burundi',
    value: 'BI',
  },
  {
    name: 'Cape Verde',
    value: 'CV',
  },
  {
    name: 'Cebelitarık',
    value: 'GI',
  },
  {
    name: 'Cezayir',
    value: 'DZ',
  },
  {
    name: 'Christmas Adası',
    value: 'CX',
  },
  {
    name: 'Cibuti',
    value: 'DJ',
  },
  {
    name: 'Cocos Adaları',
    value: 'CC',
  },
  {
    name: 'Cook Adaları',
    value: 'CK',
  },
  {
    name: 'Çad',
    value: 'TD',
  },
  {
    name: 'Çek Cumhuriyeti',
    value: 'CZ',
  },
  {
    name: 'Çin',
    value: 'CN',
  },
  {
    name: 'Danimarka',
    value: 'DK',
  },
  {
    name: 'Dominik',
    value: 'DM',
  },
  {
    name: 'Dominik Cumhuriyeti',
    value: 'DO',
  },
  {
    name: 'Doğu Timor',
    value: 'TL',
  },
  {
    name: 'Ekvator',
    value: 'EC',
  },
  {
    name: 'Ekvator Ginesi',
    value: 'GQ',
  },
  {
    name: 'El Salvador',
    value: 'SV',
  },
  {
    name: 'Endonezya',
    value: 'ID',
  },
  {
    name: 'Eritre',
    value: 'ER',
  },
  {
    name: 'Ermenistan',
    value: 'AM',
  },
  {
    name: 'Estonya',
    value: 'EE',
  },
  {
    name: 'Etiyopya',
    value: 'ET',
  },
  {
    name: 'Falkland Adaları (Malvinalar)',
    value: 'FK',
  },
  {
    name: 'Faroe Adaları',
    value: 'FO',
  },
  {
    name: 'Fas',
    value: 'MA',
  },
  {
    name: 'Fiji',
    value: 'FJ',
  },
  {
    name: 'Fildişi Sahilleri',
    value: 'CI',
  },
  {
    name: 'Filipinler',
    value: 'PH',
  },
  {
    name: 'Filistin Bölgesi',
    value: 'PS',
  },
  {
    name: 'Finlandiya',
    value: 'FI',
  },
  {
    name: 'Fransa',
    value: 'FR',
  },
  {
    name: 'Fransız Guyanası',
    value: 'GF',
  },
  {
    name: 'Fransız Polinezyası',
    value: 'PF',
  },
  {
    name: 'Gabon',
    value: 'GA',
  },
  {
    name: 'Gambia',
    value: 'GM',
  },
  {
    name: 'Gana',
    value: 'GH',
  },
  {
    name: 'Gine',
    value: 'GN',
  },
  {
    name: 'Gine-Bissau',
    value: 'GW',
  },
  {
    name: 'Granada',
    value: 'GD',
  },
  {
    name: 'Grönland',
    value: 'GL',
  },
  {
    name: 'Guadeloupe',
    value: 'GP',
  },
  {
    name: 'Guam',
    value: 'GU',
  },
  {
    name: 'Guatemala',
    value: 'GT',
  },
  {
    name: 'Guernsey',
    value: 'GG',
  },
  {
    name: 'Guyana',
    value: 'GY',
  },
  {
    name: 'Güney Afrika',
    value: 'ZA',
  },
  {
    name: 'Güney Georgia ve Güney Sandwich Adaları',
    value: 'GS',
  },
  {
    name: 'Güney Kore',
    value: 'KR',
  },
  {
    name: 'Güney Kıbrıs Rum Kesimi',
    value: 'CY',
  },
  {
    name: 'Gürcistan',
    value: 'GE',
  },
  {
    name: 'Haiti',
    value: 'HT',
  },
  {
    name: 'Hindistan',
    value: 'IN',
  },
  {
    name: 'Hint Okyanusu İngiliz Bölgesi',
    value: 'IO',
  },
  {
    name: 'Hollanda',
    value: 'NL',
  },
  {
    name: 'Hollanda Antilleri',
    value: 'AN',
  },
  {
    name: 'Honduras',
    value: 'HN',
  },
  {
    name: 'Hong Kong SAR - Çin',
    value: 'HK',
  },
  {
    name: 'Hırvatistan',
    value: 'HR',
  },
  {
    name: 'Irak',
    value: 'IQ',
  },
  {
    name: 'İngiliz Virgin Adaları',
    value: 'VG',
  },
  {
    name: 'İran',
    value: 'IR',
  },
  {
    name: 'İrlanda',
    value: 'IE',
  },
  {
    name: 'İspanya',
    value: 'ES',
  },
  {
    name: 'İsrail',
    value: 'IL',
  },
  {
    name: 'İsveç',
    value: 'SE',
  },
  {
    name: 'İsviçre',
    value: 'CH',
  },
  {
    name: 'İtalya',
    value: 'IT',
  },
  {
    name: 'İzlanda',
    value: 'IS',
  },
  {
    name: 'Jamaika',
    value: 'JM',
  },
  {
    name: 'Japonya',
    value: 'JP',
  },
  {
    name: 'Jersey',
    value: 'JE',
  },
  {
    name: 'Kamboçya',
    value: 'KH',
  },
  {
    name: 'Kamerun',
    value: 'CM',
  },
  {
    name: 'Kanada',
    value: 'CA',
  },
  {
    name: 'Karadağ',
    value: 'ME',
  },
  {
    name: 'Katar',
    value: 'QA',
  },
  {
    name: 'Kayman Adaları',
    value: 'KY',
  },
  {
    name: 'Kazakistan',
    value: 'KZ',
  },
  {
    name: 'Kenya',
    value: 'KE',
  },
  {
    name: 'Kiribati',
    value: 'KI',
  },
  {
    name: 'Kolombiya',
    value: 'CO',
  },
  {
    name: 'Komorlar',
    value: 'KM',
  },
  {
    name: 'Kongo',
    value: 'CG',
  },
  {
    name: 'Kongo Demokratik Cumhuriyeti',
    value: 'CD',
  },
  {
    name: 'Kosta Rika',
    value: 'CR',
  },
  {
    name: 'Kuveyt',
    value: 'KW',
  },
  {
    name: 'Kuzey Kore',
    value: 'KP',
  },
  {
    name: 'Kuzey Mariana Adaları',
    value: 'MP',
  },
  {
    name: 'Küba',
    value: 'CU',
  },
  {
    name: 'Kırgızistan',
    value: 'KG',
  },
  {
    name: 'Laos',
    value: 'LA',
  },
  {
    name: 'Lesotho',
    value: 'LS',
  },
  {
    name: 'Letonya',
    value: 'LV',
  },
  {
    name: 'Liberya',
    value: 'LR',
  },
  {
    name: 'Libya',
    value: 'LY',
  },
  {
    name: 'Liechtenstein',
    value: 'LI',
  },
  {
    name: 'Litvanya',
    value: 'LT',
  },
  {
    name: 'Lübnan',
    value: 'LB',
  },
  {
    name: 'Lüksemburg',
    value: 'LU',
  },
  {
    name: 'Macaristan',
    value: 'HU',
  },
  {
    name: 'Madagaskar',
    value: 'MG',
  },
  {
    name: 'Makao S.A.R. Çin',
    value: 'MO',
  },
  {
    name: 'Makedonya',
    value: 'MK',
  },
  {
    name: 'Malavi',
    value: 'MW',
  },
  {
    name: 'Maldivler',
    value: 'MV',
  },
  {
    name: 'Malezya',
    value: 'MY',
  },
  {
    name: 'Mali',
    value: 'ML',
  },
  {
    name: 'Malta',
    value: 'MT',
  },
  {
    name: 'Man Adası',
    value: 'IM',
  },
  {
    name: 'Marshall Adaları',
    value: 'MH',
  },
  {
    name: 'Martinik',
    value: 'MQ',
  },
  {
    name: 'Mauritius',
    value: 'MU',
  },
  {
    name: 'Mayotte',
    value: 'YT',
  },
  {
    name: 'Meksika',
    value: 'MX',
  },
  {
    name: 'Mikronezya Federal Eyaletleri',
    value: 'FM',
  },
  {
    name: 'Moldovya Cumhuriyeti',
    value: 'MD',
  },
  {
    name: 'Monako',
    value: 'MC',
  },
  {
    name: 'Montserrat',
    value: 'MS',
  },
  {
    name: 'Moritanya',
    value: 'MR',
  },
  {
    name: 'Mozambik',
    value: 'MZ',
  },
  {
    name: 'Moğolistan',
    value: 'MN',
  },
  {
    name: 'Myanmar',
    value: 'MM',
  },
  {
    name: 'Mısır',
    value: 'EG',
  },
  {
    name: 'Namibya',
    value: 'NA',
  },
  {
    name: 'Nauru',
    value: 'NR',
  },
  {
    name: 'Nepal',
    value: 'NP',
  },
  {
    name: 'Nijer',
    value: 'NE',
  },
  {
    name: 'Nijerya',
    value: 'NG',
  },
  {
    name: 'Nikaragua',
    value: 'NI',
  },
  {
    name: 'Niue',
    value: 'NU',
  },
  {
    name: 'Norfolk Adası',
    value: 'NF',
  },
  {
    name: 'Norveç',
    value: 'NO',
  },
  {
    name: 'Orta Afrika Cumhuriyeti',
    value: 'CF',
  },
  {
    name: 'Özbekistan',
    value: 'UZ',
  },
  {
    name: 'Pakistan',
    value: 'PK',
  },
  {
    name: 'Palau',
    value: 'PW',
  },
  {
    name: 'Panama',
    value: 'PA',
  },
  {
    name: 'Papua Yeni Gine',
    value: 'PG',
  },
  {
    name: 'Paraguay',
    value: 'PY',
  },
  {
    name: 'Peru',
    value: 'PE',
  },
  {
    name: 'Pitcairn',
    value: 'PN',
  },
  {
    name: 'Polonya',
    value: 'PL',
  },
  {
    name: 'Portekiz',
    value: 'PT',
  },
  {
    name: 'Porto Riko',
    value: 'PR',
  },
  {
    name: 'Reunion',
    value: 'RE',
  },
  {
    name: 'Romanya',
    value: 'RO',
  },
  {
    name: 'Ruanda',
    value: 'RW',
  },
  {
    name: 'Rusya Federasyonu',
    value: 'RU',
  },
  {
    name: 'Samoa',
    value: 'WS',
  },
  {
    name: 'San Marino',
    value: 'SM',
  },
  {
    name: 'Sao Tome ve Principe',
    value: 'ST',
  },
  {
    name: 'Senegal',
    value: 'SN',
  },
  {
    name: 'Seyşeller',
    value: 'SC',
  },
  {
    name: 'Sierra Leone',
    value: 'SL',
  },
  {
    name: 'Singapur',
    value: 'SG',
  },
  {
    name: 'Slovakya',
    value: 'SK',
  },
  {
    name: 'Slovenya',
    value: 'SI',
  },
  {
    name: 'Solomon Adaları',
    value: 'SB',
  },
  {
    name: 'Somali',
    value: 'SO',
  },
  {
    name: 'Sri Lanka',
    value: 'LK',
  },
  {
    name: 'Sudan',
    value: 'SD',
  },
  {
    name: 'Surinam',
    value: 'SR',
  },
  {
    name: 'Suriye',
    value: 'SY',
  },
  {
    name: 'Suudi Arabistan',
    value: 'SA',
  },
  {
    name: 'Svalbard ve Jan Mayen',
    value: 'SJ',
  },
  {
    name: 'Svaziland',
    value: 'SZ',
  },
  {
    name: 'Sırbistan',
    value: 'RS',
  },
  {
    name: 'Şili',
    value: 'CL',
  },
  {
    name: 'Tacikistan',
    value: 'TJ',
  },
  {
    name: 'Tanzanya',
    value: 'TZ',
  },
  {
    name: 'Tayland',
    value: 'TH',
  },
  {
    name: 'Tayvan',
    value: 'TW',
  },
  {
    name: 'Togo',
    value: 'TG',
  },
  {
    name: 'Tokelau',
    value: 'TK',
  },
  {
    name: 'Tonga',
    value: 'TO',
  },
  {
    name: 'Trinidad ve Tobago',
    value: 'TT',
  },
  {
    name: 'Tunus',
    value: 'TN',
  },
  {
    name: 'Turks ve Caicos Adaları',
    value: 'TC',
  },
  {
    name: 'Tuvalu',
    value: 'TV',
  },
  {
    name: 'Türkiye',
    value: 'TR',
  },
  {
    name: 'Türkmenistan',
    value: 'TM',
  },
  {
    name: 'Uganda',
    value: 'UG',
  },
  {
    name: 'Ukrayna',
    value: 'UA',
  },
  {
    name: 'Umman',
    value: 'OM',
  },
  {
    name: 'Uruguay',
    value: 'UY',
  },
  {
    name: 'Ürdün',
    value: 'JO',
  },
  {
    name: 'Vanuatu',
    value: 'VU',
  },
  {
    name: 'Vatikan',
    value: 'VA',
  },
  {
    name: 'Venezuela',
    value: 'VE',
  },
  {
    name: 'Vietnam',
    value: 'VN',
  },
  {
    name: 'Wallis ve Futuna',
    value: 'WF',
  },
  {
    name: 'Yemen',
    value: 'YE',
  },
  {
    name: 'Yeni Kaledonya',
    value: 'NC',
  },
  {
    name: 'Yeni Zelanda',
    value: 'NZ',
  },
  {
    name: 'Yunanistan',
    value: 'GR',
  },
  {
    name: 'Zambiya',
    value: 'ZM',
  },
  {
    name: 'Zimbabve',
    value: 'ZW',
  },
]
