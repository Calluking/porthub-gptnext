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

  // req.headers.set("Authorization", `Token 64c3315934c490fcf7f2819d6560a9f8684f200f`);
  let res = await checkcredit(req);
  console.log(res);
  console.log("check credit res");
  console.log("resJson", res);
  if (res["code"] != 200) {
    return NextResponse.json(res["message"], {
      status: res["code"],
    });
  }

  const apiKey = await getkey(req);
  console.log(apiKey);
  req.headers.set("Authorization", `Bearer ${apiKey}`);

  const authResult = auth(req);
  if (authResult.error) {
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
      return NextResponse.json(availableModels, {
        status: response.status,
      });
    }

    return response;
  } catch (e) {
    console.error("[OpenAI] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";

const checkcredit = async (req: NextRequest) => {
  // const token = localStorage.getItem("PORTHUB_TOKEN");
  const authToken = req.headers.get("Referer") ?? "";
  console.log("authToken:", authToken);
  const token = authToken.replace("https://gptnext.porthub.app/?token=", "");
  const res = await fetch(
    `https://dev-api.porthub.app/namecards/nextchatsession/checkcredit/`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );
  const resJson = await res.json();
  return resJson;
};

const getkey = async (req: NextRequest) => {
  // const token = localStorage.getItem("PORTHUB_TOKEN");
  const authToken = req.headers.get("Referer") ?? "";
  console.log("authToken:", authToken);
  const token = authToken.replace("https://gptnext.porthub.app/?token=", "");
  const res = await fetch(
    `https://dev-api.porthub.app/namecards/nextchatsession/getkey/`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );
  const resJson = await res.json();
  console.log("#################################");
  console.log(resJson);
  return resJson["data"];
};
