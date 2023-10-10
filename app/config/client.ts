import { BuildConfig, getBuildConfig } from "./build";

export function getClientConfig() {
  if (typeof document !== "undefined") {
    // client side
    console.log('queryMeta("config"):', queryMeta("config"));
    if (!queryMeta("config")) {
      return {
        version: "v2.9.5",
        commitDate: "1696927060000",
        commitHash: "aedccd1c2382a5a37bb22ec0e1d6d8d9c2fa60bb",
        buildMode: "standalone",
        isApp: false,
      };
    }
    return JSON.parse(queryMeta("config")) as BuildConfig;
  }

  if (typeof process !== "undefined") {
    // server side
    return getBuildConfig();
  }
}

function queryMeta(key: string, defaultValue?: string): string {
  let ret: string;
  if (document) {
    const meta = document.head.querySelector(
      `meta[name='${key}']`,
    ) as HTMLMetaElement;
    ret = meta?.content ?? "";
  } else {
    ret = defaultValue ?? "";
  }

  return ret;
}
