import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { SessionManager } from "@mariozechner/pi-coding-agent";

const TARGETS = {
  eva: "/Users/sezam/projects/evatech",
  erp: "/Users/sezam/projects/golang/erp-go-vue/softexpert-erp",
} as const;

type TargetKey = keyof typeof TARGETS;

export default function (pi: ExtensionAPI) {
  pi.registerCommand("goto", {
    description: "Switch pi to a project session: eva or erp",
    getArgumentCompletions: (prefix: string) => {
      const items = (Object.keys(TARGETS) as TargetKey[])
        .filter((key) => key.startsWith(prefix.toLowerCase()))
        .map((key) => ({ value: key, label: `${key} → ${TARGETS[key]}` }));
      return items.length > 0 ? items : null;
    },
    handler: async (args, ctx) => {
      const key = args.trim().toLowerCase() as TargetKey;
      const targetCwd = TARGETS[key];

      if (!targetCwd) {
        ctx.ui.notify("Usage: /goto eva|erp", "warning");
        return;
      }

      const currentSessionFile = ctx.sessionManager.getSessionFile();
      const targetSession = currentSessionFile
        ? SessionManager.forkFrom(currentSessionFile, targetCwd)
        : SessionManager.create(targetCwd);

      const targetSessionFile = targetSession.getSessionFile();
      if (!targetSessionFile) {
        ctx.ui.notify(`Created session for ${key} (${targetCwd})`, "info");
        return;
      }

      const result = await ctx.switchSession(targetSessionFile, {
        withSession: async (newCtx) => {
          newCtx.ui.notify(`Switched to ${key}: ${targetCwd}`, "info");
        },
      });

      if (result.cancelled) {
        ctx.ui.notify("Goto cancelled", "warning");
      }
    },
  });
}
