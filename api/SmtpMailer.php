<?php
// ============================================
// Self-contained SMTP Mailer (no Composer needed)
// api/SmtpMailer.php
// Works with Gmail, Outlook, Yahoo via STARTTLS/SSL
// ============================================

class SmtpMailer {
    private string $host;
    private int    $port;
    private string $secure;   // 'tls' or 'ssl'
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;
    private        $socket = null;
    private array  $log    = [];

    public function __construct(
        string $host,
        int    $port,
        string $secure,
        string $username,
        string $password,
        string $fromEmail,
        string $fromName = ''
    ) {
        $this->host      = $host;
        $this->port      = $port;
        $this->secure    = strtolower($secure);
        $this->username  = $username;
        $this->password  = $password;
        $this->fromEmail = $fromEmail;
        $this->fromName  = $fromName ?: $fromEmail;
    }

    // ── Public API ──────────────────────────────────────────────────────

    /**
     * Send an email.
     *
     * @param string|array $to      Single address or ['email' => 'name'] or ['email1','email2']
     * @param string       $subject
     * @param string       $htmlBody  HTML content
     * @param string       $textBody  Plain-text fallback (auto-generated if empty)
     * @return true
     * @throws RuntimeException on failure
     */
    public function send($to, string $subject, string $htmlBody, string $textBody = ''): bool {
        $recipients = $this->normaliseRecipients($to);
        if (empty($recipients)) {
            throw new RuntimeException("No recipients specified.");
        }
        if (!$textBody) {
            $textBody = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $htmlBody));
        }

        $this->connect();
        $this->authenticate();

        // MAIL FROM
        $this->cmd("MAIL FROM:<{$this->fromEmail}>", 250);

        // RCPT TO for each recipient
        foreach ($recipients as $email => $name) {
            $this->cmd("RCPT TO:<{$email}>", [250, 251]);
        }

        // DATA
        $this->cmd("DATA", 354);

        $boundary = 'ATHENA_' . md5(uniqid('', true));
        $toHeader  = implode(', ', array_map(
            fn($e, $n) => $n !== $e ? "\"{$n}\" <{$e}>" : "<{$e}>",
            array_keys($recipients),
            array_values($recipients)
        ));
        $fromHeader = $this->fromName
            ? "=?UTF-8?B?" . base64_encode($this->fromName) . "?= <{$this->fromEmail}>"
            : $this->fromEmail;

        $headers  = "From: {$fromHeader}\r\n";
        $headers .= "To: {$toHeader}\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
        $headers .= "X-Mailer: Athena-SmtpMailer/1.0\r\n";
        $headers .= "Date: " . date('r') . "\r\n";

        $body  = "--{$boundary}\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= chunk_split(base64_encode($textBody)) . "\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= chunk_split(base64_encode($htmlBody)) . "\r\n";
        $body .= "--{$boundary}--\r\n";

        $this->write($headers . "\r\n" . $body . "\r\n.");
        $this->expect(250);

        $this->cmd("QUIT", 221);
        $this->close();
        return true;
    }

    public function getLog(): array { return $this->log; }

    // ── Internal helpers ─────────────────────────────────────────────────

    private function normaliseRecipients($to): array {
        // Accepts: 'a@b.com', ['a@b.com','c@d.com'], ['a@b.com'=>'Name']
        $out = [];
        if (is_string($to)) {
            $out[$to] = $to;
        } elseif (is_array($to)) {
            foreach ($to as $k => $v) {
                if (is_int($k)) {
                    $out[$v] = $v;
                } else {
                    $out[$k] = $v;
                }
            }
        }
        return $out;
    }

    private function connect(): void {
        $timeout = 15;
        if ($this->secure === 'ssl') {
            $addr = "ssl://{$this->host}:{$this->port}";
        } else {
            $addr = "tcp://{$this->host}:{$this->port}";
        }

        $ctx = stream_context_create([
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ]
        ]);

        $errno = $errstr = null;
        $this->socket = stream_socket_client($addr, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $ctx);
        if (!$this->socket) {
            throw new RuntimeException("SMTP connect failed ({$errno}): {$errstr}");
        }
        stream_set_timeout($this->socket, $timeout);
        $this->expect(220);

        // EHLO
        $domain = gethostname() ?: 'localhost';
        $this->cmd("EHLO {$domain}", 250);

        // STARTTLS upgrade for port 587
        if ($this->secure === 'tls') {
            $this->cmd("STARTTLS", 220);
            if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException("STARTTLS negotiation failed.");
            }
            // Re-EHLO after TLS
            $this->cmd("EHLO {$domain}", 250);
        }
    }

    private function authenticate(): void {
        $this->cmd("AUTH LOGIN", 334);
        $this->write(base64_encode($this->username));
        $this->expect(334);
        $this->write(base64_encode($this->password));
        $this->expect(235);
    }

    private function cmd(string $cmd, $expected): string {
        $this->write($cmd);
        return $this->expect($expected);
    }

    private function write(string $data): void {
        $this->log[] = "> " . (strlen($data) > 200 ? substr($data, 0, 200) . '…' : $data);
        fwrite($this->socket, $data . "\r\n");
    }

    private function expect($codes): string {
        $codes    = (array) $codes;
        $response = '';
        while (true) {
            $line = fgets($this->socket, 512);
            if ($line === false) break;
            $this->log[] = "< " . rtrim($line);
            $response   .= $line;
            // Multi-line responses end when the 4th char is a space
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $codes)) {
            throw new RuntimeException("SMTP expected " . implode('/', $codes) . ", got {$code}: " . trim($response));
        }
        return $response;
    }

    private function close(): void {
        if ($this->socket) {
            fclose($this->socket);
            $this->socket = null;
        }
    }
}
