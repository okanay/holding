type HexColorObject = {
  [key: string]: string
}

type ColorMode = 'light' | 'dark'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function convertHexToTailwindRgb(
  hexObject: HexColorObject,
  prefix: string = 'primary',
  mode: ColorMode = 'light',
): string {
  let output = ''

  const sortedKeys = Object.keys(hexObject).sort(
    (a, b) => Number(a) - Number(b),
  )

  sortedKeys.forEach((key, index) => {
    const hexValue = hexObject[key]
    const rgb = hexToRgb(hexValue)
    if (rgb) {
      const colorKey =
        mode === 'dark' ? sortedKeys[sortedKeys.length - 1 - index] : key
      output += `--${prefix}-${colorKey}: ${rgb.r} ${rgb.g} ${rgb.b};\n`
    }
  })

  return output
}

// Örnek kullanım
const colorObject: HexColorObject = {
  '50': '#f2f7f2',
  '100': '#e2eae1',
  '200': '#c4d6c4',
  '300': '#9cb99d',
  '400': '#719675',
  '500': '#5c8a62',
  '600': '#3c5f41',
  '700': '#304c35',
  '800': '#283d2c',
  '900': '#213324',
  '950': '#121c15',
}

console.log(convertHexToTailwindRgb(colorObject, 'primary', 'light'))
