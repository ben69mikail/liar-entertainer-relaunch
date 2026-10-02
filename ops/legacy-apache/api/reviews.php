<?php
/**
 * Google Reviews API Proxy
 * Ruft Rezensionen von der Google Places API (New) ab,
 * akkumuliert sie in einem lokalen Cache und liefert sie als JSON.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
// 1 Stunde Browser-Cache, 6 Stunden CDN-Cache
header('Cache-Control: public, max-age=600, s-maxage=1800');

// ── Konfiguration laden ──────────────────────────────────
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(200);
    echo json_encode(['reviews' => [], 'total_reviews' => 400, 'average_rating' => 5.0, 'error' => 'config_missing']);
    exit;
}
require_once $configFile;

// Konstanten aus config.php: GOOGLE_PLACE_ID, GOOGLE_API_KEY
if (!defined('GOOGLE_PLACE_ID') || !defined('GOOGLE_API_KEY')) {
    http_response_code(200);
    echo json_encode(['reviews' => [], 'total_reviews' => 400, 'average_rating' => 5.0, 'error' => 'config_incomplete']);
    exit;
}

// ── Cache-Einstellungen ──────────────────────────────────
define('CACHE_FILE', __DIR__ . '/reviews-cache.json');
define('CACHE_TTL', 604800);       // 7 Tage (1x pro Woche neue Reviews holen)
define('MAX_POOL_AGE_DAYS', 90);   // Nur Reviews der letzten 3 Monate

// ── Cache laden oder erstellen ───────────────────────────
$cache = ['reviews' => [], 'last_fetch' => 0, 'total_reviews' => 400, 'average_rating' => 5.0];

if (file_exists(CACHE_FILE)) {
    $raw = file_get_contents(CACHE_FILE);
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $cache = array_merge($cache, $decoded);
    }
}

// ── Sprach-Version: bei Umstellung auf Deutsch alten (fremdsprachigen) Pool leeren ──
if (($cache['lang'] ?? '') !== 'de') {
    $cache['reviews'] = [];
    $cache['last_fetch'] = 0;   // erzwingt sofortigen Neu-Abruf auf Deutsch
    $cache['lang'] = 'de';
}

// ── Google Places API abrufen wenn Cache abgelaufen ──────
$now = time();
if (($now - $cache['last_fetch']) > CACHE_TTL) {
    $newReviews = fetchGoogleReviews();
    if ($newReviews !== null) {
        // Neue Reviews in Pool mergen (Deduplizierung)
        $existingKeys = [];
        foreach ($cache['reviews'] as $r) {
            $existingKeys[reviewKey($r)] = true;
        }
        foreach ($newReviews['reviews'] as $review) {
            $key = reviewKey($review);
            if (!isset($existingKeys[$key])) {
                $cache['reviews'][] = $review;
                $existingKeys[$key] = true;
            }
        }
        // Meta-Daten aktualisieren
        if (isset($newReviews['total_reviews'])) {
            $cache['total_reviews'] = $newReviews['total_reviews'];
        }
        if (isset($newReviews['average_rating'])) {
            $cache['average_rating'] = $newReviews['average_rating'];
        }
        $cache['last_fetch'] = $now;

        // Cache speichern
        $cacheDir = dirname(CACHE_FILE);
        if (is_writable($cacheDir)) {
            file_put_contents(CACHE_FILE, json_encode($cache, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }
    }
}

// ── Reviews filtern (letzte 3 Monate) ───────────────────
$cutoff = $now - (MAX_POOL_AGE_DAYS * 86400);
$recentReviews = array_values(array_filter($cache['reviews'], function($r) use ($cutoff) {
    return isset($r['time']) && $r['time'] >= $cutoff;
}));

// Fallback: Wenn keine Reviews in den letzten 3 Monaten, alle zurückgeben
if (count($recentReviews) < 3) {
    $recentReviews = $cache['reviews'];
}

// ── JSON-Antwort ─────────────────────────────────────────
echo json_encode([
    'reviews' => $recentReviews,
    'total_reviews' => $cache['total_reviews'],
    'average_rating' => $cache['average_rating'],
    'last_updated' => date('c', $cache['last_fetch']),
    'pool_size' => count($cache['reviews']),
], JSON_UNESCAPED_UNICODE);

// ══════════════════════════════════════════════════════════
// Hilfsfunktionen
// ══════════════════════════════════════════════════════════

function reviewKey(array $review): string {
    $name = $review['author_name'] ?? '';
    $text = substr($review['text'] ?? '', 0, 50);
    return md5($name . '|' . $text);
}

function fetchGoogleReviews(): ?array {
    $placeId = GOOGLE_PLACE_ID;
    $apiKey = GOOGLE_API_KEY;

    // Google Places API (New) Endpoint
    $url = "https://places.googleapis.com/v1/places/{$placeId}?languageCode=de&regionCode=DE";
    $fields = 'reviews,rating,userRatingCount';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            "X-Goog-Api-Key: {$apiKey}",
            "X-Goog-FieldMask: {$fields}",
            'Content-Type: application/json',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        return null;
    }

    // Reviews normalisieren
    $reviews = [];
    if (isset($data['reviews']) && is_array($data['reviews'])) {
        foreach ($data['reviews'] as $r) {
            $publishTime = $r['publishTime'] ?? null;
            $timestamp = $publishTime ? strtotime($publishTime) : time();

            $reviews[] = [
                'author_name' => $r['authorAttribution']['displayName'] ?? 'Anonym',
                'rating' => $r['rating'] ?? 5,
                'text' => $r['text']['text'] ?? $r['originalText']['text'] ?? '',
                'time' => $timestamp,
                'relative_time' => relativeTime($timestamp),
                'profile_photo_url' => $r['authorAttribution']['photoUri'] ?? null,
            ];
        }
    }

    return [
        'reviews' => $reviews,
        'total_reviews' => $data['userRatingCount'] ?? null,
        'average_rating' => $data['rating'] ?? null,
    ];
}

function relativeTime(int $timestamp): string {
    $diff = time() - $timestamp;
    if ($diff < 604800) return 'vor ' . max(1, intdiv($diff, 86400)) . ' Tagen';
    if ($diff < 2592000) return 'vor ' . max(1, intdiv($diff, 604800)) . ' Wochen';
    if ($diff < 31536000) return 'vor ' . max(1, intdiv($diff, 2592000)) . ' Monaten';
    return 'vor ' . max(1, intdiv($diff, 31536000)) . ' Jahren';
}
