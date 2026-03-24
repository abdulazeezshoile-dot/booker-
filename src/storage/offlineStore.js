// Mark a row and outbox action as conflict
export async function markConflict(entityType, localId, actionId) {
  // Mark local row as conflict
  let table = null;
  if (entityType === 'inventory') table = 'local_inventory';
  if (entityType === 'transaction') table = 'local_transactions';
  if (entityType === 'debt') table = 'local_debts';
  if (!table) return;
  await executeSql(`UPDATE ${table} SET sync_status = 'conflict' WHERE local_id = ?`, [localId]);
  // Mark outbox action as conflict
  await executeSql('UPDATE sync_outbox SET last_error = ?, sync_status = ? WHERE action_id = ?', ['conflict', 'conflict', actionId]);
}

// Get a local row by entity type and localId
export async function getLocalRow(entityType, localId) {
  let table = null;
  if (entityType === 'inventory') table = 'local_inventory';
  if (entityType === 'transaction') table = 'local_transactions';
  if (entityType === 'debt') table = 'local_debts';
  if (!table) return null;
  const res = await executeSql(`SELECT * FROM ${table} WHERE local_id = ?`, [localId]);
  if (res.rows.length > 0) return res.rows.item(0);
  return null;
}
import { executeSql } from './sqlite';
// --- Workspace-isolated local tables ---
// TODO: Implement full CRUD for local_workspaces, local_inventory, local_transactions, local_debts
// All local entity access must require workspaceLocalId
export async function getLocalWorkspaces() {
  return executeSql('SELECT * FROM local_workspaces');
}

export async function getLocalInventory(workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('SELECT * FROM local_inventory WHERE workspace_local_id = ?', [workspaceLocalId]);
}

export async function getLocalTransactions(workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('SELECT * FROM local_transactions WHERE workspace_local_id = ?', [workspaceLocalId]);
}

export async function getLocalDebts(workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('SELECT * FROM local_debts WHERE workspace_local_id = ?', [workspaceLocalId]);
}

// Insert/update/delete helpers for local entities (always workspace-scoped)
export async function upsertLocalInventory(item, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    `INSERT OR REPLACE INTO local_inventory (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.local_id,
      item.server_id || null,
      workspaceLocalId,
      item.workspace_server_id || null,
      JSON.stringify(item.data),
      item.sync_status || 'pending_create',
      item.last_error || null,
      item.updated_at_local || Date.now(),
    ]
  );
}

export async function upsertLocalTransaction(item, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    `INSERT OR REPLACE INTO local_transactions (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.local_id,
      item.server_id || null,
      workspaceLocalId,
      item.workspace_server_id || null,
      JSON.stringify(item.data),
      item.sync_status || 'pending_create',
      item.last_error || null,
      item.updated_at_local || Date.now(),
    ]
  );
}

export async function upsertLocalDebt(item, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql(
    `INSERT OR REPLACE INTO local_debts (local_id, server_id, workspace_local_id, workspace_server_id, data, sync_status, last_error, updated_at_local)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.local_id,
      item.server_id || null,
      workspaceLocalId,
      item.workspace_server_id || null,
      JSON.stringify(item.data),
      item.sync_status || 'pending_create',
      item.last_error || null,
      item.updated_at_local || Date.now(),
    ]
  );
}

export async function deleteLocalInventory(localId, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('DELETE FROM local_inventory WHERE local_id = ? AND workspace_local_id = ?', [localId, workspaceLocalId]);
}

export async function deleteLocalTransaction(localId, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('DELETE FROM local_transactions WHERE local_id = ? AND workspace_local_id = ?', [localId, workspaceLocalId]);
}

export async function deleteLocalDebt(localId, workspaceLocalId) {
  if (!workspaceLocalId) throw new Error('workspaceLocalId required');
  return executeSql('DELETE FROM local_debts WHERE local_id = ? AND workspace_local_id = ?', [localId, workspaceLocalId]);
}

// --- Structured outbox ---
export async function addSyncOutboxAction(action) {
  // action: { action_id, action_type, entity_type, entity_local_id, workspace_ref, payload, depends_on_action_id, retry_count, next_retry_at, last_error, created_at, updated_at }
  return executeSql(
    `INSERT OR REPLACE INTO sync_outbox (action_id, action_type, entity_type, entity_local_id, workspace_ref, payload, depends_on_action_id, retry_count, next_retry_at, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      action.action_id,
      action.action_type,
      action.entity_type,
      action.entity_local_id,
      action.workspace_ref,
      JSON.stringify(action.payload),
      action.depends_on_action_id,
      action.retry_count || 0,
      action.next_retry_at || null,
      action.last_error || null,
      action.created_at || Date.now(),
      action.updated_at || Date.now(),
    ]
  );
}

