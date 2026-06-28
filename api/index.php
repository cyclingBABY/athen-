<?php
// ============================================
// Database Query Engine & API Router
// api/index.php
// ============================================

require_once __DIR__ . '/config.php';

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?: [];

$table = isset($body['table']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $body['table']) : '';
$action = isset($body['action']) ? $body['action'] : '';

if (!$table || !$action) {
    http_response_code(400);
    echo json_encode(["error" => "Table name and action are required"]);
    exit();
}

// Relation Mapping for Sub-Selection Joins (e.g. select('*, books(title, author)'))
$relationMap = [
    'reservations' => [
        'books' => ['local_key' => 'book_id', 'foreign_table' => 'books', 'foreign_key' => 'id', 'is_array' => false],
        'profiles' => ['local_key' => 'user_id', 'foreign_table' => 'profiles', 'foreign_key' => 'user_id', 'is_array' => false]
    ],
    'circulation_records' => [
        'books' => ['local_key' => 'book_id', 'foreign_table' => 'books', 'foreign_key' => 'id', 'is_array' => false],
        'profiles' => ['local_key' => 'user_id', 'foreign_table' => 'profiles', 'foreign_key' => 'user_id', 'is_array' => false]
    ],
    'borrow_records' => [
        'books' => ['local_key' => 'book_id', 'foreign_table' => 'books', 'foreign_key' => 'id', 'is_array' => false],
        'book_copies' => ['local_key' => 'copy_id', 'foreign_table' => 'book_copies', 'foreign_key' => 'id', 'is_array' => false],
        'profiles' => ['local_key' => 'user_id', 'foreign_table' => 'profiles', 'foreign_key' => 'user_id', 'is_array' => false]
    ],
    'reading_list_items' => [
        'books' => ['local_key' => 'book_id', 'foreign_table' => 'books', 'foreign_key' => 'id', 'is_array' => false]
    ],
    'course_reading_lists' => [
        'profiles' => ['local_key' => 'lecturer_id', 'foreign_table' => 'profiles', 'foreign_key' => 'user_id', 'is_array' => false]
    ],
    'fines' => [
        'circulation_records' => ['local_key' => 'circulation_id', 'foreign_table' => 'circulation_records', 'foreign_key' => 'id', 'is_array' => false],
        'profiles' => ['local_key' => 'user_id', 'foreign_table' => 'profiles', 'foreign_key' => 'user_id', 'is_array' => false]
    ]
];

// Helper to escape column names safely using backticks (needed for words like `condition`)
function escapeCol($col) {
    return "`" . str_replace("`", "``", $col) . "`";
}

