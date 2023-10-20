import { type OpenAIListModelResponse } from "@/app/client/platforms/openai";
import { getServerSideConfig } from "@/app/config/server";
import { OpenaiPath } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { requestOpenai } from "../../common";

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
  const token = authToken.replace("https://gptnext.porthub.app/?token=", "");
  console.log("token: ", token);
  const res = await fetch(
    `https://dev-api.porthub.app/namecards/subscript/check_credit_status/`,
    {
      method: "post",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credit: 4,
      }),
    },
  );
  const resJson = await res.json();
  if (resJson["code"] != 200) {
    return NextResponse.json(resJson["message"], {
      status: resJson["code"],
    });
  }

  let openaires = await requestOpenaiWithRetry(req, 0, subpath, token);
  console.log(openaires.status);
  return openaires;
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";

const getkey = async (req: NextRequest, token: any) => {
  // const token = localStorage.getItem("PORTHUB_TOKEN");
  const res = await fetch(
    `https://dev-api.porthub.app/namecards/openaikey/getkey/`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );
  const resJson = await res.json();
  return resJson["data"];
};

async function requestOpenaiWithRetry(
  req: NextRequest,
  trytime: any,
  subpath: any,
  token: any,
): Promise<NextResponse | Response> {
  if (trytime >= 10) {
    const res = await fetch(
      `https://dev-api.porthub.app/namecards/subscript/add_credit/`,
      {
        method: "post",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credit: 4,
        }),
      },
    );
    return NextResponse.json("exceed max retry times", { status: 402 });
  }
  const apiKey = await getkey(req, token);
  console.log(apiKey);
  req.headers.set("Authorization", `Bearer ${apiKey}`);

  const authResult = auth(req);
  if (authResult.error) {
    console.log("authResult.error");
    return NextResponse.json(authResult, {
      status: 401,
    });
  }
  try {
    const response = await requestOpenai(req);
    // list models
    if (subpath === OpenaiPath.ListModelPath && response.status === 200) {
      const resJson = (await response.json()) as OpenAIListModelResponse;
      const availableModels = getModels(resJson);

      const res = await fetch(
        `https://dev-api.porthub.app/namecards/openaikey/markkey/`,
        {
          method: "post",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isSucceed: true,
            openai_key: apiKey,
          }),
        },
      );
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    } else {
      const res = await fetch(
        `https://dev-api.porthub.app/namecards/openaikey/markkey/`,
        {
          method: "post",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isSucceed: false,
            openai_key: apiKey,
          }),
        },
      );
      return await requestOpenaiWithRetry(req, trytime + 1, subpath, token);
    }

    console.log("[request openai] response.status:", response.status);
    return response;
  } catch (e) {
    console.error("[OpenAI] ", e);
    const res = await fetch(
      `https://dev-api.porthub.app/namecards/openaikey/markkey/`,
      {
        method: "post",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isSucceed: false,
          openai_key: apiKey,
        }),
      },
    );
    return await requestOpenaiWithRetry(req, trytime + 1, subpath, token);
  }
}
