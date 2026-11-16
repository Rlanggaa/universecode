/**
 * Hardened Red-Team Security Verification Suite for Aetherium Codex Firestore Rules
 * Verifies all 12 "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface SimulatedPayloadTest {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOAD_TESTS: SimulatedPayloadTest[] = [
  {
    id: 1,
    name: 'Unverified Email Write',
    collection: '/workspaces/ws-1',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: false }, data: { ownerId: 'u1', name: 'Test' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Identity Spoofing on Create',
    collection: '/worlds/w-1',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { ownerId: 'u2', workspaceId: 'ws-1', name: 'Spoofed' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Create',
    collection: '/articles/art-1',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { ownerId: 'u1', worldId: 'w-1', title: 'Lore', isFeatured: true } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Update',
    collection: '/articles/art-1',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { hacked: 1 } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Orphaned World Creation',
    collection: '/worlds/w-orphan',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { ownerId: 'u1', workspaceId: 'ws-nonexistent' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Cross-Tenant Parent Attachment',
    collection: '/articles/art-hijack',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { ownerId: 'u1', worldId: 'w-owned-by-u2' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    collection: '/workspaces/invalid$id!with*spaces',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { ownerId: 'u1' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Value Poisoning on Update',
    collection: '/articles/art-1',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { title: true } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Immortal Field Mutation',
    collection: '/workspaces/ws-1',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { ownerId: 'u2', createdAt: '1999-01-01T00:00:00Z' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Forged Client Timestamp',
    collection: '/worlds/w-1',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { updatedAt: '2099-01-01T00:00:00Z' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Terminal State Mutation on Archived Article',
    collection: '/articles/art-archived',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, existingStatus: 'archived', data: { title: 'Mutated after archive' } },
    expectedOutcome: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Blanket List Scraping Without Owner Filter',
    collection: '/workspaces',
    operation: 'list',
    payload: { auth: { uid: 'u1', email_verified: true }, queryFilter: 'NONE' },
    expectedOutcome: 'PERMISSION_DENIED'
  }
];
