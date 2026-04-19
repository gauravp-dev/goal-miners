"use client";
import * as React from "react";
import PartySocket from "partysocket";

const DEFAULT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";

type Options<ClientMsg, ServerMsg> = {
  /** PartyKit "party" key — e.g. "higherorlower", "playerdle". */
  party: string;
  /** Room id (usually a 4-letter code). */
  room: string;
  /**
   * Stable client id. When provided, PartySocket sends it as the connection id
   * so reconnects (including page reloads) are recognised as the same participant.
   * Pass `null` to defer connecting until the id is available.
   */
  id?: string | null;
  /** Called once on open. Good place to send a "join" message. */
  onOpen?: (socket: PartySocket) => void;
  /** Called on each parsed message from server. */
  onMessage?: (msg: ServerMsg, socket: PartySocket) => void;
  /** Called when the socket closes. */
  onClose?: () => void;
};

/**
 * Thin, typed wrapper over PartySocket. Returns a `send` function and the live socket ref.
 * Automatically JSON-encodes/decodes messages.
 */
export function usePartySocket<ClientMsg, ServerMsg>({
  party,
  room,
  id,
  onOpen,
  onMessage,
  onClose,
}: Options<ClientMsg, ServerMsg>) {
  const socketRef = React.useRef<PartySocket | null>(null);
  const [connected, setConnected] = React.useState(false);

  // Keep callbacks in refs so we can update them without reconnecting.
  const onOpenRef = React.useRef(onOpen);
  const onMessageRef = React.useRef(onMessage);
  const onCloseRef = React.useRef(onClose);
  onOpenRef.current = onOpen;
  onMessageRef.current = onMessage;
  onCloseRef.current = onClose;

  React.useEffect(() => {
    // Defer connecting until we have a stable id — otherwise reloads would
    // accumulate duplicate participants on the server.
    if (id === null) return;

    const socket = new PartySocket({
      host: DEFAULT_HOST,
      party,
      room,
      ...(id ? { id } : {}),
    });
    socketRef.current = socket;

    const handleOpen = () => {
      setConnected(true);
      onOpenRef.current?.(socket);
    };
    const handleMessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as ServerMsg;
        onMessageRef.current?.(parsed, socket);
      } catch (err) {
        console.error("Bad message from server:", event.data, err);
      }
    };
    const handleClose = () => {
      setConnected(false);
      onCloseRef.current?.();
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);

    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      socket.close();
      socketRef.current = null;
    };
  }, [party, room, id]);

  const send = React.useCallback((msg: ClientMsg) => {
    const sock = socketRef.current;
    if (!sock || sock.readyState !== WebSocket.OPEN) {
      // Queue — PartySocket does its own reconnect; but if we're mid-reconnect, just drop.
      console.warn("socket not open, dropping:", msg);
      return;
    }
    sock.send(JSON.stringify(msg));
  }, []);

  return { send, connected, socket: socketRef };
}
