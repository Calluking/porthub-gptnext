const env = process.env.NODE_ENV;
let BASE_URL = "https://dev-api.porthub.app";
// const token = 'f14bba22dce1b55c0c10c6d3e614ce4769a52ab4'

console.log("env:", env);
console.log("location.href:", location.href);

if (env === "production") {
  BASE_URL = "https://api.porthub.app";
}

function getQueryString(name: string) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) {
    return unescape(r[2]);
  }
  return null;
}

const token = getQueryString("token");
console.log("token:", token);

export const getChatStore = async () => {
  const res = await fetch(`${BASE_URL}/xxx`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  console.log(res);
};

export const getPromptStoreRequest = async () => {
  const res = await fetch(`${BASE_URL}/namecards/nextchatpromots/`, {
    headers: {
      Authorization: `Token ${token}`,
      responseType: "json",
    },
  });
  const resJson = await res.json();
  console.log(resJson);
  return resJson;
};