try {
    // 1. Build Filter/Where Clause
    $whereClauses = [];
    $params = [];
    $filters = isset($body['filters']) ? $body['filters'] : [];
    
    foreach ($filters as $index => $filter) {
        $col = escapeCol($filter['col']);
        $op = $filter['op'];
        $val = $filter['val'];
        $paramName = "filter_{$index}";
        
        switch ($op) {
            case 'eq':
                $whereClauses[] = "{$col} = :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'neq':
                $whereClauses[] = "{$col} != :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'gt':
                $whereClauses[] = "{$col} > :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'lt':
                $whereClauses[] = "{$col} < :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'gte':
                $whereClauses[] = "{$col} >= :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'lte':
                $whereClauses[] = "{$col} <= :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'like':
                $whereClauses[] = "{$col} LIKE :{$paramName}";
                $params[$paramName] = $val;
                break;
            case 'ilike':
                $whereClauses[] = "LOWER({$col}) LIKE LOWER(:{$paramName})";
                $params[$paramName] = $val;
                break;
            case 'not_is':
                if ($val === null || strtolower($val) === 'null') {
                    $whereClauses[] = "{$col} IS NOT NULL";
                } else {
                    $whereClauses[] = "{$col} != :{$paramName}";
                    $params[$paramName] = $val;
                }
                break;
            case 'in':
                if (is_array($val) && count($val) > 0) {
                    $inClauses = [];
                    foreach ($val as $subIndex => $subVal) {
                        $subParamName = "{$paramName}_{$subIndex}";
                        $inClauses[] = ":{$subParamName}";
                        $params[$subParamName] = $subVal;
                    }
                    $whereClauses[] = "{$col} IN (" . implode(', ', $inClauses) . ")";
                } else {
                    $whereClauses[] = "1 = 0"; // Always false if IN list is empty
                }
                break;
            default:
                break;
        }
    }
    
    $whereSql = "";
    if (count($whereClauses) > 0) {
        $whereSql = " WHERE " . implode(" AND ", $whereClauses);
    }

    // ============================================
    // ACTION: SELECT
    // ============================================
    if ($action === 'select') {
        $selectStr = isset($body['select']) ? $body['select'] : '*';
        
        // Build base select sql (always query actual table columns)
        $sql = "SELECT * FROM " . escapeCol($table) . $whereSql;
        
        // Add ordering
        $orderCol = isset($body['orderCol']) ? $body['orderCol'] : null;
        if ($orderCol) {
            $orderAsc = isset($body['orderAsc']) ? $body['orderAsc'] : true;
            $sql .= " ORDER BY " . escapeCol($orderCol) . ($orderAsc ? " ASC" : " DESC");
        }
        
        // Add limits
        $limitVal = isset($body['limitVal']) ? $body['limitVal'] : null;
        if ($limitVal) {
            $sql .= " LIMIT " . intval($limitVal);
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        
        // Parse sub-relations (e.g. books(title, author))
        // Format: books(title, author) or profiles(full_name, email)
        preg_match_all('/(\w+)\(([^)]+)\)/', $selectStr, $matches, PREG_SET_ORDER);
        $relationsToFetch = [];
        foreach ($matches as $match) {
            $relName = $match[1];
            $relFields = array_map('trim', explode(',', $match[2]));
            $relationsToFetch[$relName] = $relFields;
        }
        
        // Fetch and merge sub-relations (100% robust nested array attachments)
        if (count($rows) > 0 && count($relationsToFetch) > 0 && isset($relationMap[$table])) {
            foreach ($relationsToFetch as $relName => $fields) {
                if (isset($relationMap[$table][$relName])) {
                    $relConfig = $relationMap[$table][$relName];
                    $localKey = $relConfig['local_key'];
                    $foreignTable = $relConfig['foreign_table'];
                    $foreignKey = $relConfig['foreign_key'];
                    
                    // Collect all non-null local keys
                    $localKeys = array_filter(array_unique(array_column($rows, $localKey)));
                    
                    if (count($localKeys) > 0) {
                        // Select subfields or all
                        $escapedFields = array_map('escapeCol', $fields);
                        $fieldsSql = "*";
                        if (!in_array('*', $fields)) {
                            // Ensure foreign key is included for matching
                            if (!in_array($foreignKey, $fields)) {
                                $escapedFields[] = escapeCol($foreignKey);
                            }
                            $fieldsSql = implode(', ', $escapedFields);
                        }
                        
                        $inClauses = [];
                        $relParams = [];
                        foreach (array_values($localKeys) as $idx => $kVal) {
                            $pName = "rel_{$relName}_{$idx}";
                            $inClauses[] = ":{$pName}";
                            $relParams[$pName] = $kVal;
                        }
                        
                        $relSql = "SELECT {$fieldsSql} FROM " . escapeCol($foreignTable) . " WHERE " . escapeCol($foreignKey) . " IN (" . implode(', ', $inClauses) . ")";
                        $relStmt = $pdo->prepare($relSql);
                        $relStmt->execute($relParams);
                        $relRows = $relStmt->fetchAll();
                        
                        // Map relation records by their foreign key
                        $relMap = [];
                        foreach ($relRows as $rRow) {
                            $k = $rRow[$foreignKey];
                            if ($relConfig['is_array']) {
                                $relMap[$k][] = $rRow;
                            } else {
                                $relMap[$k] = $rRow;
                            }
                        }
                        
                        // Attach sub-relations to primary table rows
                        foreach ($rows as &$row) {
                            $lkVal = $row[$localKey];
                            $row[$relName] = isset($relMap[$lkVal]) ? $relMap[$lkVal] : null;
                        }
                        unset($row);
                    } else {
                        // Fill relations with defaults if empty
                        foreach ($rows as &$row) {
                            $row[$relName] = $relConfig['is_array'] ? [] : null;
                        }
                        unset($row);
                    }
                }
            }
        }
        
        // Single/MaybeSingle results
        $isSingle = isset($body['isSingle']) ? $body['isSingle'] : false;
        $isMaybeSingle = isset($body['isMaybeSingle']) ? $body['isMaybeSingle'] : false;
        
        if ($isSingle || $isMaybeSingle) {
            $data = (count($rows) > 0) ? $rows[0] : null;
            if ($isSingle && $data === null) {
                http_response_code(404);
                echo json_encode(["error" => "No record found"]);
                exit();
            }
            echo json_encode(["data" => $data]);
            exit();
        }
        
        echo json_encode(["data" => $rows]);
        exit();

    // ============================================
    // ACTION: INSERT
    // ============================================
    } else if ($action === 'insert') {
        $payload = isset($body['payload']) ? $body['payload'] : [];
        if (count($payload) === 0) {
            http_response_code(400);
            echo json_encode(["error" => "Insert payload is empty"]);
            exit();
        }
        
        // Check if single record or multiple
        $isMultiple = isset($payload[0]) && is_array($payload[0]);
        $records = $isMultiple ? $payload : [$payload];
        
        $insertedRecords = [];
        $pdo->beginTransaction();
        
        foreach ($records as $record) {
            // Auto generate UUID if primary key 'id' is missing
            if (!isset($record['id']) || !$record['id']) {
                $record['id'] = guidv4();
            }

            // ── Table-specific auto-fill ─────────────────────────────────
            if ($table === 'circulation_records') {
                if (!isset($record['checkout_date']) || !$record['checkout_date']) {
                    $record['checkout_date'] = date('Y-m-d H:i:s');
                }
                if (!isset($record['due_date']) || !$record['due_date']) {
                    $record['due_date'] = date('Y-m-d H:i:s', strtotime('+14 days'));
                }
                if (!isset($record['status']) || !$record['status']) {
                    $record['status'] = 'borrowed';
                }
                if (!isset($record['renewed_count'])) {
                    $record['renewed_count'] = 0;
                }
                // Also set borrowed_at for schema compatibility
                if (!isset($record['borrowed_at'])) {
                    $record['borrowed_at'] = $record['checkout_date'];
                }
            }

            if ($table === 'fines') {
                // App uses 'amount'; schema also has 'fine_amount' — keep both in sync
                if (isset($record['amount']) && !isset($record['fine_amount'])) {
                    $record['fine_amount'] = $record['amount'];
                }
                if (isset($record['fine_amount']) && !isset($record['amount'])) {
                    $record['amount'] = $record['fine_amount'];
                }
                // App uses 'paid'; schema also has 'is_paid' — keep both in sync
                if (isset($record['paid']) && !isset($record['is_paid'])) {
                    $record['is_paid'] = $record['paid'] ? 1 : 0;
                }
                if (!isset($record['paid'])) {
                    $record['paid'] = 0;
                }
                if (!isset($record['is_paid'])) {
                    $record['is_paid'] = 0;
                }
            }
            // ─────────────────────────────────────────────────────────────

            $cols = array_keys($record);
            $escapedCols = array_map('escapeCol', $cols);
            $placeholders = array_map(function($c) { return ":ins_{$c}"; }, $cols);
            
            $sql = "INSERT INTO " . escapeCol($table) . " (" . implode(', ', $escapedCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            
            $bindParams = [];
            foreach ($record as $col => $val) {
                // PDO Helper for Booleans
                if (is_bool($val)) {
                    $val = $val ? 1 : 0;
                }
                if (is_array($val) || is_object($val)) {
                    $val = json_encode($val);
                }
                $bindParams["ins_{$col}"] = $val;
            }
            
            $stmt->execute($bindParams);
            $insertedRecords[] = $record;
        }
        
        $pdo->commit();
        
        // Return matching format
        $responseData = $isMultiple ? $insertedRecords : $insertedRecords[0];
        echo json_encode(["data" => $responseData]);
        exit();

    // ============================================
    // ACTION: UPDATE
    // ============================================
    } else if ($action === 'update') {
        $payload = isset($body['payload']) ? $body['payload'] : [];
        if (count($payload) === 0) {
            http_response_code(400);
            echo json_encode(["error" => "Update payload is empty"]);
            exit();
        }
        
        $setClauses = [];
        $updateParams = [];

        // ── Table-specific update sync ────────────────────────────────
        if ($table === 'book_trackings') {
            // Optional convenience mapping (no-op if columns are already correct)
            if (isset($payload['borrowed_at']) && !isset($payload['borrowed_at'])) {
                $payload['borrowed_at'] = $payload['borrowed_at'];
            }
        }

        if ($table === 'fines') {

            // Sync paid ↔ is_paid
            if (isset($payload['paid']) && !isset($payload['is_paid'])) {
                $payload['is_paid'] = $payload['paid'] ? 1 : 0;
            }
            if (isset($payload['is_paid']) && !isset($payload['paid'])) {
                $payload['paid'] = $payload['is_paid'] ? 1 : 0;
            }
            // Sync amount ↔ fine_amount
            if (isset($payload['amount']) && !isset($payload['fine_amount'])) {
                $payload['fine_amount'] = $payload['amount'];
            }
            if (isset($payload['fine_amount']) && !isset($payload['amount'])) {
                $payload['amount'] = $payload['fine_amount'];
            }
        }
        if ($table === 'circulation_records') {
            // Sync return_date ↔ returned_at
            if (isset($payload['return_date']) && !isset($payload['returned_at'])) {
                $payload['returned_at'] = $payload['return_date'];
            }
            if (isset($payload['returned_at']) && !isset($payload['return_date'])) {
                $payload['return_date'] = $payload['returned_at'];
            }
        }
        // ─────────────────────────────────────────────────────────────

        foreach ($payload as $col => $val) {
            $escapedCol = escapeCol($col);
            $paramName = "upd_{$col}";
            $setClauses[] = "{$escapedCol} = :{$paramName}";
            
            if (is_bool($val)) {
                $val = $val ? 1 : 0;
            }
            if (is_array($val) || is_object($val)) {
                $val = json_encode($val);
            }
            $updateParams[$paramName] = $val;
        }
        
        // Merge update parameters with filter parameters
        $allParams = array_merge($updateParams, $params);
        
        $sql = "UPDATE " . escapeCol($table) . " SET " . implode(', ', $setClauses) . $whereSql;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($allParams);
        
        // Fetch and return the updated records for frontend state synchrony
        $selectSql = "SELECT * FROM " . escapeCol($table) . $whereSql;
        $selectStmt = $pdo->prepare($selectSql);
        $selectStmt->execute($params);
        $updatedRecords = $selectStmt->fetchAll();
        
        echo json_encode(["data" => $updatedRecords]);
        exit();

    // ============================================
    // ACTION: DELETE
    // ============================================
    } else if ($action === 'delete') {
        $sql = "DELETE FROM " . escapeCol($table) . $whereSql;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(["data" => []]);
        exit();
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid database action"]);
        exit();
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
    exit();
}
