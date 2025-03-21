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
  '50': '#fbf6f5',
  '100': '#f8eae8',
  '200': '#f2d9d6',
  '300': '#e9bdb8',
  '400': '#da978f',
  '500': '#c9746a',
  '600': '#ba685e',
  '700': '#96483f',
  '800': '#7d3f37',
  '900': '#693933',
  '950': '#381b17',
}

console.log(convertHexToTailwindRgb(colorObject, 'primary', 'light'))
