<?php
/* database.php — MongoDB Connection · ResumeIQ v3.0 */
/*previously used mongodb compass and now mongodb atlas is used*/
require_once __DIR__ . '/../vendor/autoload.php';

use MongoDB\Client;
define('MONGO_URI',    'mongodb://localhost:27017');
define('MONGO_DB',     'resumeiq');
define('UPLOAD_DIR',   __DIR__ . '/../uploads/resumes/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024);
define('ALLOWED_EXTS', ['pdf', 'doc', 'docx']);

function getDB(): MongoDB\Database {
    static $db = null;
    if ($db === null) {
        $client = new MongoDB\Client(MONGO_URI);
        $db = $client->selectDatabase(MONGO_DB);
    }
    return $db;
}
function getCol(string $name): MongoDB\Collection {
    return getDB()->selectCollection($name);
}
function toObjId(string $id): MongoDB\BSON\ObjectId {
    return new MongoDB\BSON\ObjectId($id);
}
function nowUTC(): MongoDB\BSON\UTCDateTime {
    return new MongoDB\BSON\UTCDateTime();
}
function msToDate($dt): string {
    if ($dt instanceof MongoDB\BSON\UTCDateTime) {
        return $dt->toDateTime()->format('d M Y');
    }
    return '';
}
