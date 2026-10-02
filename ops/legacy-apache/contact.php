<?php
// ============================================
// Kontaktformular-Handler für liar-entertainer.com
// Sendet Anfragen an info@liar-entertainer.com via IONOS SMTP
// ============================================
//
// EINRICHTUNG AUF IONOS:
// 1. Diese Datei liegt im Root des Webspace (public/)
// 2. Das Formular sendet POST an /contact.php
// 3. SMTP-Zugangsdaten unten eintragen (IONOS E-Mail-Konto)
// 4. Falls SMTP fehlschlägt, wird PHP mail() als Fallback verwendet
//
// IONOS SMTP-Daten (bei IONOS unter E-Mail → E-Mail-Konto → Serverinformationen):
// - Server: smtp.ionos.de
// - Port: 587 (STARTTLS) oder 465 (SSL)
// - Benutzername: info@liar-entertainer.com (deine E-Mail-Adresse)
// - Passwort: dein E-Mail-Passwort
// ============================================

// ── KONFIGURATION ──────────────────────────
// TODO: Trage hier deine IONOS SMTP-Zugangsdaten ein!
define('SMTP_HOST',     'smtp.ionos.de');
define('SMTP_PORT',     587);
define('SMTP_USER',     'info@liar-entertainer.com');  // Deine IONOS E-Mail
define('SMTP_PASS',     getenv('SMTP_PASS') ?: '');      // REDACTED in relaunch repo – never commit credentials
define('MAIL_TO',       'info@liar-entertainer.com');
define('MAIL_FROM',     'info@liar-entertainer.com');
define('MAIL_FROM_NAME','Clown Zauberer LIAR Website');
// ────────────────────────────────────────────

// Nur POST-Anfragen akzeptieren
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /kontakt/');
    exit;
}

// Eingaben bereinigen
function clean(string $s): string {
    return htmlspecialchars(strip_tags(trim($s)), ENT_QUOTES, 'UTF-8');
}

$name      = clean($_POST['name']      ?? '');
$email     = clean($_POST['email']     ?? '');
$phone     = clean($_POST['phone']     ?? '');
$eventDate = clean($_POST['event-date'] ?? '');
$eventTime = clean($_POST['event-time'] ?? '');
$eventCity = clean($_POST['event-city'] ?? '');
$eventType = clean($_POST['event-type'] ?? '');
$message   = clean($_POST['message']   ?? '');

// Pflichtfelder prüfen (Name, E-Mail, Stadt sind Pflicht)
if (empty($name) || empty($email) || empty($eventCity) || !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    header('Location: /kontakt/?fehler=1');
    exit;
}

// ── SPAM-SCHUTZ (3 Schichten) ────────────

// 1. Honeypot-Feld (im Formular versteckt, muss leer sein)
if (!empty($_POST['website'])) {
    header('Location: /kontakt/danke/');
    exit;
}

// 2. Mathe-CAPTCHA prüfen (DSGVO-konform, kein Drittanbieter)
$captchaKey = 'L1aR-c4ptch4-2024';
$captchaInput = intval($_POST['captcha'] ?? -1);
$captchaHash  = $_POST['captcha_hash'] ?? '';

if (empty($captchaHash)) {
    header('Location: /kontakt/?fehler=captcha');
    exit;
}

// Hash-Format: answer:timestamp:hash
$parts = explode(':', $captchaHash);
if (count($parts) !== 3) {
    header('Location: /kontakt/?fehler=captcha');
    exit;
}

$expectedAnswer = intval($parts[0]);
$captchaTs      = intval($parts[1]);
$receivedHash   = $parts[2];

// Hash verifizieren
$raw = $expectedAnswer . ':' . $captchaTs . ':' . $captchaKey;
$hash = 0;
for ($i = 0; $i < strlen($raw); $i++) {
    $c = ord($raw[$i]);
    $hash = (($hash << 5) - $hash) + $c;
    $hash = $hash & 0xFFFFFFFF; // 32-bit int
    if ($hash > 0x7FFFFFFF) $hash -= 0x100000000;
}

if (abs($hash) != intval($receivedHash)) {
    header('Location: /kontakt/?fehler=captcha');
    exit;
}

// Antwort prüfen
if ($captchaInput !== $expectedAnswer) {
    header('Location: /kontakt/?fehler=captcha');
    exit;
}

// 3. Zeit-Check: Formular muss mind. 3 Sekunden offen gewesen sein
$formToken = intval($_POST['form_token'] ?? 0);
$nowMs = round(microtime(true) * 1000);
$elapsedMs = $nowMs - $formToken;

if ($formToken > 0 && $elapsedMs < 3000) {
    // Zu schnell ausgefüllt = Bot
    header('Location: /kontakt/danke/');
    exit;
}

