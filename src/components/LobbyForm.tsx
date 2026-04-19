"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { generateRoomCode } from "@/lib/utils";

/**
 * Shared lobby form used at /higher-or-lower and /playerdle.
 * Lets the user either create a new room (random code + remembered display name)
 * or join an existing one.
 *
 * Display name persists in localStorage so friends don't have to retype it across games.
 */
export type GameSlug =
  | "higher-or-lower"
  | "playerdle"
  | "fut-draft"
  | "who-am-i"
  | "squad-draft";

export function LobbyForm({ game }: { game: GameSlug }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [mode, setMode] = React.useState<"create" | "join">("create");

  React.useEffect(() => {
    const remembered = localStorage.getItem("gm-name");
    if (remembered) setName(remembered);
  }, []);

  function go() {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("gm-name", trimmed);

    const targetCode = (mode === "create" ? generateRoomCode() : code.trim().toUpperCase());
    if (!/^[A-Z]{3,6}$/.test(targetCode)) return;

    const q = new URLSearchParams({ name: trimmed }).toString();
    router.push(`/${game}/${targetCode}?${q}`);
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col gap-4">
      <div className="flex gap-2">
        <TabButton active={mode === "create"} onClick={() => setMode("create")}>
          Create room
        </TabButton>
        <TabButton active={mode === "join"} onClick={() => setMode("join")}>
          Join room
        </TabButton>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wider text-zinc-500">Display name</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gaurav"
          maxLength={16}
          autoFocus
        />
      </label>

      {mode === "join" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-zinc-500">Room code</span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            maxLength={6}
            className="uppercase tracking-widest text-center font-bold"
          />
        </label>
      )}

      <Button
        onClick={go}
        disabled={!name.trim() || (mode === "join" && code.trim().length < 3)}
        size="lg"
      >
        {mode === "create" ? "Create room" : "Join room"}
      </Button>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 h-10 rounded-lg font-semibold text-sm transition-all " +
        (active
          ? "bg-zinc-800 text-zinc-100"
          : "bg-transparent text-zinc-500 hover:text-zinc-300")
      }
    >
      {children}
    </button>
  );
}
