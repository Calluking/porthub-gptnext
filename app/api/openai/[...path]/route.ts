import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { getServerSideConfig } from "@/app/config/server";
import { OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { requestOpenai } from "../../common";
const devBaseUrl = "https://dev-api.porthub.app/namecards";
const mainBaseUrl = "https://api.porthub.app/namecards";

const ALLOWD_PATH = new Set(Object.values(OpenaiPath));

function getModels(remoteModelRes: OpenAIListModelResponse) {
  const config = getServerSideConfig();

  if (config.disableGPT4) {
    remoteModelRes.data = remoteModelRes.data.filter(
      (m) => !m.id.startsWith("gpt-4"),
    );
  }

  return remoteModelRes;
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[OpenAI Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const subpath = params.path.join("/");

  if (!ALLOWD_PATH.has(subpath)) {
    console.log("[OpenAI Route] forbidden path ", subpath);
    return NextResponse.json(
      {
        error: true,
        msg: "you are not allowed to request " + subpath,
      },
      {
        status: 403,
      },
    );
  }
  const authToken = req.headers.get("Referer") ?? "";
  console.log("authToken:", authToken);
  let token = authToken.replace("https://gptnext.porthub.app/?token=", "");
  console.log("token: ", token);
  let baseurl = mainBaseUrl;

  if (token.includes("&env=DEV")) {
    console.log("env=dev");
    baseurl = devBaseUrl;
    token = token.replace("&env=DEV", "");
  }
  console.log("token: ", token);
  console.log(baseurl);
  const res = await fetch(`${baseurl}/subscript/check_credit_status/`, {
    method: "post",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credit: 1,
      operation: "mask gpt",
    }),
  });
  const resJson = await res.json();
  console.log("[resJson] ", resJson["code"])
  if (resJson["code"] != 200) {
    console.log(resJson["code"]);
    return NextResponse.json(resJson["message"], {
      status: resJson["code"],
    });
  }
  let openaires = await requestOpenaiWithRetry(req, 0, subpath, token, baseurl);
  console.log("[openaires.status]", openaires.status);
  return openaires;
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
const getkey = async (req: NextRequest, token: any, baseurl: any) => {
  // const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(`${baseurl}/openaikey/getkey/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  const resJson = await res.json();
  return resJson["data"];
};

async function requestOpenaiWithRetry(
  req: NextRequest,
  trytime: any,
  subpath: any,
  token: any,
  baseurl: any,
): Promise<NextResponse | Response> {
  if (trytime >= 10) {
    const res = await fetch(`${baseurl}/subscript/add_credit/`, {
      method: "post",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credit: 1,
        operation: "mask gpt",
      }),
    });
    return NextResponse.json("exceed max retry times", { status: 402 });
  }
  const apiKey = await getkey(req, token, baseurl);
  req.headers.set("Authorization", `Bearer ${apiKey}`);

  const authResult = auth(req);
  if (authResult.error) {
    console.log("authResult.error");
    return NextResponse.json(authResult, {
      status: 401,
    });
  }
  try {
    console.log(apiKey);
    console.log(apiKey);
    const response = await requestOpenai(req);
    // list models
    console.log(subpath === OpenaiPath.ListModelPath);
    console.log(response.status === 200);
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      console.log(
        "subpath === OpenaiPath.ListModelPath && response.status === 200",
      );
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);
      const res = await fetch(`${baseurl}/openaikey/markkey/`, {
        method: "post",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isSucceed: true,
          openai_key: apiKey,
        }),
      });
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    } else if (response.status !== 200) {
      console.log("[requestOpenai]", response.status);
      console.log(response.statusText);
      const errorResponse = await response.json();
      const errorReason = errorResponse.error.message; // 提取错误原因

      console.log("Error Reason:", errorReason);
      const res = await fetch(`${baseurl}/openaikey/markkey/`, {
        method: "post",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isSucceed: false,
          openai_key: apiKey,
        }),
      });
      return await requestOpenaiWithRetry(
        req,
        trytime + 1,
        subpath,
        token,
        baseurl,
      );
    }

    console.log("[request openai] response.status:", response.status);
    return response;
  } catch (e) {
    console.error("[OpenAI] ", e);
    const res = await fetch(`${baseurl}/openaikey/markkey/`, {
      method: "post",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isSucceed: false,
        openai_key: apiKey,
      }),
    });
    return await requestOpenaiWithRetry(
      req,
      trytime + 1,
      subpath,
      token,
      baseurl,
    );
  }
}
