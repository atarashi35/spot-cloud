export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function toShortDescription(value: string) {
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}

export const prefecturePattern =
  /(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/;

export function splitAddress(address: string) {
  const normalized = address.trim();

  if (!normalized) {
    return {
      prefecture: "",
      city: ""
    };
  }

  const prefectureMatch = normalized.match(prefecturePattern);
  const prefecture = prefectureMatch?.[0] ?? "";

  if (!prefecture) {
    const chunks = normalized.split(/\s+/);
    return {
      prefecture: chunks[0] ?? "",
      city: chunks[1] ?? ""
    };
  }

  const rest = normalized.slice(prefecture.length);
  let city = "";

  const designatedCityMatch = rest.match(/^.+?市.+?区/);
  if (designatedCityMatch) {
    city = designatedCityMatch[0];
  } else {
    const districtMatch = rest.match(/^.+?郡.+?[町村]/);
    if (districtMatch) {
      city = districtMatch[0];
    } else {
      const basicCityMatch = rest.match(/^.+?[市区町村]/);
      city = basicCityMatch?.[0] ?? "";
    }
  }

  return {
    prefecture,
    city
  };
}
