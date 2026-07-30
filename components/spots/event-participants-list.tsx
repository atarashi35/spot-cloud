"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { EventEmailInvite, EventParticipant, SpotEvent, SpotMembership } from "@/lib/types";

type EventParticipantsListProps = {
  spotId: string;
  eventId: string;
  event: SpotEvent;
};

const STATUS_LABEL: Record<EventParticipant["status"], string> = {
  invited: "招待中",
  pending: "承認待ち",
  accepted: "参加確定",
  waitlisted: "キャンセル待ち",
  declined: "見送り"
};

function ParticipantExtra({ participant }: { participant: EventParticipant }) {
  const answerEntries = participant.answers ? Object.entries(participant.answers).filter(([, v]) => v) : [];
  if (answerEntries.length === 0 && !participant.plusOneCount) return null;

  return (
    <div className="mt-1.5 space-y-0.5 text-xs text-ink/65">
      {participant.plusOneCount ? <div>同伴者: {participant.plusOneCount}名</div> : null}
      {answerEntries.map(([q, a]) => (
        <div key={q}>
          {q}: {a}
        </div>
      ))}
    </div>
  );
}

export function EventParticipantsList({ spotId, eventId, event }: EventParticipantsListProps) {
  const { user } = useAuth();
  const participationMode = event.participationMode;
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [emailInvites, setEmailInvites] = useState<EventEmailInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingUid, setActingUid] = useState<string | null>(null);

  const [members, setMembers] = useState<SpotMembership[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [draftEmails, setDraftEmails] = useState<{ email: string; displayName: string }[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void user
      .getIdToken()
      .then(async (token) => {
        const [participantsRes, invitesRes] = await Promise.all([
          fetch(`/api/spots/${spotId}/events/${eventId}/participants`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          participationMode === "invitation"
            ? fetch(`/api/spots/${spotId}/events/${eventId}/invitations`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            : null
        ]);

        const participantsData = (await participantsRes.json()) as {
          participants?: EventParticipant[];
          error?: string;
          message?: string;
        };

        if (!participantsRes.ok || !participantsData.participants) {
          throw new Error(participantsData.message ?? participantsData.error ?? "participants_load_failed");
        }

        setParticipants(participantsData.participants);

        if (invitesRes) {
          const invitesData = (await invitesRes.json()) as { emailInvites?: EventEmailInvite[] };
          setEmailInvites(invitesData.emailInvites ?? []);
        }
      })
      .catch((cause: Error) => {
        setError(cause.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId, spotId, user, participationMode]);

  useEffect(() => {
    load();
  }, [load]);

  async function openPicker() {
    setPickerOpen(true);
    if (members !== null || !user) return;

    const token = await user.getIdToken();
    const response = await fetch(`/api/spots/${spotId}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = (await response.json()) as { members?: SpotMembership[] };
    setMembers(data.members ?? []);
  }

  function addDraftEmail() {
    const email = emailInput.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("メールアドレスの形式が正しくありません。");
      return;
    }
    if (draftEmails.some((d) => d.email.toLowerCase() === email.toLowerCase())) {
      setEmailInput("");
      setNameInput("");
      return;
    }

    setError(null);
    setDraftEmails((prev) => [...prev, { email, displayName: nameInput.trim() }]);
    setEmailInput("");
    setNameInput("");
  }

  async function handleInvite() {
    if (!user || (selectedUids.length === 0 && draftEmails.length === 0)) return;

    setInviting(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          uids: selectedUids,
          emails: draftEmails.map((d) => ({ email: d.email, displayName: d.displayName || undefined }))
        })
      });

      if (!response.ok) throw new Error("招待の送信に失敗しました。");

      setSelectedUids([]);
      setDraftEmails([]);
      setPickerOpen(false);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "招待の送信に失敗しました。");
    } finally {
      setInviting(false);
    }
  }

  async function handleDecision(uid: string, decision: "accept" | "decline") {
    if (!user) return;

    setActingUid(uid);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants/${uid}/${decision}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(decision === "accept" ? "承認に失敗しました。" : "辞退処理に失敗しました。");
      }

      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新に失敗しました。");
    } finally {
      setActingUid(null);
    }
  }

  async function handleCheckIn(uid: string, checkedIn: boolean) {
    if (!user) return;

    setActingUid(uid);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${spotId}/events/${eventId}/participants/${uid}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checkedIn })
      });

      if (!response.ok) throw new Error("チェックインの更新に失敗しました。");
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新に失敗しました。");
    } finally {
      setActingUid(null);
    }
  }

  if (loading) {
    return <p className="mt-4 text-xs text-ink/72">参加者を読み込み中です。</p>;
  }

  const pending = participants.filter((p) => p.status === "pending");
  const invited = participants.filter((p) => p.status === "invited");
  const waitlisted = participants.filter((p) => p.status === "waitlisted");
  const accepted = participants.filter((p) => p.status === "accepted");
  const declined = participants.filter((p) => p.status === "declined");
  const sentEmailInvites = emailInvites.filter((i) => i.status === "sent");
  const invitableMembers = (members ?? []).filter(
    (m) =>
      (m.status === "active" || m.status === "canceling") &&
      !participants.some((p) => p.uid === m.uid)
  );

  const totalInvitesSent = invited.length + emailInvites.length;
  const totalResponded = accepted.length + declined.length + waitlisted.length;
  const responseRate = totalInvitesSent > 0 ? Math.round((totalResponded / totalInvitesSent) * 100) : null;

  return (
    <div className="mt-4 space-y-4">
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}

      {/* 主催者向け統計 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-[16px] bg-mist px-3 py-3 text-center">
          <div className="text-lg font-bold text-ink">{event.viewCount ?? 0}</div>
          <div className="text-[11px] text-ink/60">閲覧数</div>
        </div>
        <div className="rounded-[16px] bg-mist px-3 py-3 text-center">
          <div className="text-lg font-bold text-ink">
            {event.participantCount}
            {event.capacity ? <span className="text-xs text-ink/60"> / {event.capacity}</span> : null}
          </div>
          <div className="text-[11px] text-ink/60">参加確定</div>
        </div>
        {waitlisted.length > 0 ? (
          <div className="rounded-[16px] bg-mist px-3 py-3 text-center">
            <div className="text-lg font-bold text-ink">{waitlisted.length}</div>
            <div className="text-[11px] text-ink/60">キャンセル待ち</div>
          </div>
        ) : null}
        {participationMode !== "open" ? (
          <div className="rounded-[16px] bg-mist px-3 py-3 text-center">
            <div className="text-lg font-bold text-ink">{responseRate !== null ? `${responseRate}%` : "–"}</div>
            <div className="text-[11px] text-ink/60">応諾率</div>
          </div>
        ) : null}
      </div>

      {participationMode === "invitation" && (
        <div className="rounded-[20px] border border-ink/10 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-ink/72">招待する</div>
            {!pickerOpen ? (
              <button type="button" className="cta-secondary px-3 py-1.5 text-xs" onClick={() => void openPicker()}>
                招待相手を選ぶ
              </button>
            ) : null}
          </div>

          {pickerOpen ? (
            <div className="mt-3 space-y-4">
              <div>
                <p className="mb-2 text-xs font-bold text-ink/65">既存の応援会員から選ぶ</p>
                {members === null ? (
                  <p className="text-xs text-ink/65">会員一覧を読み込み中です。</p>
                ) : invitableMembers.length === 0 ? (
                  <p className="text-xs text-ink/65">招待できる会員がいません（全員招待済み、または会員がいません）。</p>
                ) : (
                  <div className="max-h-56 space-y-1.5 overflow-y-auto">
                    {invitableMembers.map((m) => (
                      <label key={m.uid} className="flex items-center gap-2 rounded-[12px] bg-mist px-3 py-2 text-sm text-ink/78">
                        <input
                          type="checkbox"
                          checked={selectedUids.includes(m.uid)}
                          onChange={(e) =>
                            setSelectedUids((prev) =>
                              e.target.checked ? [...prev, m.uid] : prev.filter((uid) => uid !== m.uid)
                            )
                          }
                        />
                        <span>{m.displayName || m.email || m.uid}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-ink/65">まだ会員でない知人をメールで招待</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="email"
                    className="field h-10 flex-1 min-w-[180px] text-sm"
                    placeholder="you@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <input
                    type="text"
                    className="field h-10 w-32 text-sm"
                    placeholder="お名前（任意）"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                  <button type="button" className="cta-secondary px-3 py-1.5 text-xs" onClick={addDraftEmail}>
                    追加
                  </button>
                </div>
                {draftEmails.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draftEmails.map((d) => (
                      <span key={d.email} className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs text-ink/78">
                        {d.displayName ? `${d.displayName} <${d.email}>` : d.email}
                        <button
                          type="button"
                          className="text-ink/50 hover:text-ink"
                          onClick={() => setDraftEmails((prev) => prev.filter((x) => x.email !== d.email))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-ink/60">
                  承諾には無料のアカウント作成のみが必要です。応援会員登録（月額課金）は求めません。
                </p>
              </div>

              <div className="flex gap-2 border-t border-ink/10 pt-3">
                <button
                  type="button"
                  className="cta-primary px-3 py-1.5 text-xs"
                  onClick={() => void handleInvite()}
                  disabled={inviting || (selectedUids.length === 0 && draftEmails.length === 0)}
                >
                  {inviting ? "送信中..." : `招待を送る（${selectedUids.length + draftEmails.length}件）`}
                </button>
                <button
                  type="button"
                  className="text-xs text-ink/60 underline"
                  onClick={() => {
                    setPickerOpen(false);
                    setSelectedUids([]);
                    setDraftEmails([]);
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {(invited.length > 0 || sentEmailInvites.length > 0) && (
        <div className="rounded-[20px] border border-ink/10 bg-white px-4 py-4">
          <div className="text-sm font-bold text-ink/72">
            招待中 {invited.length + sentEmailInvites.length} 件（本人の応諾待ち）
          </div>
          <div className="mt-3 space-y-2 text-sm text-ink/78">
            {invited.map((participant) => (
              <div key={participant.uid} className="rounded-[16px] bg-mist px-3 py-3">
                <div className="font-medium text-ink">
                  {participant.displayName || participant.email || participant.uid}
                </div>
                <div className="mt-1 text-xs text-ink/68">
                  {participant.email && participant.displayName ? participant.email : participant.uid}
                </div>
              </div>
            ))}
            {sentEmailInvites.map((invite) => (
              <div key={invite.id} className="rounded-[16px] bg-mist px-3 py-3">
                <div className="font-medium text-ink">{invite.displayName || invite.email}</div>
                <div className="mt-1 text-xs text-ink/68">{invite.email}（未加入・メール招待）</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-4">
          <div className="text-sm font-bold text-ink/72">承認待ち {pending.length} 件</div>
          <div className="mt-3 space-y-2 text-sm text-ink/78">
            {pending.map((participant) => (
              <div key={participant.uid} className="flex items-center justify-between gap-3 rounded-[16px] bg-white px-3 py-3">
                <div>
                  <div className="font-medium text-ink">
                    {participant.displayName || participant.email || participant.uid}
                  </div>
                  <div className="mt-1 text-xs text-ink/68">
                    {participant.email && participant.displayName ? participant.email : participant.uid}
                  </div>
                  <ParticipantExtra participant={participant} />
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="cta-primary px-3 py-1.5 text-xs"
                    onClick={() => void handleDecision(participant.uid, "accept")}
                    disabled={actingUid === participant.uid}
                  >
                    承認
                  </button>
                  <button
                    type="button"
                    className="cta-secondary px-3 py-1.5 text-xs"
                    onClick={() => void handleDecision(participant.uid, "decline")}
                    disabled={actingUid === participant.uid}
                  >
                    辞退
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {waitlisted.length > 0 && (
        <div className="rounded-[20px] border border-ink/10 bg-white px-4 py-4">
          <div className="text-sm font-bold text-ink/72">キャンセル待ち {waitlisted.length} 件（申込順）</div>
          <div className="mt-3 space-y-2 text-sm text-ink/78">
            {waitlisted.map((participant) => (
              <div key={participant.uid} className="rounded-[16px] bg-mist px-3 py-3">
                <div className="font-medium text-ink">
                  {participant.displayName || participant.email || participant.uid}
                </div>
                <div className="mt-1 text-xs text-ink/68">
                  {participant.email && participant.displayName ? participant.email : participant.uid}
                </div>
                <ParticipantExtra participant={participant} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[20px] border border-ink/10 bg-white px-4 py-4">
        <div className="text-sm font-bold text-ink/72">参加予定 {accepted.length} 人</div>
        {accepted.length === 0 && declined.length === 0 ? (
          <p className="mt-3 text-sm text-ink/72">まだ参加者はいません。</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm text-ink/78">
            {[...accepted, ...declined].map((participant) => (
              <div key={participant.uid} className="rounded-[16px] bg-mist px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-ink">
                    {participant.displayName || participant.email || participant.uid}
                  </div>
                  <span className="text-xs text-ink/60">{STATUS_LABEL[participant.status]}</span>
                </div>
                <div className="mt-1 text-xs text-ink/68">
                  {participant.email && participant.displayName ? participant.email : participant.uid}
                </div>
                <div className="mt-1 text-xs text-ink/68">
                  参加登録: {participant.joinedAt.slice(0, 10)}
                </div>
                <ParticipantExtra participant={participant} />
                {participant.status === "accepted" ? (
                  <button
                    type="button"
                    className={`mt-2 rounded-full px-3 py-1 text-xs font-medium transition ${
                      participant.checkedInAt ? "bg-moss/15 text-moss" : "bg-white text-ink/65 hover:text-ink"
                    }`}
                    onClick={() => void handleCheckIn(participant.uid, !participant.checkedInAt)}
                    disabled={actingUid === participant.uid}
                  >
                    {participant.checkedInAt ? "✓ チェックイン済み" : "チェックインする"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
