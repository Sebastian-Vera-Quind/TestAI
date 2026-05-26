function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function hsvToHex(hue: number, saturation: number, value: number): string {
  const c = value * saturation;
  const hPrime = hue / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hPrime >= 0 && hPrime < 1) {
    rPrime = c;
    gPrime = x;
  } else if (hPrime >= 1 && hPrime < 2) {
    rPrime = x;
    gPrime = c;
  } else if (hPrime >= 2 && hPrime < 3) {
    gPrime = c;
    bPrime = x;
  } else if (hPrime >= 3 && hPrime < 4) {
    gPrime = x;
    bPrime = c;
  } else if (hPrime >= 4 && hPrime < 5) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  const m = value - c;
  const red = Math.round((rPrime + m) * 255);
  const green = Math.round((gPrime + m) * 255);
  const blue = Math.round((bPrime + m) * 255);

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function generateVividRandomColorHex(): string {
  const hue = Math.floor(Math.random() * 360);

  // Keep saturation high while avoiding extreme brightness that looks washed out.
  const saturation = 0.78 + Math.random() * 0.17;
  const value = 0.72 + Math.random() * 0.18;

  return hsvToHex(hue, saturation, value);
}
