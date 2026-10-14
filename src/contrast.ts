// mostly copied from
// https://stackoverflow.com/questions/9733288/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors
// https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-procedure

const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;

const GAMMA = 2.4;

type Rgb = [number, number, number];

export const luminance = (color: Rgb) => {
  const a = color.map((v) => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, GAMMA);
  });
  return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
};

export const contrast = (rgb1: Rgb, rgb2: Rgb) => {
  const lum1 = luminance(rgb1);
  const lum2 = luminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

const hex_to_numbers = (hex_string: string) => {
    // splits the string into segments of two including a remainder => {1,2}
    const tokens = hex_string.match(/[0-9a-z]{2}/gi);
    return tokens?.map(t => parseInt(t, 16));
}

export const string_to_rgb = (str: string) : Rgb | null => {
    const arr = hex_to_numbers(str);
    if(arr?.length !== 3) return null;
    return [arr[0], arr[1], arr[2]];
};