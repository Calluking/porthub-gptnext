const env = process.env.NODE_ENV;
let BASE_URL = "https://dev-api.porthub.app";
// const token = 'f14bba22dce1b55c0c10c6d3e614ce4769a52ab4'

console.log("env:", env);
// console.log("location.href:", location.href);

// if (env === "production") {
//   BASE_URL = "https://api.porthub.app";
// }

// function getQueryString(name: string) {
//   var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
//   var r = window.location.search.substr(1).match(reg);
//   if (r != null) {
//     return unescape(r[2]);
//   }
//   return null;
// }

// const token = getQueryString("token");
// console.log("token:", token);

export const getChatStoreRequest = async () => {
  const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(`${BASE_URL}/namecards/nextchatsession/getsession`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  const resJson = await res.json();
  return resJson;
};
export const setChatStoreRequest = async (store: string) => {
  const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(
    `${BASE_URL}/namecards/nextchatsession/storesession/`,
    {
      method: "post",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_store: store,
      }),
    },
  );
  const resJson = await res.json();
  return resJson;
};

export const getPromptStoreRequest = async () => {
  const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(`${BASE_URL}/namecards/nextchatpromots/getprompts/`, {
    headers: {
      Authorization: `Token ${token}`,
      responseType: "json",
    },
  });
  const resJson = await res.json();
  return resJson;
};

export const setPromptStoreRequest = async (store: string) => {
  const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(
    `${BASE_URL}/namecards/nextchatpromots/storeprompts/`,
    {
      method: "post",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompts_store: store,
      }),
    },
  );
  const resJson = await res.json();
  return resJson;
};

export const getMaskStoreRequest = async () => {
  const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(`${BASE_URL}/namecards/nextchatmask/getmask/`, {
    headers: {
      Authorization: `Token ${token}`,
      responseType: "json",
    },
  });
  const resJson = await res.json();
  return resJson;
};

export const setMaskStoreRequest = async (store: string) => {
  const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(`${BASE_URL}/namecards/nextchatmask/storemask`, {
    method: "post",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mask_store: store,
    }),
  });
  const resJson = await res.json();
  return resJson;
};