// CAPTCHA-Token darf max. 30 Minuten alt sein
if ($formToken > 0 && $elapsedMs > 1800000) {
    header('Location: /kontakt/?fehler=timeout');
    exit;
}

// ── E-Mail-Body zusammenbauen ──────────────
$subjectRaw = 'Neue Anfrage von ' . strip_tags(trim($_POST['name'])) . ' (' . $eventCity . ')';
$subject    = '=?UTF-8?B?' . base64_encode($subjectRaw) . '?=';

$body  = "Neue Buchungsanfrage über liar-entertainer.com\n";
$body .= str_repeat('─', 50) . "\n\n";
$body .= "Name:                  {$name}\n";
$body .= "E-Mail:                {$email}\n";
if ($phone)     $body .= "Telefon:               {$phone}\n";
if ($eventDate) $body .= "Veranstaltungsdatum:   {$eventDate}\n";
if ($eventTime) $body .= "Gewünschte Uhrzeit:    {$eventTime}\n";
$body .= "Ort / Stadt:           {$eventCity}\n";
if ($eventType) $body .= "Art der Veranstaltung: {$eventType}\n";
$body .= "\n" . str_repeat('─', 50) . "\n";
$body .= "Nachricht:\n\n{$message}\n";
$body .= "\n" . str_repeat('─', 50) . "\n";
$body .= "Gesendet am: " . date('d.m.Y \u\m H:i') . " Uhr\n";
$body .= "IP-Adresse:  " . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt') . "\n";
$body .= "Seite:       " . ($_SERVER['HTTP_REFERER'] ?? '/kontakt/') . "\n";

// ── Versand via SMTP (bevorzugt) ───────────
$sent = false;

if (!empty(SMTP_PASS)) {
    $sent = sendViaSMTP($subject, $body, $email, $name);
}

// ── Fallback: PHP mail() ───────────────────
if (!$sent) {
    $headers  = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n";
    $headers .= "Reply-To: {$name} <" . strip_tags(trim($_POST['email'])) . ">\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    $sent = mail(MAIL_TO, $subject, $body, $headers);
}

// ── Weiterleitung ──────────────────────────
if ($sent) {
    header('Location: /kontakt/danke/');
} else {
    header('Location: /kontakt/?fehler=2');
}
exit;

// ============================================
// SMTP-Versand über fsockopen (kein externer Library nötig)
// Funktioniert auf IONOS Shared Hosting ohne Composer/PHPMailer
// ============================================
function sendViaSMTP(string $subject, string $body, string $replyEmail, string $replyName): bool {
    $smtp = @fsockopen('tls://' . SMTP_HOST, 465, $errno, $errstr, 10);
    if (!$smtp) {
        // Fallback: versuche STARTTLS auf Port 587
        $smtp = @fsockopen(SMTP_HOST, SMTP_PORT, $errno, $errstr, 10);
        if (!$smtp) return false;

        smtpRead($smtp);
        smtpCmd($smtp, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'liar-entertainer.com'));
        smtpCmd($smtp, "STARTTLS");

        if (!stream_socket_enable_crypto($smtp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT)) {
            fclose($smtp);
            return false;
        }
        smtpCmd($smtp, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'liar-entertainer.com'));
    } else {
        smtpRead($smtp);
        smtpCmd($smtp, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'liar-entertainer.com'));
    }

    // Authentifizierung
    smtpCmd($smtp, "AUTH LOGIN");
    smtpCmd($smtp, base64_encode(SMTP_USER));
    $authResult = smtpCmd($smtp, base64_encode(SMTP_PASS));

    if (strpos($authResult, '235') === false) {
        fclose($smtp);
        return false;
    }

    // Absender & Empfänger
    smtpCmd($smtp, "MAIL FROM:<" . MAIL_FROM . ">");
    smtpCmd($smtp, "RCPT TO:<" . MAIL_TO . ">");
    smtpCmd($smtp, "DATA");

    // E-Mail-Header + Body
    $msg  = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n";
    $msg .= "To: " . MAIL_TO . "\r\n";
    $msg .= "Reply-To: {$replyName} <{$replyEmail}>\r\n";
    $msg .= "Subject: {$subject}\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: 8bit\r\n";
    $msg .= "Date: " . date('r') . "\r\n";
    $msg .= "\r\n";
    $msg .= $body . "\r\n";
    $msg .= ".";

    smtpCmd($smtp, $msg);
    smtpCmd($smtp, "QUIT");
    fclose($smtp);

    return true;
}

function smtpCmd($smtp, string $cmd): string {
    fwrite($smtp, $cmd . "\r\n");
    return smtpRead($smtp);
}

function smtpRead($smtp): string {
    $response = '';
    stream_set_timeout($smtp, 10);
    while ($line = fgets($smtp, 515)) {
        $response .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return $response;
}
