import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionApiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: sessionApiMocks.get,
      post: sessionApiMocks.post,
      delete: sessionApiMocks.delete,
    }),
  },
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

function user(id: number, name: string) {
  return {
    id,
    name,
    email: `user${id}@example.test`,
    role: "admin",
  };
}

describe("sessionClient", () => {
  beforeEach(() => {
    vi.resetModules();
    sessionApiMocks.get.mockReset();
    sessionApiMocks.post.mockReset();
    sessionApiMocks.delete.mockReset();
    window.localStorage.clear();
  });

  it("tidak memakai response load lama setelah logout", async () => {
    const pendingLoad = deferred<{ data: unknown }>();
    sessionApiMocks.get.mockReturnValueOnce(pendingLoad.promise);
    sessionApiMocks.delete.mockResolvedValueOnce({ data: { success: true } });

    const session = await import("./sessionClient");
    const load = session.loadCurrentUser(true);
    const logout = session.logout();

    pendingLoad.resolve({ data: { user: user(1, "Admin Lama") } });

    await expect(load).resolves.toBeNull();
    await logout;

    expect(session.getSessionSnapshot().user).toBeNull();
  });

  it("login baru hanya menyisakan data pengguna baru", async () => {
    const session = await import("./sessionClient");

    sessionApiMocks.post.mockResolvedValueOnce({
      data: { user: user(1, "Admin Lama") },
    });
    await session.login("lama@example.test", "password");

    sessionApiMocks.delete.mockResolvedValueOnce({ data: { success: true } });
    await session.logout();

    sessionApiMocks.post.mockResolvedValueOnce({
      data: { user: user(2, "Admin Baru") },
    });
    await session.login("baru@example.test", "password");

    expect(session.getSessionSnapshot().user).toMatchObject({
      id: 2,
      name: "Admin Baru",
    });
  });

  it("response login lama tidak menimpa login yang lebih baru", async () => {
    const firstLogin = deferred<{ data: unknown }>();
    const secondLogin = deferred<{ data: unknown }>();
    sessionApiMocks.post
      .mockReturnValueOnce(firstLogin.promise)
      .mockReturnValueOnce(secondLogin.promise);

    const session = await import("./sessionClient");
    const first = session.login("lama@example.test", "password");
    const second = session.login("baru@example.test", "password");

    secondLogin.resolve({ data: { user: user(2, "Admin Baru") } });
    await expect(second).resolves.toMatchObject({ id: 2 });

    firstLogin.resolve({ data: { user: user(1, "Admin Lama") } });
    await expect(first).resolves.toBeNull();

    expect(session.getSessionSnapshot().user).toMatchObject({ id: 2 });
  });
});
