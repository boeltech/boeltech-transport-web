import { describe, expect, it } from "vitest";
import type { UserManagementEvent } from "../../domain";
import {
  describeUserActivityEvent,
  userActivitySentenceToText,
  type DescribeUserActivityOptions,
  type UserActivitySegment,
} from "./userActivityCopy";

type PersonSegment = Extract<UserActivitySegment, { kind: "person" }>;

function buildEvent(overrides: Partial<UserManagementEvent> = {}): UserManagementEvent {
  return {
    id: "event-1",
    subjectUserId: "user-2",
    actorUserId: "user-1",
    actorEmail: "ana@tlama.mx",
    actorFirstName: "Ana",
    actorLastName: "Ruiz",
    action: "user_created",
    payload: {},
    createdAt: "2026-04-10T18:04:00.000Z",
    ...overrides,
  };
}

const NAMES: DescribeUserActivityOptions = { subjectName: "Luis Pérez" };

function sentenceOf(
  event: UserManagementEvent,
  options: DescribeUserActivityOptions = NAMES,
): string {
  return userActivitySentenceToText(
    describeUserActivityEvent(event, options).sentence,
  );
}

describe("describeUserActivityEvent", () => {
  it("describes a user creation as a sentence with actor, subject and role", () => {
    const event = buildEvent({
      payload: { via: "invitation", email: "luis@tlama.mx", role: "accountant" },
    });

    const description = describeUserActivityEvent(event, NAMES);

    expect(userActivitySentenceToText(description.sentence)).toBe(
      "Ana Ruiz dio de alta a Luis Pérez como Contador",
    );
    expect(description.detail).toBe("Aceptó la invitación.");
    expect(description.category).toBe("alta");
  });

  it("links actor and subject to their profiles", () => {
    const { sentence } = describeUserActivityEvent(buildEvent(), NAMES);
    const people = sentence.filter(
      (segment): segment is PersonSegment => segment.kind === "person",
    );

    expect(people.map((person) => person.text)).toEqual(["Ana Ruiz", "Luis Pérez"]);
    expect(people.map((person) => person.userId)).toEqual(["user-1", "user-2"]);
  });

  it("emphasizes role changes and shows the transition as detail", () => {
    const event = buildEvent({
      action: "user_updated",
      payload: { changes: { role: { from: "dispatcher", to: "accountant" } } },
    });

    const description = describeUserActivityEvent(event, NAMES);

    expect(userActivitySentenceToText(description.sentence)).toBe(
      "Ana Ruiz cambió el rol de Luis Pérez",
    );
    expect(description.detail).toBe("Despachador → Contador");
    expect(description.emphasis).toBe(true);
    expect(description.category).toBe("rol");
  });

  it("labels each change when the update touches several fields", () => {
    const event = buildEvent({
      action: "user_updated",
      payload: {
        changes: {
          role: { from: "dispatcher", to: "accountant" },
          email: { from: "a@tlama.mx", to: "b@tlama.mx" },
        },
      },
    });

    expect(describeUserActivityEvent(event, NAMES).detail).toBe(
      "Rol: Despachador → Contador · Correo: a@tlama.mx → b@tlama.mx",
    );
  });

  it("reads name changes written in camelCase or snake_case", () => {
    const camel = buildEvent({
      action: "user_updated",
      payload: { changes: { firstName: { from: "Luis", to: "Luis Antonio" } } },
    });
    const snake = buildEvent({
      action: "user_updated",
      payload: { changes: { first_name: { from: "Luis", to: "Luis Antonio" } } },
    });

    expect(describeUserActivityEvent(camel, NAMES).detail).toBe(
      "Luis → Luis Antonio",
    );
    expect(describeUserActivityEvent(snake, NAMES).detail).toBe(
      "Luis → Luis Antonio",
    );
  });

  it("turns status changes into an operational verb", () => {
    const suspended = describeUserActivityEvent(
      buildEvent({
        action: "status_changed",
        payload: { from: "active", to: "suspended" },
      }),
      NAMES,
    );

    expect(userActivitySentenceToText(suspended.sentence)).toBe(
      "Ana Ruiz suspendió el acceso de Luis Pérez",
    );
    expect(suspended.emphasis).toBe(true);
    expect(suspended.detail).toBeNull();

    expect(
      sentenceOf(
        buildEvent({
          action: "status_changed",
          payload: { from: "active", to: "inactive" },
        }),
      ),
    ).toBe("Ana Ruiz dio de baja a Luis Pérez");

    expect(
      sentenceOf(
        buildEvent({
          action: "status_changed",
          payload: { from: "suspended", to: "active" },
        }),
      ),
    ).toBe("Ana Ruiz reactivó a Luis Pérez");
  });

  it("uses the invited email when the person is not a user yet", () => {
    const event = buildEvent({
      action: "invitation_sent",
      subjectUserId: null,
      payload: { email: "nuevo@tlama.mx", role: "driver" },
    });

    const description = describeUserActivityEvent(event, { subjectName: null });

    expect(userActivitySentenceToText(description.sentence)).toBe(
      "Ana Ruiz invitó a nuevo@tlama.mx como Conductor",
    );
    expect(description.category).toBe("invitacion");
  });

  it("never leaks the invitation identifier", () => {
    const event = buildEvent({
      action: "invitation_resent",
      payload: { email: "nuevo@tlama.mx", invitationId: "3f2a91c8-0000" },
    });

    expect(sentenceOf(event, { subjectName: null })).toBe(
      "Ana Ruiz reenvió la invitación a nuevo@tlama.mx",
    );
    expect(describeUserActivityEvent(event, {}).detail).toBeNull();
  });

  it("explains a password change without security jargon", () => {
    const description = describeUserActivityEvent(
      buildEvent({ action: "password_changed_self" }),
      NAMES,
    );

    expect(userActivitySentenceToText(description.sentence)).toBe(
      "Ana Ruiz cambió su contraseña",
    );
    expect(description.detail).toBe(
      "Se cerró la sesión en sus demás dispositivos.",
    );
  });

  it("drops the raw timestamp of the first-use guide", () => {
    const description = describeUserActivityEvent(
      buildEvent({
        action: "onboarding_completed_product",
        payload: { completedAt: "2026-04-10T18:04:00.000Z" },
      }),
      NAMES,
    );

    expect(userActivitySentenceToText(description.sentence)).toBe(
      "Ana Ruiz completó la guía de primer uso",
    );
    expect(description.detail).toBeNull();
  });

  it("describes unmapped actions without exposing the API code", () => {
    const sentence = sentenceOf(buildEvent({ action: "session_revoked_all" }));

    expect(sentence).toBe("Ana Ruiz hizo otro cambio en la cuenta de Luis Pérez");
    expect(sentence).not.toContain("session_revoked_all");
  });

  it("falls back to a readable label when the account no longer exists", () => {
    const sentence = sentenceOf(
      buildEvent({ action: "status_changed", payload: { to: "inactive" } }),
      { subjectName: null },
    );

    expect(sentence).toBe("Ana Ruiz dio de baja a una cuenta eliminada");
    expect(sentence).not.toContain("user-2");
  });

  it("attributes events without actor to the system", () => {
    const event = buildEvent({
      actorUserId: null,
      actorEmail: null,
      actorFirstName: null,
      actorLastName: null,
    });

    expect(sentenceOf(event)).toBe("El sistema dio de alta a Luis Pérez");
  });

  it("omits the subject on the account detail card", () => {
    const event = buildEvent({
      action: "user_updated",
      payload: { changes: { role: { from: "dispatcher", to: "accountant" } } },
    });

    expect(
      sentenceOf(event, { subjectName: "Luis Pérez", includeSubject: false }),
    ).toBe("Ana Ruiz cambió el rol");
  });
});
