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

export function isSvgAssetUrl(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return normalized.split("?", 1)[0]?.endsWith(".svg") ?? false;
}

export function isSvgFile(file: Pick<File, "name" | "type">) {
  return file.type === "image/svg+xml" || file.name.trim().toLowerCase().endsWith(".svg");
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

/**
 * YouTube / Vimeo の各種URLを埋め込み用URLに変換する。
 * 対応外URLは null を返す（呼び出し側でリンク表示にフォールバック）。
 */
export function toVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube.com${u.pathname}`;
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return u.href;
    return null;
  } catch {
    return null;
  }
}
