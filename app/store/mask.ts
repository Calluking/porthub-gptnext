import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BUILTIN_MASKS } from "../masks";
import { getLang, Lang } from "../locales";
import { DEFAULT_TOPIC, ChatMessage } from "./chat";
import { ModelConfig, useAppConfig } from "./config";
import { StoreKey } from "../constant";
import { nanoid } from "nanoid";

export type Mask = {
  id: string | number;
  createdAt: number;
  avatar: string;
  name: string;
  hideContext?: boolean;
  context: ChatMessage[];
  syncGlobalConfig?: boolean;
  modelConfig: ModelConfig;
  lang: Lang;
  builtin: boolean;
};

const initMaskStore = (): any => {
  const flag = true;
  if (flag) {
    return {
      "1OWih9O5itqiQAwGLUTkH": {
        id: "1OWih9O5itqiQAwGLUTkH",
        avatar: "gpt-bot",
        name: "lllll",
        context: [],
        syncGlobalConfig: true,
        modelConfig: {
          model: "gpt-3.5-turbo",
          temperature: 0.5,
          top_p: 1,
          max_tokens: 2000,
          presence_penalty: 0,
          frequency_penalty: 0,
          sendMemory: true,
          historyMessageCount: 4,
          compressMessageLengthThreshold: 1000,
          enableInjectSystemPrompts: true,
          template: "{{input}}",
        },
        lang: "tw",
        builtin: false,
        createdAt: 1696856255552,
      },
      he8VGbfDWol6mWr5IxH0f: {
        id: "he8VGbfDWol6mWr5IxH0f",
        avatar: "gpt-bot",
        name: "lllll",
        context: [],
        syncGlobalConfig: true,
        modelConfig: {
          model: "gpt-3.5-turbo",
          temperature: 0.5,
          top_p: 1,
          max_tokens: 2000,
          presence_penalty: 0,
          frequency_penalty: 0,
          sendMemory: true,
          historyMessageCount: 4,
          compressMessageLengthThreshold: 1000,
          enableInjectSystemPrompts: true,
          template: "{{input}}",
        },
        lang: "tw",
        builtin: false,
        createdAt: 1696856255552,
      },
    };
  } else {
    return {};
  }
};

export const DEFAULT_MASK_STATE = {
  // masks: {} as Record<string, Mask>,
  masks: initMaskStore(),
};

export type MaskState = typeof DEFAULT_MASK_STATE;
type MaskStore = MaskState & {
  create: (mask?: Partial<Mask>) => Mask;
  update: (id: string, updater: (mask: Mask) => void) => void;
  delete: (id: string) => void;
  search: (text: string) => Mask[];
  get: (id?: string) => Mask | null;
  getAll: () => Mask[];
};

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export const createEmptyMask = () =>
  ({
    id: nanoid(),
    avatar: DEFAULT_MASK_AVATAR,
    name: DEFAULT_TOPIC,
    context: [],
    syncGlobalConfig: true, // use global config as default
    modelConfig: { ...useAppConfig.getState().modelConfig },
    lang: getLang(),
    builtin: false,
    createdAt: Date.now(),
  }) as Mask;

const getMaskStore = () => {
  const store = localStorage.getItem("mask-store") || "";
  console.log("mask-store:", JSON.parse(store));
};

export const useMaskStore = create<MaskStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_MASK_STATE,

      create(mask) {
        const masks = get().masks;
        const id = nanoid();
        masks[id] = {
          ...createEmptyMask(),
          ...mask,
          id,
          builtin: false,
        };

        set(() => ({ masks }));
        getMaskStore();
        return masks[id];
      },
      update(id, updater) {
        const masks = get().masks;
        const mask = masks[id];
        if (!mask) return;
        const updateMask = { ...mask };
        updater(updateMask);
        masks[id] = updateMask;
        set(() => ({ masks }));
        getMaskStore();
      },
      delete(id) {
        const masks = get().masks;
        delete masks[id];
        set(() => ({ masks }));
        getMaskStore();
      },

      get(id) {
        return get().masks[id ?? 1145141919810];
      },
      getAll() {
        const userMasks = Object.values(get().masks).sort(
          (a, b) => b.createdAt - a.createdAt,
        );
        const config = useAppConfig.getState();
        if (config.hideBuiltinMasks) return userMasks;
        const buildinMasks = BUILTIN_MASKS.map(
          (m) =>
            ({
              ...m,
              modelConfig: {
                ...config.modelConfig,
                ...m.modelConfig,
              },
            }) as Mask,
        );
        return userMasks.concat(buildinMasks);
      },
      search(text) {
        return Object.values(get().masks);
      },
    }),
    {
      name: StoreKey.Mask,
      version: 3.1,

      migrate(state, version) {
        const newState = JSON.parse(JSON.stringify(state)) as MaskState;

        // migrate mask id to nanoid
        if (version < 3) {
          Object.values(newState.masks).forEach((m) => (m.id = nanoid()));
        }

        if (version < 3.1) {
          const updatedMasks: Record<string, Mask> = {};
          Object.values(newState.masks).forEach((m) => {
            updatedMasks[m.id] = m;
          });
          newState.masks = updatedMasks;
        }

        return newState as any;
      },
    },
  ),
);
