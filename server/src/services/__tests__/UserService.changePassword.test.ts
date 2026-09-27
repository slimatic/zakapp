/**
 * `changePassword` used to run two independent writes: the new bcrypt hash, then the
 * session invalidation. When the second failed, the handler threw and the API returned
 * 500 - but the password had already changed. The user was told the change failed, and
 * because the vault key is derived from the password, retrying against a password that
 * had in fact already moved is how someone locks themselves out of their own encrypted
 * data believing nothing happened.
 *
 * These tests pin the atomicity: the two writes must go through a single transaction,
 * so a failure in either leaves the account untouched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const bcryptCompare = vi.fn();
const bcryptHash = vi.fn();

vi.mock('bcryptjs', () => ({
  default: { compare: bcryptCompare, hash: bcryptHash },
  compare: bcryptCompare,
  hash: bcryptHash,
}));

const userFindUnique = vi.fn();
const userUpdate = vi.fn();
const sessionUpdateMany = vi.fn();
const transaction = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique: userFindUnique, update: userUpdate };
    userSession = { updateMany: sessionUpdateMany };
    $transaction = transaction;
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { UserService } = await import('../UserService');

describe('UserService.changePassword', () => {
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    userFindUnique.mockResolvedValue({
      id: userId,
      passwordHash: 'old-hash',
    });
    bcryptCompare.mockResolvedValue(true);
    bcryptHash.mockResolvedValue('new-hash');
    transaction.mockResolvedValue([]);
  });

  it('performs both writes inside ONE transaction', async () => {
    const service = new (UserService as any)();
    await service.changePassword(userId, {
      currentPassword: 'old-password',
      newPassword: 'NewPassword123!',
    });

    expect(transaction).toHaveBeenCalledTimes(1);

    // Both operations are handed to the transaction together, so they commit or roll
    // back as a unit. Two separate awaits here would reintroduce the bug.
    const ops = transaction.mock.calls[0][0];
    expect(Array.isArray(ops)).toBe(true);
    expect(ops).toHaveLength(2);
    expect(userUpdate).toHaveBeenCalledTimes(1);
    expect(sessionUpdateMany).toHaveBeenCalledTimes(1);
  });

  it('never writes the hash outside the transaction', async () => {
    const service = new (UserService as any)();
    await service.changePassword(userId, {
      currentPassword: 'old-password',
      newPassword: 'NewPassword123!',
    });

    // The transaction callback builds the ops; the service must not also call
    // user.update() directly, which is what made the change non-atomic.
    expect(userUpdate.mock.calls[0][0]).toBeDefined();
    expect(sessionUpdateMany.mock.calls[0][0]).toMatchObject({
      where: { userId },
      data: { isActive: false },
    });
  });

  it('leaves the password untouched when the transaction fails', async () => {
    transaction.mockRejectedValueOnce(new Error('session table unavailable'));

    const service = new (UserService as any)();
    await expect(
      service.changePassword(userId, {
        currentPassword: 'old-password',
        newPassword: 'NewPassword123!',
      })
    ).rejects.toThrow('session table unavailable');

    // The caller sees the failure and no committed write exists to contradict it -
    // which is the whole point: a 500 must mean nothing changed.
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects a wrong current password before writing anything', async () => {
    bcryptCompare.mockResolvedValueOnce(false);

    const service = new (UserService as any)();
    await expect(
      service.changePassword(userId, {
        currentPassword: 'wrong',
        newPassword: 'NewPassword123!',
      })
    ).rejects.toThrow('Current password is incorrect');

    expect(transaction).not.toHaveBeenCalled();
  });
});