export async function getSyncOutboxActions() {
  return executeSql('SELECT * FROM sync_outbox ORDER BY next_retry_at ASC, created_at ASC');
}

// --- ID mapping helpers ---
export async function setIdMapping(entityType, localId, serverId) {
  return executeSql(
    'INSERT OR REPLACE INTO id_mapping (entity_type, local_id, server_id) VALUES (?, ?, ?)',
    [entityType, localId, serverId]
  );
}

export async function getServerId(entityType, localId) {
  const res = await executeSql('SELECT server_id FROM id_mapping WHERE entity_type = ? AND local_id = ?', [entityType, localId]);
  if (res.rows.length > 0) {
    return res.rows.item(0).server_id;
  }
  return null;
}

export async function cacheInventory(workspaceId, items) {
  try {
    const now = Date.now();
    const deleteSql = `DELETE FROM inventory WHERE workspaceId = ?`;
    await executeSql(deleteSql, [workspaceId]);

    const insertSql = `INSERT OR REPLACE INTO inventory (id, workspaceId, data, updatedAt) VALUES (?, ?, ?, ?)`;
    const promises = items.map((item) => {
      return executeSql(insertSql, [item.id, workspaceId, JSON.stringify(item), now]);
    });
    await Promise.all(promises);
  } catch {
    // SQLite may not be available (e.g., web) or errors may occur; ignore
  }
}

export async function getCachedInventory(workspaceId) {
  try {
    const rows = await executeSql(`SELECT data FROM inventory WHERE workspaceId = ?`, [workspaceId]);
    const results = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      try {
        results.push(JSON.parse(row.data));
      } catch {
        // ignore parse errors
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function cacheDebts(workspaceId, debts) {
  try {
    const now = Date.now();
    const deleteSql = `DELETE FROM debts WHERE workspaceId = ?`;
    await executeSql(deleteSql, [workspaceId]);

    const insertSql = `INSERT OR REPLACE INTO debts (id, workspaceId, data, updatedAt) VALUES (?, ?, ?, ?)`;
    const promises = debts.map((item) => {
      return executeSql(insertSql, [item.id, workspaceId, JSON.stringify(item), now]);
    });
    await Promise.all(promises);
  } catch {
    // ignore
  }
}

export async function getCachedDebts(workspaceId) {
  try {
    const rows = await executeSql(`SELECT data FROM debts WHERE workspaceId = ?`, [workspaceId]);
    const results = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      try {
        results.push(JSON.parse(row.data));
      } catch {
        // ignore parse errors
      }
    }
    return results;
  } catch {
    return [];
  }
}

export async function cacheTransactions(workspaceId, type, transactions) {
  try {
    const now = Date.now();
    const deleteSql = `DELETE FROM transactions WHERE workspaceId = ? AND type = ?`;
    await executeSql(deleteSql, [workspaceId, type]);

    const insertSql = `INSERT OR REPLACE INTO transactions (id, workspaceId, type, data, updatedAt) VALUES (?, ?, ?, ?, ?)`;
    const promises = transactions.map((item) => {
      return executeSql(insertSql, [item.id, workspaceId, type, JSON.stringify(item), now]);
    });
    await Promise.all(promises);
  } catch {
    // ignore
  }
}

export async function getCachedTransactions(workspaceId, type) {
  try {
    const rows = await executeSql(`SELECT data FROM transactions WHERE workspaceId = ? AND type = ?`, [workspaceId, type]);
    const results = [];
    for (let i = 0; i < rows.rows.length; i += 1) {
      const row = rows.rows.item(i);
      try {
        results.push(JSON.parse(row.data));
      } catch {
        // ignore parse errors
      }
    }
    return results;
  } catch {
    return [];
  }
}
